import dayjs, { type Dayjs } from 'dayjs';

/**
 * Weekdays in Monday-first display order, as dayjs `.day()` numbers
 * (0=Sun … 6=Sat). Labels are pulled from the active dayjs locale (nl).
 */
export function weekdayOptions(): { label: string; value: number }[] {
    const mondayFirst = [1, 2, 3, 4, 5, 6, 0];
    return mondayFirst.map((value) => {
        const name = dayjs().day(value).format('dddd');
        return {
            label: name.charAt(0).toUpperCase() + name.slice(1),
            value,
        };
    });
}

/** Monday of the week containing `date` (app is Monday-first). */
export function startOfWeekMonday(date: Dayjs = dayjs()): Dayjs {
    const day = date.day(); // 0=Sun … 6=Sat
    const diff = day === 0 ? 6 : day - 1; // days since Monday
    return date.startOf('day').subtract(diff, 'day');
}

/** The 7 days (Mon→Sun) of the week containing `date`. */
export function weekDays(date: Dayjs = dayjs()): Dayjs[] {
    const monday = startOfWeekMonday(date);
    return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day'));
}

/**
 * The next date (today or later) whose weekday is one of `trainingDays`.
 * Falls back to today when no training days are configured.
 */
export function nextTrainingDate(trainingDays: number[] = []): Date {
    if (!trainingDays.length) return dayjs().startOf('day').toDate();
    const today = dayjs().startOf('day');
    for (let i = 0; i < 14; i++) {
        const candidate = today.add(i, 'day');
        if (trainingDays.includes(candidate.day())) {
            return candidate.toDate();
        }
    }
    return today.toDate();
}
