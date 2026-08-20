'use client';

import { GripVertical, MoreHorizontal, Plus } from 'lucide-react';

import type { Task } from '@/shared/domain/models';
import { BOARD_COLUMNS, type WorkflowState } from '@/shared/domain/workflow';
import { cx } from '@/shared/lib/cx';
import { groupByState } from '../hooks/use-task-collection';
import { useBoardDrag } from '../hooks/use-board-drag';
import { TaskCard } from './task-card';

/**
 * The Kanban board.
 *
 * Columns are real drop targets: a card can be dragged between them or
 * repositioned inside one, and the resulting order is written back to the API.
 * The drag bookkeeping lives in `useBoardDrag` so this component stays a
 * layout.
 */
export function BoardCanvas({
  tasks,
  onAddTask,
  onReorder,
}: {
  tasks: Task[];
  onAddTask: (state: WorkflowState) => void;
  onReorder: (state: WorkflowState, orderedIds: string[]) => void | Promise<void>;
}) {
  const drag = useBoardDrag(onReorder);
  const columns = groupByState(tasks);

  return (
    <div className="flex gap-4 overflow-x-auto p-6 flex-1 min-h-0 snap-x snap-mandatory md:snap-none items-start">
      {BOARD_COLUMNS.map((state) => {
        const cards = columns.get(state) ?? [];
        const isDropTarget = drag.hoveredColumn === state && drag.draggingId !== null;

        return (
          <section
            key={state}
            aria-label={`${state} column`}
            onDragOver={(event) => drag.onColumnDragOver(event, state)}
            onDragLeave={() => drag.onColumnDragLeave(state)}
            onDrop={(event) => drag.onColumnDrop(event, state, cards)}
            className={cx(
              'flex flex-col w-[272px] min-w-[272px] shrink-0 snap-center md:snap-align-none bg-column-bg border border-default rounded-xl p-2',
              isDropTarget && 'is-drop-target',
            )}
          >
            <div className="flex items-center gap-1.5 px-1 py-1.5 mb-1">
              <GripVertical className="w-3.5 h-3.5 text-neutral-400 cursor-grab shrink-0" />
              <span className="text-[13px] font-semibold text-primary flex-1">{state}</span>
              <button
                type="button"
                onClick={() => onAddTask(state)}
                aria-label={`Add task to ${state}`}
                className="p-1 hover:bg-surface rounded text-neutral-400"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button type="button" aria-label={`${state} column options`} className="p-1 hover:bg-surface rounded text-neutral-400">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {cards.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isDragging={drag.draggingId === task.id}
                  onDragStart={(event) => drag.onCardDragStart(event, task)}
                  onDragEnd={drag.onCardDragEnd}
                  onDragOver={(event) => drag.onCardDragOver(event, task.id)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => onAddTask(state)}
              className="text-left mt-2 px-2 py-1.5 text-[13px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              + Add Task
            </button>
          </section>
        );
      })}
    </div>
  );
}
