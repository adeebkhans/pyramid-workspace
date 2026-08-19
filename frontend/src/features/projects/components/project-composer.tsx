'use client';

import { useState } from 'react';

import type { Project } from '@/shared/domain/models';
import { PRIORITY_LEVELS, type PriorityLevel } from '@/shared/domain/workflow';
import { SelectField, TextField } from '@/shared/ui/controls';
import { ModalActions, ModalShell } from '@/shared/ui/modal-shell';
import type { ProjectDraft } from '../api/projects.gateway';

/** The "Add Project" dialog. Mirrors {@link TaskComposer}'s contract. */
export function ProjectComposer({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: ProjectDraft) => Promise<Project | null>;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('No Priority');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    const created = await onSubmit({
      title: title.trim(),
      priority,
      dueDate: dueDate.trim() || undefined,
    });
    setIsSaving(false);

    if (created) {
      setTitle('');
      setPriority('No Priority');
      setDueDate('');
      onClose();
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Add Project">
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <TextField label="Title *" value={title} onChange={setTitle} placeholder="Project name" autoFocus required />

        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Priority" value={priority} onChange={setPriority} options={PRIORITY_LEVELS} />
          <TextField label="Due Date" value={dueDate} onChange={setDueDate} placeholder="e.g. 12 Sep 2026" />
        </div>

        <ModalActions
          onCancel={onClose}
          submitLabel="Add Project"
          pendingLabel="Saving..."
          isPending={isSaving}
          isDisabled={!title.trim()}
        />
      </form>
    </ModalShell>
  );
}
