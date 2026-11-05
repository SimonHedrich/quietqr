import { describe, expect, test } from 'vitest';
import { roundTrip } from '../../../tests/scan/helpers';
import { contact, type ContactValues } from './contact';

const card = (lines: string[]) => lines.join('\r\n');
const values = (v: Partial<ContactValues>): ContactValues => ({ ...contact.empty(), ...v });

const full = values({
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: '+44 20 1234 5678',
  org: 'Analytical Engines Ltd',
  title: 'Engineer',
  email: 'ada@example.com',
  url: 'example.com',
  street: '12 St James Square',
  postalCode: 'SW1Y 4JH',
  city: 'London',
  country: 'UK',
  note: 'Met at the conference',
});

describe('contact template', () => {
  test('encodes all fields', () => {
    expect(contact.encode(full)).toBe(
      card([
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Lovelace;Ada;;;',
        'FN:Ada Lovelace',
        'ORG:Analytical Engines Ltd',
        'TITLE:Engineer',
        'TEL;TYPE=CELL:+44 20 1234 5678',
        'EMAIL:ada@example.com',
        'URL:https://example.com',
        'ADR:;;12 St James Square;London;;SW1Y 4JH;UK',
        'NOTE:Met at the conference',
        'END:VCARD',
      ]),
    );
  });

  test('leaves out empty optional fields', () => {
    expect(contact.encode(values({ firstName: ' Ada ' }))).toBe(
      card(['BEGIN:VCARD', 'VERSION:3.0', 'N:;Ada;;;', 'FN:Ada', 'END:VCARD']),
    );
    expect(contact.encode(values({ city: 'Berlin' }))).toContain('\r\nADR:;;;Berlin;;;\r\n');
    expect(contact.encode(values({ city: 'Berlin' }))).not.toMatch(/\r\n$/);
  });

  test('escapes special characters', () => {
    const payload = contact.encode(
      values({
        lastName: 'Doe; Jr.',
        firstName: 'John, J.',
        org: 'A\\B',
        note: 'line 1\nline 2\r\nline 3\rline 4',
      }),
    );
    expect(payload).toContain('\r\nN:Doe\\; Jr.;John\\, J.;;;\r\n');
    expect(payload).toContain('\r\nFN:John\\, J. Doe\\; Jr.\r\n');
    expect(payload).toContain('\r\nORG:A\\\\B\r\n');
    expect(payload).toContain('\r\nNOTE:line 1\\nline 2\\nline 3\\nline 4\r\n');
  });

  test('keeps unicode as typed', () => {
    const payload = contact.encode(
      values({ firstName: 'Jürgen', lastName: 'Größe', org: '株式会社', note: 'Hi 👋' }),
    );
    expect(payload).toContain('\r\nN:Größe;Jürgen;;;\r\nFN:Jürgen Größe\r\nORG:株式会社\r\n');
    expect(payload).toContain('\r\nNOTE:Hi 👋\r\n');
  });

  test('FN falls back to organization, phone, then e-mail', () => {
    const fn = (v: Partial<ContactValues>) =>
      /\r\nFN:(.*)\r\n/.exec(contact.encode(values(v)))?.[1];
    expect(fn({ lastName: 'Lovelace' })).toBe('Lovelace');
    expect(fn({ org: 'ACME', phone: '123', email: 'a@b.de' })).toBe('ACME');
    expect(fn({ phone: ' 0123 456 ', email: 'a@b.de' })).toBe('0123 456');
    expect(fn({ email: 'a@b.de' })).toBe('a@b.de');
    expect(fn({ note: 'only a note' })).toBe('');
  });

  test('empty and validation', () => {
    expect(contact.isEmpty(contact.empty())).toBe(true);
    expect(contact.isEmpty(values({ city: '  ' }))).toBe(true);
    expect(contact.isEmpty(values({ note: 'x' }))).toBe(false);
    expect(contact.validate(contact.empty())).toEqual([]);
    expect(contact.validate(full)).toEqual([]);
    expect(contact.validate(values({ phone: 'abc', email: 'nope', url: 'not a url' }))).toEqual([
      { field: 'phone', key: 'invalidPhone' },
      { field: 'email', key: 'invalidEmail' },
      { field: 'url', key: 'invalidUrl' },
    ]);
  });

  test('scans', async () => {
    const payload = contact.encode(full);
    expect(await roundTrip(payload, 'M')).toBe(payload);
  });
});
