import { Calendar, Tag as TagIcon } from 'lucide-react';

import { cx } from '@/shared/lib/cx';
import { isOverdue } from '@/shared/lib/date/calendar';

/** A label pill, as shown on board cards and in the task detail properties. */
export function LabelChip({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: '#F5F5F5', color: '#525252' }}
    >
      <TagIcon className="w-3 h-3" />
      {label}
    </div>
  );
}

/** Compact variant used inside the dense list-view cells. */
export function LabelTag({ label }: { label: string }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[10px] truncate max-w-15"
      style={{ backgroundColor: '#F5F5F5', color: '#525252' }}
    >
      {label}
    </span>
  );
}

export function OverflowTag({ count }: { count: number }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#F5F5F5', color: '#525252' }}>
      +{count}
    </span>
  );
}

export function DueDateChip({ date }: { date: string }) {
  const overdue = isOverdue(date);
  return (
    <div
      className={cx(
        'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        overdue ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
      )}
    >
      <Calendar className="w-3 h-3" />
      {date}
      {overdue && <span className="sr-only">(overdue)</span>}
    </div>
  );
}

/** The outlined variant used on the task detail properties row. */
export function OutlinedChip({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <div
      className={cx(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]',
        tone === 'danger'
          ? 'bg-red-50 text-red-400 border border-red-100 font-medium'
          : 'border border-default text-secondary',
      )}
    >
      {children}
    </div>
  );
}
