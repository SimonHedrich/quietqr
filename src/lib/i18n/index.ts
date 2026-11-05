import { de } from './de';
import { en, type MessageKey, type Messages } from './en';

export type { MessageKey, Messages } from './en';

/** Supported languages. To add one: create `xx.ts` (`satisfies Messages`) and list it here. */
export const LOCALES = { en, de } as const satisfies Record<string, Messages>;

/** A supported language code. */
export type Locale = keyof typeof LOCALES;

/** Each language's own name, for the language switcher. */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = { en: 'English', de: 'Deutsch' };

/** True if the string is a supported language code. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && Object.hasOwn(LOCALES, value);
}

/**
 * Picks the first supported language from the browser's preference list (`navigator.languages`),
 * matching on the primary subtag (`de-AT` → `de`). Falls back to English.
 */
export function detectLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const primary = tag.toLowerCase().split('-')[0];
    if (isLocale(primary)) return primary;
  }
  return 'en';
}

/** Translates a key and fills `{name}` placeholders. Unknown placeholders stay as they are. */
export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const text = LOCALES[locale][key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? String(params[name]) : m,
  );
}

/** Formats a number for the locale (thousands separators etc.). */
export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(locale).format(n);
}
