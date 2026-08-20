import type { ReactNode } from 'react';

import type { Task } from '@/shared/domain/models';
import { STATE_DOT, STATE_TEXT } from '@/shared/domain/workflow';
import { LabelTag, OverflowTag } from '@/shared/ui/chips';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { PriorityMeter } from '@/shared/ui/priority-meter';

export const TOGGLEABLE_FIELDS = ['Priority', 'Members', 'Due Date', 'Labels', 'Status', 'Reporter'] as const;
export type TaskField = (typeof TOGGLEABLE_FIELDS)[number];

export const DEFAULT_VISIBLE_FIELDS: TaskField[] = ['Priority', 'Members', 'Due Date'];

export interface TaskColumn {
  field: TaskField;
  /**
   * Width classes are written out in full rather than composed from a number:
   * Tailwind scans source text, so `sm:w-[${n}px]` would never be generated.
   */
  headerClass: string;
  cellClass: string;
  render: (task: Task) => ReactNode;
}

const NARROW_HEADER = 'w-[100px] shrink-0';
const NARROW_CELL = 'flex sm:w-[100px] shrink-0 items-center gap-2';
const MEDIUM_HEADER = 'w-[120px] shrink-0';
const MEDIUM_CELL = 'flex sm:w-[120px] shrink-0 items-center gap-2';
const WIDE_HEADER = 'w-[140px] shrink-0';
const WIDE_CELL = 'flex sm:w-[140px] shrink-0 items-center gap-2';

/**
 * The list view's columns, described as data.
 *
 * Each entry carries the three things a cell needs — its header text, its width
 * classes and how to render a value. That keeps the table body a single `map`,
 * lets the Fields menu show or hide any column without adding a branch to the
 * JSX, and makes a new column a matter of appending one object here.
 */
export const TASK_COLUMNS: readonly TaskColumn[] = [
  {
    field: 'Priority',
    headerClass: MEDIUM_HEADER,
    cellClass: MEDIUM_CELL,
    render: (task) => <PriorityMeter priority={task.priority} />,
  },
  {
    field: 'Status',
    headerClass: MEDIUM_HEADER,
    cellClass: MEDIUM_CELL,
    render: (task) => (
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${STATE_DOT[task.state]}`} />
        <span className={`text-[12px] font-medium ${STATE_TEXT[task.state]}`}>{task.state}</span>
      </div>
    ),
  },
  {
    field: 'Members',
    headerClass: NARROW_HEADER,
    cellClass: NARROW_CELL,
    render: (task) => <MemberAvatar member={task.assignee} size={18} />,
  },
  {
    field: 'Due Date',
    headerClass: MEDIUM_HEADER,
    cellClass: `${MEDIUM_CELL} text-primary`,
    render: (task) => <>{task.dueDate ?? '-'}</>,
  },
  {
    field: 'Labels',
    headerClass: WIDE_HEADER,
    cellClass: WIDE_CELL,
    render: (task) => (
      <div className="flex gap-1 overflow-hidden">
        {task.labels.slice(0, 2).map((label) => (
          <LabelTag key={label} label={label} />
        ))}
        {task.labels.length > 2 && <OverflowTag count={task.labels.length - 2} />}
      </div>
    ),
  },
  {
    field: 'Reporter',
    headerClass: NARROW_HEADER,
    cellClass: NARROW_CELL,
    render: (task) => <MemberAvatar member={task.reporter} size={18} />,
  },
];

export function visibleColumns(fields: TaskField[]): TaskColumn[] {
  return TASK_COLUMNS.filter((column) => fields.includes(column.field));
}
