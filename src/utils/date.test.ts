import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vite-plus/test';

import {
    fromCalendarDate,
    hasKickoffTime,
    isInPeriod,
    toCalendarDate,
} from '@/utils/date';

describe('isInPeriod', () => {
    const period = { start: '2026-09-01', end: '2026-12-31' };

    it('includes both ends of the period, whatever the time of day', () => {
        expect(isInPeriod(new Date(2026, 8, 1, 0, 0), period)).toBe(true);
        expect(isInPeriod(new Date(2026, 11, 31, 23, 30), period)).toBe(true);
    });

    it('excludes the days just outside', () => {
        expect(isInPeriod(new Date(2026, 7, 31, 23, 59), period)).toBe(false);
        expect(isInPeriod(new Date(2027, 0, 1), period)).toBe(false);
    });
});

describe('hasKickoffTime', () => {
    it('reads midnight as no kickoff', () => {
        expect(hasKickoffTime(new Date(2026, 9, 17))).toBe(false);
        expect(hasKickoffTime(new Date(2026, 9, 17, 0, 15))).toBe(true);
        expect(hasKickoffTime(new Date(2026, 9, 17, 9))).toBe(true);
    });
});

describe('CalendarDate bridge', () => {
    it('round-trips a date at local midnight', () => {
        const calendar = toCalendarDate(new Date(2026, 0, 31, 18));

        expect(calendar?.compare(new CalendarDate(2026, 1, 31))).toBe(0);
        expect(fromCalendarDate(calendar)).toEqual(new Date(2026, 0, 31));
    });

    it('passes empty values through', () => {
        expect(toCalendarDate(null)).toBeUndefined();
        expect(fromCalendarDate(undefined)).toBeNull();
    });
});
