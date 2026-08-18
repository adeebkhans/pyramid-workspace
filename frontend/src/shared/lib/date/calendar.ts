/**
 * Client-side twin of the API's date helpers. Dates are exchanged as display
 * strings (`"12 Sep 2026"`), so the calendar popover parses and formats with
 * exactly the same rules the server validates against.
 */

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAY_INITIALS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

export function formatDisplayDate(value: Date): string {
  return `${value.getUTCDate()} ${MONTH_NAMES[value.getUTCMonth()].slice(0, 3)} ${value.getUTCFullYear()}`;
}

export function parseDisplayDate(value?: string | null): Date | null {
  if (!value) return null;

  const parts = value.trim().split(/\s+/);
  if (parts.length === 3) {
    const monthIndex = MONTH_NAMES.findIndex(
      (month) => month.slice(0, 3).toLowerCase() === parts[1].toLowerCase(),
    );

    if (monthIndex !== -1) {
      const parsed = new Date(Date.UTC(Number(parts[2]), monthIndex, Number(parts[0])));
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function firstWeekdayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

export function isSameCalendarDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * True when `displayDate` is strictly before today (overdue).
 * Uses UTC for consistency with the API.
 */
export function isOverdue(value: string | null | undefined): boolean {
  if (!value) return false;
  const parsed = parseDisplayDate(value);
  if (!parsed) return false;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return parsed.getTime() < today.getTime();
}

/** "3 days ago" / "just now" — used by the comment and activity timestamps. */
export function formatRelative(isoTimestamp: string): string {
  const then = new Date(isoTimestamp);
  if (Number.isNaN(then.getTime())) return '';

  const elapsedMs = Date.now() - then.getTime();
  const minutes = Math.round(elapsedMs / 60_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
