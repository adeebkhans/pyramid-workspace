'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { cx } from '@/shared/lib/cx';

/**
 * A heading with a rotating chevron that folds its contents away.
 *
 * Shared by Subtasks, Details and Updates on the task page and by each status
 * group in the list view, so the chevron rotation, spacing and `aria-expanded`
 * wiring are stated once.
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  trailing,
  size = 'md',
  headerSpacing = 'mb-3',
  className,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  trailing?: ReactNode;
  size?: 'sm' | 'md';
  /** Gap between the heading and its contents; the design varies it per card. */
  headerSpacing?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const chevronSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={className}>
      <div className={cx('flex items-center justify-between', headerSpacing)}>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          className={cx(
            'flex items-center hover:opacity-70 transition-opacity',
            size === 'sm' ? 'gap-1.5' : 'gap-2',
          )}
        >
          <ChevronDown
            className={cx(chevronSize, 'text-secondary transition-transform', !isOpen && '-rotate-90')}
          />
          <span className="text-[13px] font-semibold text-primary">{title}</span>
        </button>
        {trailing}
      </div>
      {isOpen && children}
    </div>
  );
}
