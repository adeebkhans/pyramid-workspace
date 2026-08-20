'use client';

import { Plus, User } from 'lucide-react';
import { useState } from 'react';

import { DueDateChip, LabelChip, OutlinedChip } from '@/shared/ui/chips';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import { ErrorPane } from '@/shared/ui/status-views';
import { ChecklistPanel } from './checklist-panel';
import { DetailRail } from './detail-rail';
import { DiscussionPanel } from './discussion-panel';
import { useTaskDetail } from './use-task-detail';

/**
 * The task detail screen: an editable document on the left, properties and
 * history on the right.
 *
 * Composition is the point — this file lays out four panels and owns nothing
 * but the description editor. Data, mutations and error handling all live in
 * `useTaskDetail`.
 */
export function TaskDetailView({ taskId }: { taskId: string }) {
  const detail = useTaskDetail(taskId);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');

  if (detail.isLoading) {
    return <div className="p-8 text-secondary text-sm">Loading task...</div>;
  }

  if (detail.error || !detail.task) {
    return <ErrorPane message={detail.error ?? 'That task could not be found.'} />;
  }

  const task = detail.task;

  const commitDescription = async () => {
    setIsEditingDescription(false);
    if (descriptionDraft !== (task.description ?? '')) {
      await detail.patch({ description: descriptionDraft });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-y-auto lg:overflow-hidden bg-surface">
      <div className="flex-1 flex flex-col min-w-0 lg:overflow-y-auto scrollbar-hide">
        <div className="px-8 py-6">
          <div className="w-full pr-4">
            <h1 className="text-[22px] font-bold text-primary mb-2 leading-tight">{task.title}</h1>

            {isEditingDescription ? (
              <textarea
                autoFocus
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                onBlur={() => void commitDescription()}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setIsEditingDescription(false);
                }}
                rows={4}
                aria-label="Task description"
                className="w-full text-[13px] text-secondary leading-relaxed mb-6 bg-transparent border border-default rounded-lg px-3 py-2 outline-none focus:border-neutral-400 resize-none placeholder:text-tertiary"
              />
            ) : (
              <p
                onClick={() => {
                  setDescriptionDraft(task.description ?? '');
                  setIsEditingDescription(true);
                }}
                className="text-[13px] text-secondary leading-relaxed mb-6 cursor-text hover:bg-neutral-200/20 rounded-lg px-1 py-0.5 -mx-1 transition-colors"
              >
                {task.description || 'Click to add a description...'}
              </p>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className="text-[12px] text-tertiary w-20 shrink-0">Properties</span>
              <div className="flex items-center gap-2 flex-wrap">
                {task.assignee ? (
                  <div className="flex items-center gap-1.5 border border-default rounded-full px-2.5 py-1 text-[12px]">
                    <MemberAvatar member={task.assignee} size={16} />
                    <span className="font-medium text-primary">{task.assignee.name}</span>
                  </div>
                ) : (
                  <OutlinedChip>
                    <User className="w-3 h-3" />
                    <span>Unassigned</span>
                  </OutlinedChip>
                )}
                {task.dueDate ? <DueDateChip date={task.dueDate} /> : <OutlinedChip>No due date</OutlinedChip>}
              </div>
            </div>

            <div className="flex items-start gap-3 mb-4">
              <span className="text-[12px] text-tertiary w-20 shrink-0 mt-1">Labels</span>
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map((label) => (
                  <LabelChip key={label} label={label} />
                ))}
                <button
                  type="button"
                  className="flex items-center gap-1 border border-dashed border-default rounded-full px-2 py-0.5 text-[11px] text-tertiary hover:bg-neutral-200/20 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-8">
              <span className="text-[12px] text-tertiary w-20 shrink-0 mt-2">Resources</span>
              <button
                type="button"
                className="flex items-center gap-2 text-[13px] text-tertiary border border-dashed border-default rounded-lg px-3 py-2 hover:bg-neutral-200/20 transition-colors text-left w-full max-w-[360px]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add document or link...
              </button>
            </div>

            <ChecklistPanel
              items={task.checklist}
              onAdd={detail.addChecklistItem}
              onToggle={detail.toggleChecklistItem}
              onRemove={detail.removeChecklistItem}
            />

            <DiscussionPanel
              comments={detail.comments}
              onPost={detail.postComment}
              onEdit={detail.editComment}
              onRemove={detail.removeComment}
            />
          </div>
        </div>
      </div>

      <DetailRail task={task} activity={detail.activity} onPatch={detail.patch} />
    </div>
  );
}
