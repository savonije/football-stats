import dayjs, { type Dayjs } from 'dayjs';

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
