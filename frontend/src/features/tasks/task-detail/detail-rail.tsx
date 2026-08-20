'use client';

import { Eye, Lock, MoreHorizontal, PanelRight, Plus, Settings, Share2, Users } from 'lucide-react';
import { useState } from 'react';

import type { ActivityEntry, Task } from '@/shared/domain/models';
import type { PriorityLevel, WorkflowState } from '@/shared/domain/workflow';
import { formatRelative } from '@/shared/lib/date/calendar';
import { CollapsibleSection } from '@/shared/ui/collapsible-section';
import { MemberAvatar } from '@/shared/ui/member-avatar';
import type { TaskPatch } from '../api/tasks.gateway';
import { DateField } from '../components/date-field';
import { PrioritySelect } from '../components/priority-select';
import { StateSelect } from '../components/state-select';

const RAIL_BUTTON =
  'w-9 h-9 flex items-center justify-center text-secondary border border-default rounded-lg bg-surface hover:bg-neutral-200/20 dark:hover:bg-neutral-800 transition-colors';

/** Placeholder team chips — teams are out of scope for this build. */
const TEAM_CHIPS = ['Design Team', 'Product'];

/**
 * The right-hand rail: quick actions, the editable property list, and the
 * activity stream.
 *
 * Every control here writes through immediately — status, priority, both dates
 * and labels all persist on change, and the Updates card reflects the resulting
 * audit entries.
 */
export function DetailRail({
  task,
  activity,
  onPatch,
}: {
  task: Task;
  activity: ActivityEntry[];
  onPatch: (changes: TaskPatch) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full lg:w-[400px] shrink-0 bg-surface flex flex-col lg:overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-end gap-2 px-4 py-4 shrink-0 pr-6">
        <button type="button" aria-label="Task visibility" className={RAIL_BUTTON}>
          <Lock className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Watchers"
          className="h-9 px-3 flex items-center gap-1.5 border border-default rounded-lg bg-surface hover:bg-neutral-200/20 dark:hover:bg-neutral-800 transition-colors"
        >
          <Eye className="w-4 h-4 text-blue-500" />
          <span className="text-[13px] font-medium text-blue-500">1</span>
        </button>
        <button type="button" aria-label="Share task" className={RAIL_BUTTON}>
          <Share2 className="w-4 h-4" />
        </button>
        <button type="button" aria-label="Task actions" className={RAIL_BUTTON}>
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-label={isOpen ? 'Collapse details' : 'Expand details'}
          aria-expanded={isOpen}
          className={RAIL_BUTTON}
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="px-4 pt-10 pb-6 space-y-4 pr-6">
          <div className="border border-default rounded-xl p-4">
            <CollapsibleSection
              title="Details"
              size="sm"
              headerSpacing="mb-4"
              trailing={
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Add property" className="text-tertiary hover:text-secondary p-0.5">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Property settings"
                    className="text-tertiary hover:text-secondary p-0.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              }
            >
              <div className="space-y-3">
                <PropertyRow label="Status">
                  <StateSelect
                    value={task.state}
                    onChange={(state: WorkflowState) => void onPatch({ state })}
                  />
                </PropertyRow>

                <PropertyRow label="Priority">
                  <PrioritySelect
                    value={task.priority}
                    onChange={(priority: PriorityLevel) => void onPatch({ priority })}
                  />
                </PropertyRow>

                <PropertyRow label="Members">
                  <div className="flex items-center gap-1.5">
                    <MemberAvatar member={task.assignee} size={20} />
                    <span className="text-[12px] text-primary">{task.assignee?.name ?? 'Unassigned'}</span>
                    <button
                      type="button"
                      aria-label="Add member"
                      className="w-5 h-5 rounded-full border border-dashed border-default flex items-center justify-center text-tertiary hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </PropertyRow>

                <PropertyRow label="Dates" align="start">
                  <div className="flex items-center gap-1 flex-1">
                    <div className="w-[90px] h-[26px] shrink-0 border border-default rounded-full px-2.5 flex items-center">
                      <DateField
                        placeholder="+ Start"
                        value={task.startDate}
                        onChange={(startDate) => void onPatch({ startDate })}
                      />
                    </div>
                    <span className="text-tertiary text-[10px] shrink-0">→</span>
                    <div className="w-[90px] h-[26px] shrink-0 border border-default rounded-full px-2.5 flex items-center">
                      <DateField
                        placeholder="+ End"
                        value={task.dueDate}
                        align="right"
                        onChange={(dueDate) => void onPatch({ dueDate })}
                      />
                    </div>
                  </div>
                </PropertyRow>

                <PropertyRow label="Labels" align="start">
                  <LabelEditor
                    labels={task.labels}
                    onChange={(labels) => void onPatch({ labels })}
                  />
                </PropertyRow>

                <PropertyRow label="Teams" align="start">
                  <div className="flex flex-wrap gap-1">
                    {TEAM_CHIPS.map((team) => (
                      <span
                        key={team}
                        className="text-[11px] border border-default text-secondary rounded-full px-2 py-0.5 flex items-center gap-1"
                      >
                        <Users className="w-2.5 h-2.5" />
                        {team}
                      </span>
                    ))}
                  </div>
                </PropertyRow>

                <PropertyRow label="Reporter">
                  <div className="flex items-center gap-1.5">
                    <MemberAvatar member={task.reporter} size={20} />
                    <span className="text-[12px] text-primary">{task.reporter?.name ?? '—'}</span>
                  </div>
                </PropertyRow>
              </div>
            </CollapsibleSection>
          </div>

          <div className="border border-default rounded-xl p-4">
            <CollapsibleSection title="Updates" size="sm">
              <div className="space-y-3">
                {activity.length === 0 ? (
                  <p className="text-[12px] text-tertiary">No changes recorded yet.</p>
                ) : (
                  activity.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0">
                        <MemberAvatar member={entry.actor} size={16} />
                      </div>
                      <div>
                        <p className="text-[12px] text-secondary leading-snug">
                          <span className="font-semibold text-primary">{entry.actor?.name ?? 'Someone'}</span>{' '}
                          {entry.summary}
                        </p>
                        <span className="text-[11px] text-tertiary">{formatRelative(entry.occurredAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleSection>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyRow({
  label,
  children,
  align = 'center',
}: {
  label: string;
  children: React.ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div className={align === 'start' ? 'flex items-start gap-2' : 'flex items-center gap-2'}>
      <span className={`text-[12px] text-tertiary w-[80px] shrink-0${align === 'start' ? ' mt-0.5' : ''}`}>
        {label}
      </span>
      {children}
    </div>
  );
}

/** Adds and removes labels; new names are created on the server on demand. */
function LabelEditor({ labels, onChange }: { labels: string[]; onChange: (labels: string[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    const name = draft.trim();
    setDraft('');
    setIsAdding(false);
    if (name && !labels.includes(name)) onChange([...labels, name]);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(labels.filter((entry) => entry !== label))}
          title={`Remove ${label}`}
          className="text-[11px] border border-default text-secondary rounded-full px-2 py-0.5 hover:border-red-300 hover:text-red-500 transition-colors"
        >
          {label}
        </button>
      ))}

      {isAdding ? (
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') {
              setDraft('');
              setIsAdding(false);
            }
          }}
          placeholder="Label"
          className="text-[11px] border border-default rounded-full px-2 py-0.5 w-20 bg-transparent text-primary outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="text-[11px] text-tertiary border border-dashed border-default rounded-full px-2 py-0.5 hover:bg-neutral-200/20 transition-colors"
        >
          + Add
        </button>
      )}
    </div>
  );
}
