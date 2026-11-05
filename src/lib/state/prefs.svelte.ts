import { detectLocale, isLocale, translate, type Locale, type MessageKey } from '../i18n';
import { storage } from './storage';

const LOCALE_KEY = 'quietqr.locale';
const THEME_KEY = 'quietqr.theme';

/** Light or dark; `null` means follow the system. */
export type Theme = 'light' | 'dark';

function initialLocale(): Locale {
  const stored = storage.get(LOCALE_KEY);
  if (isLocale(stored)) return stored;
  return detectLocale(globalThis.navigator?.languages ?? []);
}

function initialTheme(): Theme | null {
  const stored = storage.get(THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

/** UI preferences: language and theme override. Stored in localStorage once chosen. */
class Prefs {
  locale = $state<Locale>(initialLocale());
  theme = $state<Theme | null>(initialTheme());

  /** Switches the language and remembers it. */
  setLocale(locale: Locale): void {
    this.locale = locale;
    storage.set(LOCALE_KEY, locale);
  }

  /** Sets the theme override and remembers it. */
  setTheme(theme: Theme): void {
    this.theme = theme;
    storage.set(THEME_KEY, theme);
  }
}

/** The single preferences instance. */
export const prefs = new Prefs();

/** Translates a key in the current language. Reactive in templates and `$derived`. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return translate(prefs.locale, key, params);
}
