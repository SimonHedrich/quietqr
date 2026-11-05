// Fix the time zone before any Date use, so local → UTC conversion is deterministic.
process.env.TZ = 'Europe/Berlin';

import { describe, expect, test } from 'vitest';
import { roundTrip } from '../../../tests/scan/helpers';
import { calendar, toDateOnly, toDateTime, type CalendarValues } from './calendar';

const values = (v: Partial<CalendarValues>): CalendarValues => ({ ...calendar.empty(), ...v });
const lines = (...l: string[]) => l.join('\r\n');

describe('calendar template', () => {
  test('timed event: local time in UTC, exact payload', () => {
    expect(
      calendar.encode(
        values({
          title: 'Team meeting',
          start: '2026-11-05T14:00',
          end: '2026-11-05T15:00',
          location: 'Room 1',
          description: 'Quarterly review',
        }),
      ),
    ).toBe(
      lines(
        'BEGIN:VEVENT',
        'SUMMARY:Team meeting',
        'DTSTART:20261105T130000Z',
        'DTEND:20261105T140000Z',
        'LOCATION:Room 1',
        'DESCRIPTION:Quarterly review',
        'END:VEVENT',
      ),
    );
  });

  test('summer time, seconds and day rollover', () => {
    expect(calendar.encode(values({ start: '2026-07-01T14:00' }))).toBe(
      lines('BEGIN:VEVENT', 'DTSTART:20260701T120000Z', 'END:VEVENT'),
    );
    expect(calendar.encode(values({ start: '2026-07-01T14:00:30' }))).toContain(
      'DTSTART:20260701T120030Z',
    );
    expect(calendar.encode(values({ start: '2027-01-01T00:30' }))).toContain(
      'DTSTART:20261231T233000Z',
    );
  });

  test('empty optional fields are omitted', () => {
    expect(calendar.encode(values({ start: '2026-11-05T14:00' }))).toBe(
      lines('BEGIN:VEVENT', 'DTSTART:20261105T130000Z', 'END:VEVENT'),
    );
    expect(calendar.encode(values({ title: '  ', start: '2026-11-05T14:00', location: ' ' }))).toBe(
      lines('BEGIN:VEVENT', 'DTSTART:20261105T130000Z', 'END:VEVENT'),
    );
  });

  test('all-day: dates, exclusive end, rollover', () => {
    expect(
      calendar.encode(
        values({ title: 'Trip', allDay: true, start: '2026-11-05', end: '2026-11-07' }),
      ),
    ).toBe(
      lines(
        'BEGIN:VEVENT',
        'SUMMARY:Trip',
        'DTSTART;VALUE=DATE:20261105',
        'DTEND;VALUE=DATE:20261108',
        'END:VEVENT',
      ),
    );
    expect(calendar.encode(values({ allDay: true, start: '2026-11-05' }))).toBe(
      lines(
        'BEGIN:VEVENT',
        'DTSTART;VALUE=DATE:20261105',
        'DTEND;VALUE=DATE:20261106',
        'END:VEVENT',
      ),
    );
    expect(calendar.encode(values({ allDay: true, start: '2026-12-31' }))).toContain(
      'DTEND;VALUE=DATE:20270101',
    );
    expect(
      calendar.encode(values({ allDay: true, start: '2026-02-27', end: '2026-02-28' })),
    ).toContain('DTEND;VALUE=DATE:20260301');
    // DST change (2026-03-29 in Berlin) doesn't shift dates.
    expect(
      calendar.encode(values({ allDay: true, start: '2026-03-29', end: '2026-03-29' })),
    ).toContain('DTEND;VALUE=DATE:20260330');
  });

  test('lenient: all-day ignores a time, timed treats a bare date as 00:00', () => {
    expect(calendar.encode(values({ allDay: true, start: '2026-11-05T23:30' }))).toContain(
      'DTSTART;VALUE=DATE:20261105',
    );
    expect(calendar.encode(values({ start: '2026-11-05' }))).toContain('DTSTART:20261104T230000Z');
  });

  test('text escaping per RFC 5545', () => {
    const payload = calendar.encode(
      values({
        title: ' a;b,c\\d ',
        start: '2026-11-05T14:00',
        location: 'Main St. 1, Berlin',
        description: 'line 1\nline 2\r\nline 3;x',
      }),
    );
    expect(payload).toBe(
      lines(
        'BEGIN:VEVENT',
        'SUMMARY:a\\;b\\,c\\\\d',
        'DTSTART:20261105T130000Z',
        'LOCATION:Main St. 1\\, Berlin',
        'DESCRIPTION:line 1\\nline 2\\nline 3\\;x',
        'END:VEVENT',
      ),
    );
  });

  test('unicode is kept', () => {
    expect(
      calendar.encode(values({ title: 'Grüße 🎉 会议', start: '2026-11-05T14:00' })),
    ).toContain('SUMMARY:Grüße 🎉 会议');
  });

  test('isEmpty ignores allDay', () => {
    expect(calendar.isEmpty(calendar.empty())).toBe(true);
    expect(calendar.isEmpty(values({ allDay: true, title: '  ' }))).toBe(true);
    expect(calendar.isEmpty(values({ description: 'x' }))).toBe(false);
    expect(calendar.isEmpty(values({ start: '2026-11-05T14:00' }))).toBe(false);
  });

  test('validation', () => {
    expect(calendar.validate(calendar.empty())).toEqual([]);
    expect(calendar.validate(values({ title: 'x' }))).toEqual([
      { field: 'start', key: 'required' },
    ]);
    expect(calendar.validate(values({ start: '2026-11-05T14:00' }))).toEqual([]);
    expect(calendar.validate(values({ start: 'tomorrow', end: '2026-02-30' }))).toEqual([
      { field: 'start', key: 'invalidDate' },
      { field: 'end', key: 'invalidDate' },
    ]);
    expect(calendar.validate(values({ start: '2026-11-05T25:00' }))).toEqual([
      { field: 'start', key: 'invalidDate' },
    ]);
    expect(
      calendar.validate(values({ start: '2026-11-05T14:00', end: '2026-11-05T13:59' })),
    ).toEqual([{ field: 'end', key: 'endBeforeStart' }]);
    expect(
      calendar.validate(values({ start: '2026-11-05T14:00', end: '2026-11-05T14:00' })),
    ).toEqual([]);
    expect(
      calendar.validate(values({ allDay: true, start: '2026-11-05', end: '2026-11-05' })),
    ).toEqual([]);
    expect(
      calendar.validate(
        values({ allDay: true, start: '2026-11-05T18:00', end: '2026-11-05T08:00' }),
      ),
    ).toEqual([]);
    expect(
      calendar.validate(values({ allDay: true, start: '2026-11-05', end: '2026-11-04' })),
    ).toEqual([{ field: 'end', key: 'endBeforeStart' }]);
  });

  test('toDateOnly and toDateTime', () => {
    expect(toDateOnly('2026-11-05T14:00')).toBe('2026-11-05');
    expect(toDateOnly('2026-11-05')).toBe('2026-11-05');
    expect(toDateOnly('')).toBe('');
    expect(toDateOnly('garbage')).toBe('garbage');
    expect(toDateTime('2026-11-05')).toBe('2026-11-05T09:00');
    expect(toDateTime('2026-11-05T14:00')).toBe('2026-11-05T14:00');
    expect(toDateTime('')).toBe('');
    expect(toDateTime('2026-13-01')).toBe('2026-13-01');
  });

  test('garbage input never throws; unparseable dates are omitted', () => {
    for (const s of ['', 'x', '2026-11-05T', '9999-99-99', '0000-01-01T00:00', '\n;\\']) {
      for (const allDay of [false, true]) {
        expect(() => calendar.encode(values({ start: s, end: s, allDay }))).not.toThrow();
        expect(() => calendar.validate(values({ start: s, end: s, allDay }))).not.toThrow();
      }
    }
    expect(calendar.encode(values({ title: 'x', start: 'nope', end: 'nope' }))).toBe(
      lines('BEGIN:VEVENT', 'SUMMARY:x', 'END:VEVENT'),
    );
  });

  test('scans', async () => {
    const payload = calendar.encode(
      values({
        title: 'Team meeting',
        start: '2026-11-05T14:00',
        end: '2026-11-05T15:00',
        location: 'Room 1, Berlin',
        description: 'Agenda:\nreview; plan',
      }),
    );
    expect(await roundTrip(payload, 'M')).toBe(payload);
  });
});
