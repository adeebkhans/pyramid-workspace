'use client';

import { useCallback, useMemo } from 'react';

import { useIdentity } from '@/providers/identity-provider';
import { useToast } from '@/providers/toast-provider';
import type { Task } from '@/shared/domain/models';
import type { WorkflowState } from '@/shared/domain/workflow';
import { useAsyncResource } from '@/shared/hooks/use-async-resource';
import { describeError } from '@/shared/lib/http/api-client';
import { tasksGateway, type TaskDraft, type TaskFilters } from '../api/tasks.gateway';

export interface TaskCollection {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  add: (draft: TaskDraft) => Promise<Task | null>;
  /** Moves cards between columns and persists the destination order. */
  reorder: (state: WorkflowState, orderedIds: string[]) => Promise<void>;
}

/**
 * Owns the task list for a screen: loading, in-place mutation, and the
 * optimistic reorder the board depends on.
 *
 * Reordering applies locally first so the card lands under the cursor with no
 * latency, then reconciles with the server. If the write fails the previous
 * order is restored and the user is told — an optimistic update that never
 * admits failure is just a lie.
 */
export function useTaskCollection(filters: TaskFilters = {}): TaskCollection {
  const { actorId } = useIdentity();
  const { reportError } = useToast();

  // Serialised so the effect re-runs on value changes, not identity changes.
  const filterKey = JSON.stringify(filters);

  const resource = useAsyncResource<Task[]>(
    (signal) => tasksGateway.list(JSON.parse(filterKey) as TaskFilters, signal),
    [filterKey],
  );

  const tasks = useMemo(() => resource.data ?? [], [resource.data]);

  const add = useCallback(
    async (draft: TaskDraft): Promise<Task | null> => {
      try {
        const created = await tasksGateway.create(draft, actorId);
        resource.set((current) => [...(current ?? []), created]);
        return created;
      } catch (cause) {
        reportError(describeError(cause));
        return null;
      }
    },
    [actorId, reportError, resource],
  );

  const reorder = useCallback(
    async (state: WorkflowState, orderedIds: string[]) => {
      const previous = resource.data ?? [];

      resource.set(
        previous.map((task) => {
          const position = orderedIds.indexOf(task.id);
          if (position === -1) return task;
          return { ...task, state, boardOrder: (position + 1) * 1_000 };
        }),
      );

      try {
        await tasksGateway.placeOnBoard(state, orderedIds, actorId);
      } catch (cause) {
        resource.set(previous);
        reportError(describeError(cause));
      }
    },
    [actorId, reportError, resource],
  );

  return {
    tasks,
    isLoading: resource.isLoading,
    error: resource.error,
    reload: resource.refresh,
    add,
    reorder,
  };
}

/** Groups a flat list into board columns, preserving manual order. */
export function groupByState(tasks: Task[]): Map<WorkflowState, Task[]> {
  const grouped = new Map<WorkflowState, Task[]>();

  for (const task of tasks) {
    const bucket = grouped.get(task.state);
    if (bucket) bucket.push(task);
    else grouped.set(task.state, [task]);
  }

  for (const bucket of grouped.values()) {
    bucket.sort((left, right) => left.boardOrder - right.boardOrder);
  }

  return grouped;
}
