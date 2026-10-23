import { CalendarDate } from '@internationalized/date';
import dayjs from 'dayjs';

import type { SeasonPeriod } from '@/types';

export const toCalendarDate = (date: Date | null | undefined) =>
    date
        ? new CalendarDate(
              date.getFullYear(),
              date.getMonth() + 1,
              date.getDate(),
          )
        : undefined;

/** Matches without a known kickoff are stored at midnight. */
export const hasKickoffTime = (date: Date) =>
    date.getHours() !== 0 || date.getMinutes() !== 0;

export const fromCalendarDate = (value: CalendarDate | null | undefined) =>
    value ? new Date(value.year, value.month - 1, value.day) : null;

export const isInPeriod = (date: Date, period: SeasonPeriod) => {
    const day = dayjs(date).format('YYYY-MM-DD');
    return day >= period.start && day <= period.end;
};
