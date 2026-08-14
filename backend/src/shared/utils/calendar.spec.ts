import { isDateRangeInvalid, isDisplayDate, isOverdue, offsetDays, parseDisplayDate, toDisplayDate } from './calendar';

describe('calendar', () => {
  it('round-trips a display date', () => {
    const parsed = parseDisplayDate('12 Sep 2026');

    expect(parsed).not.toBeNull();
    expect(toDisplayDate(parsed as Date)).toBe('12 Sep 2026');
  });

  it('accepts a single-digit day', () => {
    expect(isDisplayDate('1 Aug 2026')).toBe(true);
  });

  it.each(['2026-09-12', '12 Sept 2026', 'tomorrow', '', '12 Xyz 2026'])('rejects %p', (value) => {
    expect(isDisplayDate(value)).toBe(false);
  });

  it('offsets relative to a fixed origin', () => {
    const origin = new Date(Date.UTC(2026, 7, 10));

    expect(offsetDays(5, origin)).toBe('15 Aug 2026');
    expect(offsetDays(-10, origin)).toBe('31 Jul 2026');
  });

  describe('isOverdue', () => {
    it('returns true for a date in the past', () => {
      expect(isOverdue('1 Jan 2020')).toBe(true);
    });

    it('returns false for a date in the far future', () => {
      expect(isOverdue('1 Jan 2099')).toBe(false);
    });

    it('returns false for null or empty', () => {
      expect(isOverdue(null)).toBe(false);
      expect(isOverdue('')).toBe(false);
    });
  });

  describe('isDateRangeInvalid', () => {
    it('returns true when dueDate is before startDate', () => {
      expect(isDateRangeInvalid('10 Aug 2026', '1 Aug 2026')).toBe(true);
    });

    it('returns false when dueDate is after startDate', () => {
      expect(isDateRangeInvalid('1 Aug 2026', '10 Aug 2026')).toBe(false);
    });

    it('returns false when either date is missing', () => {
      expect(isDateRangeInvalid(null, '10 Aug 2026')).toBe(false);
      expect(isDateRangeInvalid('1 Aug 2026', null)).toBe(false);
    });
  });
});
