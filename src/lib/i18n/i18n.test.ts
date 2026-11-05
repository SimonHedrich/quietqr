import { describe, expect, test } from 'vitest';
import { detectLocale, formatNumber, LOCALES, translate } from './index';

describe('i18n', () => {
  test('every language has the same keys as English', () => {
    const keys = Object.keys(LOCALES.en).sort();
    for (const messages of Object.values(LOCALES))
      expect(Object.keys(messages).sort()).toEqual(keys);
  });

  test('placeholders match English', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const [key, text] of Object.entries(LOCALES.en))
      for (const messages of Object.values(LOCALES))
        expect(vars(messages[key as keyof typeof messages]), key).toEqual(vars(text));
  });

  test('detectLocale', () => {
    expect(detectLocale(['de-AT', 'en'])).toBe('de');
    expect(detectLocale(['fr-FR', 'de'])).toBe('de');
    expect(detectLocale(['fr'])).toBe('en');
    expect(detectLocale([])).toBe('en');
  });

  test('translate fills placeholders', () => {
    expect(translate('en', 'preview.capacity', { used: 3, max: '2,331' })).toBe(
      '3 / ~2,331 characters',
    );
    expect(translate('de', 'export.download', { format: 'SVG' })).toBe('SVG herunterladen');
    expect(translate('en', 'footer.version')).toBe('Version {version}');
  });

  test('formatNumber', () => {
    expect(formatNumber('en', 2331)).toBe('2,331');
    expect(formatNumber('de', 2331)).toBe('2.331');
  });
});
