import { icons } from '../icons';
import type { TemplateDef } from './types';
import { isPhone, normalizePhone } from './util';

/** Field values of the Phone template. */
export type PhoneValues = { number: string };

/** Phone template: `tel:` with the number stripped of spaces and separators. */
export const phone: TemplateDef<PhoneValues> = {
  id: 'phone',
  icon: icons.phone,
  empty: () => ({ number: '' }),
  isEmpty: (v) => v.number.trim() === '',
  validate: (v) =>
    v.number.trim() === '' || isPhone(v.number) ? [] : [{ field: 'number', key: 'invalidPhone' }],
  encode: (v) => `tel:${normalizePhone(v.number)}`,
};
