import { CalendarDate } from '@internationalized/date';

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
