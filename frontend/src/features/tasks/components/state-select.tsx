'use client';

import { ChevronDown } from 'lucide-react';

import { WORKFLOW_STATES, STATE_DOT, STATE_TEXT, type WorkflowState } from '@/shared/domain/workflow';
import { useDismissable } from '@/shared/hooks/use-dismissable';

/** Inline workflow-state picker used on the task detail rail. */
export function StateSelect({
  value,
  onChange,
}: {
  value: WorkflowState;
  onChange: (state: WorkflowState) => void;
}) {
  const { isOpen, toggle, close, ref } = useDismissable<HTMLDivElement>();

  const choose = (state: WorkflowState) => {
    onChange(state);
    close();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1.5 rounded-md px-2 py-0.5 hover:bg-neutral-200/20 transition-colors"
      >
        <div className={`w-1.5 h-1.5 rounded-full ${STATE_DOT[value]}`} />
        <span className={`text-[12px] font-medium ${STATE_TEXT[value]}`}>{value}</span>
        <ChevronDown className="w-3 h-3 text-tertiary" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 w-[140px] bg-surface border border-default rounded-lg shadow-lg z-50 py-1"
        >
          {WORKFLOW_STATES.map((state) => (
            <button
              key={state}
              type="button"
              role="option"
              aria-selected={value === state}
              onClick={() => choose(state)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-neutral-200/20 transition-colors"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${STATE_DOT[state]}`} />
              <span className={STATE_TEXT[state]}>{state}</span>
              {value === state && <span className="ml-auto text-primary text-[11px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
