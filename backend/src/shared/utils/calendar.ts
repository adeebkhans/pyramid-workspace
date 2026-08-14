/**
 * Dates travel over the wire as `"12 Sep 2026"` because that is exactly what
 * the design renders, and round-tripping a display string avoids an entire
 * class of timezone bugs for a field that has no time component.
 *
 * These helpers are the only place that format is written down.
 */

const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const DISPLAY_DATE_PATTERN = /^\d{1,2} [A-Za-z]{3} \d{4}$/;

export function toDisplayDate(value: Date): string {
  return `${value.getUTCDate()} ${MONTH_ABBREVIATIONS[value.getUTCMonth()]} ${value.getUTCFullYear()}`;
}

export function parseDisplayDate(value: string): Date | null {
  const match = DISPLAY_DATE_PATTERN.exec(value.trim());
  if (!match) return null;

  const [day, month, year] = value.trim().split(/\s+/);
  const monthIndex = MONTH_ABBREVIATIONS.findIndex(
    (abbreviation) => abbreviation.toLowerCase() === month.toLowerCase(),
  );
  if (monthIndex < 0) return null;

  const parsed = new Date(Date.UTC(Number(year), monthIndex, Number(day)));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isDisplayDate(value: unknown): value is string {
  return typeof value === 'string' && parseDisplayDate(value) !== null;
}

/** `offsetDays(14)` → the display date two weeks from today. */
export function offsetDays(days: number, from: Date = new Date()): string {
  const shifted = new Date(from);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return toDisplayDate(shifted);
}

/**
 * Returns today's date in UTC, stripped of time components.
 * Used for comparing display-date strings against "now".
 */
export function todayUTCDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * True when `displayDate` is strictly before today (overdue).
 * `null` and malformed strings are treated as not-overdue.
 */
export function isOverdue(value: string | null | undefined): boolean {
  if (!value) return false;
  const parsed = parseDisplayDate(value);
  if (!parsed) return false;
  return parsed.getTime() < todayUTCDate().getTime();
}

/**
 * True when `dueDate` is before `startDate` (invalid range).
 * Both must be valid display-date strings.
 */
export function isDateRangeInvalid(startDate: string | null | undefined, dueDate: string | null | undefined): boolean {
  if (!startDate || !dueDate) return false;
  const start = parseDisplayDate(startDate);
  const end = parseDisplayDate(dueDate);
  if (!start || !end) return false;
  return end.getTime() < start.getTime();
}
