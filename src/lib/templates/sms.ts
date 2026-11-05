import { icons } from '../icons';
import type { FieldError, TemplateDef } from './types';
import { allBlank, isPhone, normalizePhone } from './util';

/** Field values of the SMS template. */
export type SmsValues = { number: string; message: string };

/**
 * SMS template: `SMSTO:<number>:<message>`. iOS prefills the message only for `SMSTO:`
 * (`sms:` gets the number only); Android's ZXing-based readers split at the first colon,
 * so colons in the message are fine and nothing is percent-encoded.
 */
export const sms: TemplateDef<SmsValues> = {
  id: 'sms',
  icon: icons.message,
  empty: () => ({ number: '', message: '' }),
  isEmpty: (v) => allBlank(v),
  validate: (v) => {
    const errors: FieldError<SmsValues>[] = [];
    if (allBlank(v)) return errors;
    if (v.number.trim() === '') errors.push({ field: 'number', key: 'required' });
    else if (!isPhone(v.number)) errors.push({ field: 'number', key: 'invalidPhone' });
    return errors;
  },
  encode: (v) => `SMSTO:${normalizePhone(v.number)}:${v.message}`,
};
