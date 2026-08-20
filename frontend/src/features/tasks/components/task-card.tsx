'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

import type { Task } from '@/shared/domain/models';
import { cx } from '@/shared/lib/cx';
import { DueDateChip, LabelChip } from '@/shared/ui/chips';
import { MemberAvatar } from '@/shared/ui/member-avatar';

/**
 * A single board card. Draggable, and still a link — the anchor keeps
 * middle-click, keyboard focus and "open in new tab" working, which a
 * div-with-onClick would throw away.
 */
export function TaskCard({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  task: Task;
  isDragging: boolean;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (event: React.DragEvent) => void;
}) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={cx(
        'bg-surface border border-default rounded-lg p-3 hover:bg-neutral-200/20 hover:border-neutral-300 transition-colors block shadow-sm outline-none cursor-grab active:cursor-grabbing',
        isDragging && 'is-dragging',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-primary flex-1 leading-snug">{task.title}</h3>
        <button
          type="button"
          aria-label="Task actions"
          onClick={(event) => event.preventDefault()}
          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 shrink-0 mt-0.5"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5">
          <MemberAvatar member={task.assignee} size={20} />
          {task.assignee && <span className="text-[11px] text-secondary font-medium">{task.assignee.name}</span>}
        </div>
        {task.dueDate && <DueDateChip date={task.dueDate} />}
      </div>

      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {task.labels.map((label) => (
            <LabelChip key={label} label={label} />
          ))}
        </div>
      )}
    </Link>
  );
}
