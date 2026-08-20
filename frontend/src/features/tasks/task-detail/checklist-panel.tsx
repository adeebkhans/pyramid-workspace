'use client';

import { MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { ChecklistItem } from '@/shared/domain/models';
import { cx } from '@/shared/lib/cx';
import { isOverdue } from '@/shared/lib/date/calendar';
import { CollapsibleSection } from '@/shared/ui/collapsible-section';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { PriorityMeter } from '@/shared/ui/priority-meter';

/**
 * Subtasks.
 *
 * Items are embedded documents on the parent task, so the whole checklist
 * arrives with the task in a single read. Adding, ticking off and deleting each
 * persist immediately; the panel holds no draft state beyond the row being
 * composed.
 */
export function ChecklistPanel({
  items,
  onAdd,
  onToggle,
  onRemove,
}: {
  items: ChecklistItem[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (itemId: string, completed: boolean) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}) {
  const [isComposing, setIsComposing] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  const commit = async () => {
    const title = draftTitle.trim();
    setDraftTitle('');
    setIsComposing(false);
    if (title) await onAdd(title);
  };

  return (
    <CollapsibleSection title="Subtasks" className="mb-4 pr-4">
      <div className="border border-default rounded-xl overflow-hidden">
        <div className="flex items-center px-4 py-4 border-b border-default text-[11px] font-bold text-primary uppercase tracking-wide">
          <div className="w-1/5 min-w-0">Task</div>
          <div className="w-1/5">Priority</div>
          <div className="w-1/5">Members</div>
          <div className="w-1/5">Due Date</div>
          <div className="w-1/5 text-right">Actions</div>
        </div>

        {isComposing && (
          <div className="flex items-center px-4 py-3 border-b border-default bg-neutral-50 dark:bg-neutral-800/30">
            <Plus className="w-3.5 h-3.5 text-tertiary mr-2 shrink-0" />
            <input
              autoFocus
              type="text"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void commit();
                if (event.key === 'Escape') {
                  setDraftTitle('');
                  setIsComposing(false);
                }
              }}
              onBlur={() => void commit()}
              placeholder="Subtask title... (Enter to save, Esc to cancel)"
              className="flex-1 text-[13px] text-primary bg-transparent outline-none placeholder:text-tertiary"
            />
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center px-4 py-3.5 text-[13px] hover:bg-neutral-200/20 transition-colors border-b border-default"
          >
            <div className="w-1/5 min-w-0 flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(event) => void onToggle(item.id, event.target.checked)}
                aria-label={`Mark "${item.title}" ${item.completed ? 'incomplete' : 'complete'}`}
                className="w-3.5 h-3.5 shrink-0 accent-neutral-900 dark:accent-neutral-100"
              />
              <span
                className={cx(
                  'font-medium truncate',
                  item.completed ? 'text-tertiary line-through' : 'text-primary',
                )}
              >
                {item.title}
              </span>
            </div>
            <div className="w-1/5">
              <PriorityMeter priority={item.priority} />
            </div>
            <div className="w-1/5">
              <MemberAvatar member={item.assignee} size={20} />
            </div>
            <div className="w-1/5 text-[12px] text-secondary">
              {item.dueDate ? (
                <span className={cx(isOverdue(item.dueDate) && !item.completed && 'text-red-500 font-medium')}>
                  {item.dueDate}
                </span>
              ) : (
                '—'
              )}
            </div>
            <div className="w-1/5 flex justify-end gap-1">
              <button
                type="button"
                onClick={() => void onRemove(item.id)}
                aria-label={`Delete "${item.title}"`}
                className="text-tertiary hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button type="button" aria-label="Subtask options" className="text-tertiary hover:text-secondary">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIsComposing(true)}
          className="flex items-center gap-2 px-4 py-3.5 text-[13px] text-tertiary hover:bg-neutral-200/20 dark:hover:bg-neutral-800/30 w-full text-left transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Subtask
        </button>
      </div>
    </CollapsibleSection>
  );
}
