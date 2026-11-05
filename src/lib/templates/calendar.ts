import { icons } from '../icons';
import type { FieldError, TemplateDef } from './types';

/**
 * Field values of the calendar template. `start`/`end` hold `<input type="datetime-local">`
 * values (`YYYY-MM-DDTHH:mm[:ss]`) for timed events, `<input type="date">` values
 * (`YYYY-MM-DD`) for all-day events. The all-day end date is inclusive.
 */
export type CalendarValues = {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  description: string;
};

/** A parsed date or date-time; the time is 00:00:00 when the input has none. */
type Parts = { y: number; mo: number; d: number; h: number; mi: number; s: number };

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** Parses `YYYY-MM-DD` with an optional `THH:mm[:ss]`; null if malformed or out of range. */
function parse(value: string): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((x) => Number(x ?? 0)) as number[];
  const p = { y, mo, d, h, mi, s } as Parts;
  const date = new Date(0);
  date.setUTCFullYear(p.y, p.mo - 1, p.d);
  const valid =
    date.getUTCFullYear() === p.y &&
    date.getUTCMonth() === p.mo - 1 &&
    date.getUTCDate() === p.d &&
    p.h < 24 &&
    p.mi < 60 &&
    p.s < 60;
  return valid ? p : null;
}

/** `YYYYMMDD` of the date part, optionally shifted by whole days (calendar arithmetic, no DST). */
function dateValue(p: Parts, addDays = 0): string {
  const date = new Date(0);
  date.setUTCFullYear(p.y, p.mo - 1, p.d + addDays);
  return `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** The local time (browser time zone) as a timestamp in ms. */
function localTime(p: Parts): number {
  const date = new Date(0);
  date.setFullYear(p.y, p.mo - 1, p.d);
  date.setHours(p.h, p.mi, p.s, 0);
  return date.getTime();
}

/** The local time converted to UTC as `YYYYMMDDTHHMMSSZ`. */
function utcValue(p: Parts): string {
  const t = new Date(localTime(p));
  return (
    `${pad(t.getUTCFullYear(), 4)}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}` +
    `T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}${pad(t.getUTCSeconds())}Z`
  );
}

/** Escapes a trimmed text value per RFC 5545: `\`, `;`, `,` and line breaks. */
function escapeText(text: string): string {
  return text
    .trim()
    .replace(/[\\;,]/g, (c) => `\\${c}`)
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** Converts a date-time value to its date (`YYYY-MM-DD`), e.g. when switching to all-day. Unparseable values are returned unchanged. */
export function toDateOnly(value: string): string {
  const p = parse(value);
  return p ? `${pad(p.y, 4)}-${pad(p.mo)}-${pad(p.d)}` : value;
}

/** Converts a date value to a date-time at 09:00, e.g. when switching off all-day. Values that already have a time, or don't parse, are returned unchanged. */
export function toDateTime(value: string): string {
  const s = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && parse(s) ? `${s}T09:00` : value;
}

/** Calendar template: a bare iCalendar `VEVENT`; timed events in UTC, all-day events as dates. */
export const calendar: TemplateDef<CalendarValues> = {
  id: 'calendar',
  icon: icons.calendar,
  empty: () => ({ title: '', start: '', end: '', allDay: false, location: '', description: '' }),
  isEmpty: (v) =>
    [v.title, v.start, v.end, v.location, v.description].every((s) => s.trim() === ''),
  validate: (v) => {
    const errors: FieldError<CalendarValues>[] = [];
    const start = parse(v.start);
    const end = parse(v.end);
    if (v.start.trim() === '') {
      if ([v.title, v.end, v.location, v.description].some((s) => s.trim() !== '')) {
        errors.push({ field: 'start', key: 'required' });
      }
    } else if (!start) errors.push({ field: 'start', key: 'invalidDate' });
    if (v.end.trim() !== '' && !end) errors.push({ field: 'end', key: 'invalidDate' });
    if (start && end) {
      const before = v.allDay
        ? dateValue(end) < dateValue(start)
        : localTime(end) < localTime(start);
      if (before) errors.push({ field: 'end', key: 'endBeforeStart' });
    }
    return errors;
  },
  encode: (v) => {
    const start = parse(v.start);
    const end = parse(v.end);
    const lines = ['BEGIN:VEVENT'];
    const title = escapeText(v.title);
    if (title) lines.push(`SUMMARY:${title}`);
    if (start && v.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dateValue(start)}`);
      lines.push(`DTEND;VALUE=DATE:${dateValue(end ?? start, 1)}`);
    } else if (start) {
      lines.push(`DTSTART:${utcValue(start)}`);
      if (end) lines.push(`DTEND:${utcValue(end)}`);
    }
    const location = escapeText(v.location);
    if (location) lines.push(`LOCATION:${location}`);
    const description = escapeText(v.description);
    if (description) lines.push(`DESCRIPTION:${description}`);
    lines.push('END:VEVENT');
    return lines.join('\r\n');
  },
};
