import { calendar } from './calendar';
import { contact } from './contact';
import { email } from './email';
import { geo } from './geo';
import { phone } from './phone';
import { sms } from './sms';
import { text } from './text';
import type { FieldValues, TemplateDef, TemplateId } from './types';
import { url } from './url';
import { wifi } from './wifi';

/** Maps each template id to its field values type. */
export interface TemplateValues {
  url: import('./url').UrlValues;
  wifi: import('./wifi').WifiValues;
  text: import('./text').TextValues;
  contact: import('./contact').ContactValues;
  email: import('./email').EmailValues;
  phone: import('./phone').PhoneValues;
  sms: import('./sms').SmsValues;
  geo: import('./geo').GeoValues;
  calendar: import('./calendar').CalendarValues;
}

/** Every template by id. */
export const templates: { [K in TemplateId]: TemplateDef<TemplateValues[K]> } = {
  url,
  wifi,
  text,
  contact,
  email,
  phone,
  sms,
  geo,
  calendar,
};

/** Template ids in display order, most important first (see docs/features.md). */
export const TEMPLATE_ORDER: readonly TemplateId[] = [
  'url',
  'wifi',
  'text',
  'contact',
  'email',
  'phone',
  'sms',
  'geo',
  'calendar',
];

/** True if the string is a known template id. */
export function isTemplateId(id: unknown): id is TemplateId {
  return typeof id === 'string' && (TEMPLATE_ORDER as readonly string[]).includes(id);
}

/**
 * Looks up a template with loose typing, for code that handles any template generically
 * (state, link hash, preview).
 */
export function getTemplate(id: TemplateId): TemplateDef<FieldValues> {
  return templates[id] as unknown as TemplateDef<FieldValues>;
}
