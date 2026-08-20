'use client';

import { Check, ChevronDown } from 'lucide-react';

import { PRIORITY_LEVELS, type PriorityLevel } from '@/shared/domain/workflow';
import { useDismissable } from '@/shared/hooks/use-dismissable';
import { PriorityMeter } from '@/shared/ui/priority-meter';

/** Inline priority picker used on the task detail rail. */
export function PrioritySelect({
  value,
  onChange,
}: {
  value: PriorityLevel;
  onChange: (priority: PriorityLevel) => void;
}) {
  const { isOpen, toggle, close, ref } = useDismissable<HTMLDivElement>();

  const choose = (priority: PriorityLevel) => {
    onChange(priority);
    close();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-1 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 px-1 py-0.5 rounded -ml-1 transition-colors"
      >
        <PriorityMeter priority={value} />
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full left-0 mt-1 w-[140px] bg-surface border border-default rounded-lg shadow-lg z-50 py-1"
        >
          {PRIORITY_LEVELS.map((priority) => (
            <button
              key={priority}
              type="button"
              role="option"
              aria-selected={value === priority}
              onClick={() => choose(priority)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <PriorityMeter priority={priority} />
              {value === priority && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
