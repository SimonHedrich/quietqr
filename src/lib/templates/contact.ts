import { icons } from '../icons';
import type { FieldError, TemplateDef } from './types';
import { normalizeUrl, url } from './url';
import { allBlank, isEmail, isPhone } from './util';

/** Field values of the contact template. */
export type ContactValues = {
  firstName: string;
  lastName: string;
  phone: string;
  org: string;
  title: string;
  email: string;
  url: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
  note: string;
};

/**
 * Escapes a trimmed text value for vCard 3.0: backslash, semicolon and comma get a
 * backslash, line breaks become `\n`.
 */
export function escapeVcard(value: string): string {
  return value
    .trim()
    .replace(/[\\;,]/g, (c) => `\\${c}`)
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** The formatted name: first and last name, else organization, else phone, else e-mail. */
function formattedName(v: ContactValues): string {
  const name = `${v.firstName.trim()} ${v.lastName.trim()}`.trim();
  return [name, v.org, v.phone, v.email].map((s) => s.trim()).find((s) => s !== '') ?? '';
}

/**
 * Contact template: a vCard 3.0 with CRLF line endings. `N` and `FN` are always present
 * (iOS needs `N`); other properties only when filled in.
 */
export const contact: TemplateDef<ContactValues> = {
  id: 'contact',
  icon: icons.user,
  empty: () => ({
    firstName: '',
    lastName: '',
    phone: '',
    org: '',
    title: '',
    email: '',
    url: '',
    street: '',
    postalCode: '',
    city: '',
    country: '',
    note: '',
  }),
  isEmpty: (v) => allBlank(v),
  validate: (v) => {
    const errors: FieldError<ContactValues>[] = [];
    const email = v.email.trim();
    const phone = v.phone.trim();
    if (phone !== '' && !isPhone(phone)) errors.push({ field: 'phone', key: 'invalidPhone' });
    if (email !== '' && !isEmail(email)) errors.push({ field: 'email', key: 'invalidEmail' });
    if (v.url.trim() !== '' && url.validate({ url: v.url }).length > 0) {
      errors.push({ field: 'url', key: 'invalidUrl' });
    }
    return errors;
  },
  encode: (v) => {
    const e = escapeVcard;
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${e(v.lastName)};${e(v.firstName)};;;`,
      `FN:${e(formattedName(v))}`,
    ];
    const add = (prop: string, value: string) => {
      if (value !== '') lines.push(`${prop}:${value}`);
    };
    add('ORG', e(v.org));
    add('TITLE', e(v.title));
    add('TEL;TYPE=CELL', e(v.phone));
    add('EMAIL', e(v.email));
    add('URL', e(normalizeUrl(v.url)));
    const adr = [v.street, v.city, v.postalCode, v.country].map(e);
    if (adr.some((s) => s !== '')) {
      const [street, city, postalCode, country] = adr;
      lines.push(`ADR:;;${street};${city};;${postalCode};${country}`);
    }
    add('NOTE', e(v.note));
    lines.push('END:VCARD');
    return lines.join('\r\n');
  },
};
