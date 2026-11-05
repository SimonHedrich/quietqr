/** Template identifiers, in display order (see registry.ts). Also used in file names. */
export type TemplateId =
  'url' | 'wifi' | 'text' | 'contact' | 'email' | 'phone' | 'sms' | 'geo' | 'calendar';

/**
 * Validation problems a template can report. The UI translates them as `error.<key>`
 * (see src/lib/i18n/en.ts).
 */
export type ErrorKey =
  | 'required'
  | 'invalidUrl'
  | 'invalidEmail'
  | 'invalidPhone'
  | 'wpaPasswordLength'
  | 'invalidNumber'
  | 'latitudeRange'
  | 'longitudeRange'
  | 'invalidDate'
  | 'endBeforeStart';

/** A validation problem attached to one field. */
export interface FieldError<V> {
  field: keyof V & string;
  key: ErrorKey;
}

/** Field values of a template: a flat object of strings and booleans (JSON-safe for the link hash). */
export type FieldValues = Record<string, string | boolean>;

/**
 * A data template: how its field values become a QR payload. Plain TypeScript, no DOM, so
 * it is unit-tested in Node. Each template has its own form component in
 * `src/components/templates/`.
 */
export interface TemplateDef<V extends FieldValues> {
  id: TemplateId;
  /** Icon as SVG path data for a 24×24, stroke-based icon (Lucide style). */
  icon: readonly string[];
  /** Initial field values. Also defines the field names and types for the link hash. */
  empty: () => V;
  /** True when nothing meaningful is entered: the preview shows a placeholder, export is off. */
  isEmpty: (v: V) => boolean;
  /** Problems to show next to fields. Never blocks encoding. */
  validate: (v: V) => FieldError<V>[];
  /** The QR payload. Must not throw, whatever the values. */
  encode: (v: V) => string;
}
