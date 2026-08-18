'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

/**
 * The dialog chrome: backdrop, card, title row and close affordance.
 *
 * The behaviour a dialog is expected to have — Escape to dismiss, a click on
 * the backdrop, a locked body scroll and the right ARIA roles — lives here, so
 * every dialog in the app gets all of it by construction rather than by
 * remembering to add it.
 */
export function ModalShell({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="bg-surface border border-default rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-default flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-secondary hover:text-primary leading-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Footer row shared by the dialogs: a ghost cancel and a primary submit. */
export function ModalActions({
  onCancel,
  submitLabel,
  pendingLabel,
  isPending,
  isDisabled,
}: {
  onCancel: () => void;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  isDisabled: boolean;
}) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isDisabled || isPending}
        className="btn-primary px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </div>
  );
}
