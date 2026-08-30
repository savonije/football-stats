import { CalendarDate } from '@internationalized/date';

/**
 * Nuxt UI's date components speak `@internationalized/date`, while the rest of
 * the app (and Firestore, via `Timestamp.toDate()`) speaks plain `Date`. These
 * two functions are the whole bridge.
 */
export const toCalendarDate = (date: Date | null | undefined) =>
    date
        ? new CalendarDate(
              date.getFullYear(),
              date.getMonth() + 1,
              date.getDate(),
          )
        : undefined;

export const fromCalendarDate = (value: CalendarDate | null | undefined) =>
    value ? new Date(value.year, value.month - 1, value.day) : null;
