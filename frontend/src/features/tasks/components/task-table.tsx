'use client';

import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { Task } from '@/shared/domain/models';
import { LIST_GROUPS, type WorkflowState } from '@/shared/domain/workflow';
import { DEFAULT_VISIBLE_FIELDS, visibleColumns, type TaskField } from './table-columns';

/**
 * The grouped list view: one collapsible table per workflow state.
 *
 * Below `sm` each row restacks into a card and every cell grows its own label,
 * which is why the column descriptors carry a header string rather than the
 * table drawing a single `<thead>`.
 */
function TaskGroup({
  state,
  tasks,
  fields,
  onAddTask,
}: {
  state: WorkflowState;
  tasks: Task[];
  fields: TaskField[];
  onAddTask?: (state: WorkflowState) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const columns = visibleColumns(fields);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex items-center gap-2 w-full px-3 py-2"
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-secondary" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-secondary" />
        )}
        <span className="text-[13px] font-semibold text-secondary">{state}</span>
      </button>

      {isExpanded && (
        <div className="border border-default rounded-lg overflow-hidden">
          <div className="hidden sm:flex items-center px-3 py-2 bg-column-bg text-[12px] font-medium text-secondary">
            <div className="flex-[2] min-w-0">Task</div>
            {columns.map((column) => (
              <div key={column.field} className={column.headerClass}>
                {column.field}
              </div>
            ))}
            <div className="w-[60px] shrink-0 text-right">Actions</div>
          </div>

          <div className="flex flex-col">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex flex-col sm:flex-row sm:items-center px-3 py-3 border-t border-default hover:bg-neutral-200/20 transition-colors group cursor-pointer text-[13px] gap-2 sm:gap-0 outline-none"
              >
                <div className="flex-[2] min-w-0 font-medium text-primary pr-4 flex justify-between items-start">
                  <span className="truncate">{task.title}</span>
                  <button
                    type="button"
                    aria-label="Task actions"
                    onClick={(event) => event.preventDefault()}
                    className="sm:hidden text-neutral-400 p-1"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {columns.map((column) => (
                  <div key={column.field} className={column.cellClass}>
                    <span className="sm:hidden text-secondary text-[12px] w-16">{column.field}</span>
                    {column.render(task)}
                  </div>
                ))}

                <div className="hidden sm:flex w-[60px] shrink-0 justify-end">
                  <button
                    type="button"
                    aria-label="Task actions"
                    onClick={(event) => event.preventDefault()}
                    className="text-neutral-400 p-1 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => onAddTask?.(state)}
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-neutral-400 hover:bg-neutral-200/20 border-t border-default transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TaskTable({
  tasks,
  fields = DEFAULT_VISIBLE_FIELDS,
  onAddTask,
}: {
  tasks: Task[];
  fields?: TaskField[];
  onAddTask?: (state: WorkflowState) => void;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-6 pb-6">
      <div className="rounded-lg overflow-hidden bg-surface">
        {LIST_GROUPS.map((state) => (
          <TaskGroup
            key={state}
            state={state}
            tasks={tasks.filter((task) => task.state === state)}
            fields={fields}
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </div>
  );
}
