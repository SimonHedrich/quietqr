import { describe, expect, test } from 'vitest';
import { getTemplate, isTemplateId, TEMPLATE_ORDER, templates } from './registry';

describe('registry', () => {
  test('lists every template once, in the order from features.md', () => {
    expect(TEMPLATE_ORDER).toEqual([
      'url',
      'wifi',
      'text',
      'contact',
      'email',
      'phone',
      'sms',
      'geo',
      'calendar',
    ]);
    expect(Object.keys(templates).sort()).toEqual([...TEMPLATE_ORDER].sort());
  });

  test('isTemplateId', () => {
    expect(isTemplateId('wifi')).toBe(true);
    expect(isTemplateId('nope')).toBe(false);
    expect(isTemplateId(3)).toBe(false);
  });

  for (const id of TEMPLATE_ORDER) {
    const t = getTemplate(id);
    test(`${id}: contract`, () => {
      expect(t.id).toBe(id);
      expect(t.icon.length).toBeGreaterThan(0);
      const empty = t.empty();
      expect(t.empty()).not.toBe(empty); // fresh object each time
      expect(t.isEmpty(empty)).toBe(true);
      expect(t.validate(empty)).toEqual([]);
      for (const v of Object.values(empty)) expect(['string', 'boolean']).toContain(typeof v);
      // encode never throws, even with odd input
      const odd = Object.fromEntries(
        Object.entries(empty).map(([k, v]) => [k, typeof v === 'string' ? ' ;:,\\"\n\uD83D' : v]),
      );
      expect(() => t.encode(odd)).not.toThrow();
      expect(() => t.validate(odd)).not.toThrow();
    });
  }
});
