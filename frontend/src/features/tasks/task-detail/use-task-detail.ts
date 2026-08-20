'use client';

import { useCallback } from 'react';

import { useIdentity } from '@/providers/identity-provider';
import { useToast } from '@/providers/toast-provider';
import type { ActivityEntry, Comment, Task } from '@/shared/domain/models';
import { useAsyncResource } from '@/shared/hooks/use-async-resource';
import { describeError } from '@/shared/lib/http/api-client';
import { activityGateway, commentsGateway, tasksGateway, type TaskPatch } from '../api/tasks.gateway';

export interface TaskDetail {
  task: Task | null;
  comments: Comment[];
  activity: ActivityEntry[];
  isLoading: boolean;
  error: string | null;
  patch: (changes: TaskPatch) => Promise<void>;
  addChecklistItem: (title: string) => Promise<void>;
  toggleChecklistItem: (itemId: string, completed: boolean) => Promise<void>;
  removeChecklistItem: (itemId: string) => Promise<void>;
  postComment: (body: string, parentId?: string) => Promise<void>;
  editComment: (commentId: string, body: string) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
}

/**
 * Everything the task detail screen needs, behind one interface.
 *
 * The three resources load independently — a slow activity query must not hold
 * up the task itself — and every mutation refreshes only what it could have
 * changed. Edits also refresh the activity stream, since the server records the
 * diff as a side effect of the write.
 */
export function useTaskDetail(taskId: string): TaskDetail {
  const { actorId } = useIdentity();
  const { reportError } = useToast();

  const taskResource = useAsyncResource<Task>((signal) => tasksGateway.get(taskId, signal), [taskId]);
  const commentResource = useAsyncResource<Comment[]>((signal) => commentsGateway.thread(taskId, signal), [taskId]);
  const activityResource = useAsyncResource<ActivityEntry[]>(
    (signal) => activityGateway.forTask(taskId, signal),
    [taskId],
  );

  /** Runs a mutation, applies the returned task, and re-reads the history. */
  const withTask = useCallback(
    async (operation: () => Promise<Task>) => {
      try {
        taskResource.set(await operation());
        void activityResource.refresh();
      } catch (cause) {
        reportError(describeError(cause));
        void taskResource.refresh();
      }
    },
    [activityResource, reportError, taskResource],
  );

  const withComments = useCallback(
    async (operation: () => Promise<unknown>) => {
      try {
        await operation();
        await commentResource.refresh();
        void activityResource.refresh();
      } catch (cause) {
        reportError(describeError(cause));
      }
    },
    [activityResource, commentResource, reportError],
  );

  return {
    task: taskResource.data,
    comments: commentResource.data ?? [],
    activity: activityResource.data ?? [],
    isLoading: taskResource.isLoading,
    error: taskResource.error,

    patch: (changes) => withTask(() => tasksGateway.update(taskId, changes, actorId)),

    addChecklistItem: (title) => withTask(() => tasksGateway.addChecklistItem(taskId, { title }, actorId)),

    toggleChecklistItem: (itemId, completed) =>
      withTask(() => tasksGateway.toggleChecklistItem(taskId, itemId, completed, actorId)),

    removeChecklistItem: (itemId) => withTask(() => tasksGateway.removeChecklistItem(taskId, itemId, actorId)),

    postComment: async (body, parentId) => {
      if (!actorId) {
        reportError('Sign in again to post a comment.');
        return;
      }
      await withComments(() => commentsGateway.post({ body, taskId, authorId: actorId, parentId }));
    },

    editComment: (commentId, body) => withComments(() => commentsGateway.edit(commentId, body)),

    removeComment: (commentId) => withComments(() => commentsGateway.remove(commentId)),
  };
}
