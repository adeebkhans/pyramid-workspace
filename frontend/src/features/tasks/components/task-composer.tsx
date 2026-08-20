'use client';

import { useEffect, useState } from 'react';

import { useIdentity } from '@/providers/identity-provider';
import type { Task } from '@/shared/domain/models';
import { PRIORITY_LEVELS, WORKFLOW_STATES, type PriorityLevel, type WorkflowState } from '@/shared/domain/workflow';
import { SelectField, TextField } from '@/shared/ui/controls';
import { ModalActions, ModalShell } from '@/shared/ui/modal-shell';
import type { TaskDraft } from '../api/tasks.gateway';

/**
 * The "Add Task" dialog.
 *
 * It never calls the API itself — it hands a draft to whoever opened it, so the
 * same dialog serves the board, the list, and the project detail screen, each of
 * which needs the new task to land in a different collection.
 */
export function TaskComposer({
  isOpen,
  onClose,
  onSubmit,
  defaultState = 'To Do',
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: TaskDraft) => Promise<Task | null>;
  defaultState?: WorkflowState;
  projectId?: string;
}) {
  const { actorId } = useIdentity();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [state, setState] = useState<WorkflowState>(defaultState);
  const [priority, setPriority] = useState<PriorityLevel>('No Priority');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // The board's per-column "+" pre-selects the column it was pressed in.
  useEffect(() => {
    if (isOpen) setState(defaultState);
  }, [isOpen, defaultState]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('No Priority');
    setDueDate('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);

    const created = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      state,
      priority,
      dueDate: dueDate.trim() || undefined,
      assigneeId: actorId ?? undefined,
      projectId,
    });

    setIsSaving(false);
    if (created) {
      reset();
      onClose();
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Add Task">
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <TextField
          label="Title *"
          value={title}
          onChange={setTitle}
          placeholder="What needs to be done?"
          autoFocus
          required
        />

        <div>
          <label className="block text-sm font-medium text-primary mb-1">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Add a description..."
            className="w-full border border-default rounded-md px-3 py-2 text-sm bg-surface text-primary focus:outline-none focus:border-neutral-400 resize-none placeholder:text-tertiary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Status" value={state} onChange={setState} options={WORKFLOW_STATES} />
          <SelectField label="Priority" value={priority} onChange={setPriority} options={PRIORITY_LEVELS} />
        </div>

        <TextField label="Due Date" value={dueDate} onChange={setDueDate} placeholder="e.g. 12 Sep 2026" />

        <ModalActions
          onCancel={onClose}
          submitLabel="Add Task"
          pendingLabel="Saving..."
          isPending={isSaving}
          isDisabled={!title.trim()}
        />
      </form>
    </ModalShell>
  );
}
