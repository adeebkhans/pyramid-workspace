'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useDismissable } from '@/shared/hooks/use-dismissable';
import { cx } from '@/shared/lib/cx';
import {
  MONTH_NAMES,
  WEEKDAY_INITIALS,
  daysInMonth,
  firstWeekdayOfMonth,
  formatDisplayDate,
  isSameCalendarDay,
  parseDisplayDate,
} from '@/shared/lib/date/calendar';

const POPOVER_WIDTH = 240;
const VIEWPORT_MARGIN = 8;

/**
 * A date trigger with a month-grid popover.
 *
 * The popover is positioned `fixed` against the trigger's measured rectangle
 * rather than absolutely inside it: the field sits in a 90px pill inside an
 * overflow-hidden rail, and an absolutely-positioned calendar would be clipped.
 * The measured position is then clamped so the panel never leaves the viewport.
 */
export function DateField({
  value,
  placeholder,
  onChange,
  align = 'left',
}: {
  value?: string | null;
  placeholder: string;
  onChange?: (date: string) => void;
  align?: 'left' | 'right';
}) {
  const today = new Date();
  const selected = parseDisplayDate(value);

  const { isOpen, toggle, close, ref } = useDismissable<HTMLDivElement>();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });

  const [viewYear, setViewYear] = useState((selected ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState((selected ?? today).getMonth());

  // Follow the value when the parent replaces it (e.g. after a server refresh).
  useEffect(() => {
    const parsed = parseDisplayDate(value);
    if (!parsed) return;
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
  }, [value]);

  const openCalendar = () => {
    const bounds = triggerRef.current?.getBoundingClientRect();

    if (bounds) {
      const preferred = align === 'right' ? bounds.right - POPOVER_WIDTH : bounds.left;
      const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_MARGIN;
      setAnchor({ top: bounds.bottom + 6, left: Math.min(Math.max(preferred, VIEWPORT_MARGIN), maxLeft) });
    }

    toggle();
  };

  const stepMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const choose = (day: number) => {
    const picked = new Date(viewYear, viewMonth, day);
    onChange?.(formatDisplayDate(picked));
    close();
  };

  const leadingBlanks = firstWeekdayOfMonth(viewYear, viewMonth);
  const dayCount = daysInMonth(viewYear, viewMonth);

  return (
    <div className="w-full overflow-hidden" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={openCalendar}
        className={cx(
          'text-[12px] transition-colors outline-none truncate block w-full text-left hover:text-secondary',
          selected ? 'text-primary' : 'text-tertiary',
        )}
      >
        {selected ? formatDisplayDate(selected) : placeholder}
      </button>

      {isOpen && (
        <div
          style={{ position: 'fixed', top: anchor.top, left: anchor.left, zIndex: 9999 }}
          className="w-[240px] bg-surface border border-default rounded-lg shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-primary">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => stepMonth(-1)}
                aria-label="Previous month"
                className="p-1 hover:bg-neutral-200/40 rounded text-secondary outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => stepMonth(1)}
                aria-label="Next month"
                className="p-1 hover:bg-neutral-200/40 rounded text-secondary outline-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_INITIALS.map((weekday) => (
              <div key={weekday} className="text-[10px] font-medium text-tertiary">
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <div key={`blank-${index}`} />
            ))}

            {Array.from({ length: dayCount }, (_, index) => {
              const day = index + 1;
              const cellDate = new Date(viewYear, viewMonth, day);
              const isChosen = isSameCalendarDay(selected, cellDate);
              const isToday = isSameCalendarDay(today, cellDate);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => choose(day)}
                  className={cx(
                    'w-7 h-7 flex items-center justify-center rounded-full text-xs transition-colors outline-none',
                    isChosen
                      ? 'bg-neutral-900 text-white'
                      : isToday
                        ? 'border border-neutral-400 text-primary'
                        : 'text-primary hover:bg-neutral-200/40',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
