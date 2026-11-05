import { icons } from '../icons';
import type { TemplateDef } from './types';

/** Field values of the Text template. */
export type TextValues = { text: string };

/** Text template: the text as typed, line breaks and surrounding spaces included. */
export const text: TemplateDef<TextValues> = {
  id: 'text',
  icon: icons.text,
  empty: () => ({ text: '' }),
  isEmpty: (v) => v.text.trim() === '',
  validate: () => [],
  encode: (v) => v.text,
};
