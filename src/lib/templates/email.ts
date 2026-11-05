import { icons } from '../icons';
import { toWellFormed } from '../qr/encode';
import type { TemplateDef } from './types';
import { allBlank, crlf, isEmail } from './util';

/** Field values of the Email template. */
export type EmailValues = { to: string; subject: string; body: string };

/**
 * Percent-encodes a header value (RFC 6068): spaces as `%20`, line breaks as `%0D%0A`.
 * Lone surrogates are repaired first; `encodeURIComponent` would throw on them.
 */
function encodeHeader(s: string): string {
  return encodeURIComponent(crlf(toWellFormed(s)));
}

/**
 * Email template: `mailto:<to>?subject=…&body=…`. The address keeps its `@` (some mail apps
 * mishandle `%40`); everything else is percent-encoded.
 */
export const email: TemplateDef<EmailValues> = {
  id: 'email',
  icon: icons.mail,
  empty: () => ({ to: '', subject: '', body: '' }),
  isEmpty: (v) => allBlank(v),
  validate: (v) => {
    const to = v.to.trim();
    if (allBlank(v)) return [];
    if (to === '') return [{ field: 'to', key: 'required' }];
    return isEmail(to) ? [] : [{ field: 'to', key: 'invalidEmail' }];
  },
  encode: (v) => {
    const to = encodeHeader(v.to.trim()).replace(/%40/g, '@');
    const params: string[] = [];
    if (v.subject.trim()) params.push(`subject=${encodeHeader(v.subject.trim())}`);
    if (v.body.trim()) params.push(`body=${encodeHeader(v.body)}`);
    return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`;
  },
};
