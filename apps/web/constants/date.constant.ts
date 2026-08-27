import { formatDistanceToNowStrict, format, parseISO } from 'date-fns';

/** date-fns format strings — import these instead of inlining patterns. */
export const DateFormat = {
  MONTH_DAY: 'MMM d',
  MONTH_DAY_PAD: 'MMM dd',
  MONTH_DAY_ORDINAL: 'MMM do',
  MONTH: 'MMM',
  DAY: 'd',
  MONTH_YEAR: 'MMM yyyy',
  MONTH_LONG: 'MMMM',
  MONTH_DAY_YEAR: 'MMM d, yyyy',
  MONTH_DAY_PAD_YEAR: 'MMM dd, yyyy',
  ISO_DATE: 'yyyy-MM-dd',
  RANGE_END_DAY_YEAR: 'd, yyyy',
} as const;

export type DateFormatValue = (typeof DateFormat)[keyof typeof DateFormat];

export const DATE_LOCALE = 'en-US';

export const LOCAL_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

export const LOCAL_TIME_REFRESH_MS = 30_000;

/** Length of `YYYY-MM-DD` in an ISO datetime string. */
export const ISO_DATE_LENGTH = 10;

/** Length of `YYYY-MM` in an ISO datetime string. */
export const ISO_MONTH_LENGTH = 7;

export const UTC_SHORT_MONTH_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  timeZone: 'UTC',
};

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : parseISO(value);
}

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNowStrict(toDate(iso), { addSuffix: true });
}

export function formatDate(value: Date | string, pattern: DateFormatValue): string {
  return format(toDate(value), pattern);
}

export function formatIsoDayOrdinal(iso?: string, empty = '—'): string {
  return iso ? formatDate(iso, DateFormat.MONTH_DAY_ORDINAL) : empty;
}

/** Current year → "Mar 17"; otherwise "Oct 2023". */
export function formatJoinedLabel(iso: string, now = new Date()): string {
  const date = toDate(iso);
  return date.getFullYear() === now.getFullYear()
    ? formatDate(date, DateFormat.MONTH_DAY)
    : formatDate(date, DateFormat.MONTH_YEAR);
}

/** UTC calendar date (`YYYY-MM-DD`) from an ISO datetime. */
export function toIsoDate(date = new Date()): string {
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
}

export function toIsoMonth(date: Date): string {
  return date.toISOString().slice(0, ISO_MONTH_LENGTH);
}

export function formatUtcMonth(date: Date): string {
  return new Intl.DateTimeFormat(DATE_LOCALE, UTC_SHORT_MONTH_FORMAT).format(date);
}

export function formatLocalTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    ...LOCAL_TIME_FORMAT,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}
