import '@/config/dayjs';
import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vite-plus/test';

import {
    attendancePercentage,
    attendanceStatus,
    heldTrainings,
    monthCalendarDays,
    trainingDatesInMonth,
    trainingsInPeriod,
} from '@/utils/training';

// Thursday 15 October 2026, midday.
const NOW = new Date(2026, 9, 15, 12);

const training = (
    month: number,
    day: number,
    rest: {
        presentPlayerIds?: string[];
        absentPlayerIds?: string[];
        cancelled?: boolean;
    } = {},
) => ({
    date: Timestamp.fromDate(new Date(2026, month - 1, day, 18)),
    ...rest,
});

describe('attendanceStatus', () => {
    it('reads explicit marks', () => {
        const t = training(10, 1, {
            presentPlayerIds: ['anna'],
            absentPlayerIds: ['bram'],
        });

        expect(attendanceStatus('anna', t, NOW)).toBe('present');
        expect(attendanceStatus('bram', t, NOW)).toBe('absent');
    });

    it('leaves unmarked players neutral today and later, absent once past', () => {
        expect(attendanceStatus('anna', training(10, 15), NOW)).toBe(
            'unmarked',
        );
        expect(attendanceStatus('anna', training(10, 20), NOW)).toBe(
            'unmarked',
        );
        expect(attendanceStatus('anna', training(10, 14), NOW)).toBe('absent');
    });
});

describe('heldTrainings', () => {
    it('drops cancelled and future trainings, and today until attendance is taken', () => {
        const past = training(10, 1);
        const todayTaken = training(10, 15, { absentPlayerIds: ['anna'] });

        const held = heldTrainings(
            [
                past,
                training(10, 2, { cancelled: true }),
                training(10, 15),
                todayTaken,
                training(10, 16, { presentPlayerIds: ['anna'] }),
            ],
            NOW,
        );

        expect(held).toEqual([past, todayTaken]);
    });
});

describe('attendancePercentage', () => {
    it('rounds the share of held trainings attended', () => {
        const trainings = [
            training(10, 1, { presentPlayerIds: ['anna'] }),
            training(10, 6, { presentPlayerIds: ['anna'] }),
            training(10, 8),
            training(10, 20, { presentPlayerIds: ['anna'] }),
        ];

        expect(attendancePercentage('anna', trainings, NOW)).toBe(67);
    });

    it('is zero without held trainings', () => {
        expect(attendancePercentage('anna', [training(10, 20)], NOW)).toBe(0);
    });
});

describe('trainingsInPeriod', () => {
    const monday = training(10, 12);
    const sunday = training(10, 18);
    const nextMonday = training(10, 19);
    const november = training(11, 1);
    const all = [monday, sunday, nextMonday, november];

    it('uses Monday-first weeks', () => {
        expect(trainingsInPeriod(all, 'week', new Date(2026, 9, 18))).toEqual([
            monday,
            sunday,
        ]);
    });

    it('filters by calendar month', () => {
        expect(trainingsInPeriod(all, 'month', NOW)).toEqual([
            monday,
            sunday,
            nextMonday,
        ]);
    });

    it('returns everything for the total', () => {
        expect(trainingsInPeriod(all, 'total', NOW)).toBe(all);
    });
});

describe('trainingDatesInMonth', () => {
    it('lists every chosen weekday in the month', () => {
        const days = trainingDatesInMonth(NOW, [2, 4]).map((d) => d.getDate());
        expect(days).toEqual([1, 6, 8, 13, 15, 20, 22, 27, 29]);
    });

    it('is empty without training days', () => {
        expect(trainingDatesInMonth(NOW, [])).toEqual([]);
    });
});

describe('monthCalendarDays', () => {
    it('pads the month out to whole Monday-first weeks', () => {
        const days = monthCalendarDays(NOW);

        expect(days).toHaveLength(35);
        expect(days[0]?.isSame(dayjs('2026-09-28'), 'day')).toBe(true);
        expect(days.at(-1)?.isSame(dayjs('2026-11-01'), 'day')).toBe(true);
    });
});
