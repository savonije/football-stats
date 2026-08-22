import dayjs, { type Dayjs } from 'dayjs';
import type { Timestamp } from 'firebase/firestore';

import type { Training } from '@/types';

/**
 * Weekdays in Monday-first display order, as dayjs `.day()` numbers
 * (0=Sun … 6=Sat). Labels are pulled from the active dayjs locale (nl).
 */
export const weekdayOptions = (): { label: string; value: number }[] => {
    const mondayFirst = [1, 2, 3, 4, 5, 6, 0];
    return mondayFirst.map((value) => {
        const name = dayjs().day(value).format('dddd');
        return {
            label: name.charAt(0).toUpperCase() + name.slice(1),
            value,
        };
    });
};

/**
 * All dates within the month of `month` whose weekday is one of
 * `trainingDays`. Used to bulk-generate a month of training sessions.
 */
export const trainingDatesInMonth = (
    month: Date | Dayjs,
    trainingDays: number[],
): Date[] => {
    if (!trainingDays.length) return [];
    const start = dayjs(month).startOf('month');
    const dates: Date[] = [];
    for (let d = 0; d < start.daysInMonth(); d++) {
        const date = start.add(d, 'day');
        if (trainingDays.includes(date.day())) {
            dates.push(date.toDate());
        }
    }
    return dates;
};

/**
 * The full grid of days to render a Monday-first month calendar: every day of
 * `month` plus the leading/trailing days needed to complete whole weeks.
 */
export const monthCalendarDays = (month: Date | Dayjs): Dayjs[] => {
    const start = dayjs(month).startOf('month');
    const end = dayjs(month).endOf('month');

    const leading = start.day() === 0 ? 6 : start.day() - 1; // days since Mon
    const trailing = end.day() === 0 ? 0 : 7 - end.day(); // days until Sun

    const gridStart = start.subtract(leading, 'day');
    const totalDays = end.add(trailing, 'day').diff(gridStart, 'day') + 1;

    return Array.from({ length: totalDays }, (_, i) => gridStart.add(i, 'day'));
};

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';

/** Whether a training's day is today or still to come. */
const isUpcomingTraining = (
    date: Timestamp | undefined,
    now: Date = new Date(),
): boolean => !date || !dayjs(date.toDate()).isBefore(dayjs(now), 'day');

/**
 * Attendance of one player at one training. Present and absent are both stored
 * explicitly, so a player in neither array has simply not been marked yet —
 * which is exactly what a coach needs to see for a training still to come.
 * For a training whose day has passed, never being marked has always counted
 * as absent (that is what the attendance percentage is based on), so there the
 * unmarked state resolves to absent instead of lingering as neutral.
 */
export const attendanceStatus = (
    playerId: string,
    training: Pick<Training, 'date' | 'presentPlayerIds' | 'absentPlayerIds'>,
    now: Date = new Date(),
): AttendanceStatus => {
    if (training.presentPlayerIds?.includes(playerId)) return 'present';
    if (training.absentPlayerIds?.includes(playerId)) return 'absent';

    return isUpcomingTraining(training.date, now) ? 'unmarked' : 'absent';
};
