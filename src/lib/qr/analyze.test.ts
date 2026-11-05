import { describe, expect, test } from 'vitest';
import { BG_PRESETS, DEFAULT_STYLE, FG_PRESETS } from '../style';
import { contrastRatio, parseHex } from '../color';
import { analyze, DENSE_VERSION, type AnalysisInput } from './analyze';

const ok: AnalysisInput = {
  fg: '#1f2328',
  bg: '#ffffff',
  transparent: false,
  hasLogo: false,
  version: 3,
  ecl: 'M',
};

describe('analyze', () => {
  test('a normal code has no warnings', () => {
    expect(analyze(ok)).toEqual({ warnings: [] });
  });

  test('over capacity is an error', () => {
    expect(analyze({ ...ok, version: null })).toEqual({ warnings: [], error: 'overCapacity' });
  });

  test('low contrast', () => {
    expect(analyze({ ...ok, fg: '#aaaaaa' }).warnings).toEqual(['lowContrast']);
    expect(analyze({ ...ok, fg: '#767676' }).warnings).toEqual([]); // 4.5:1
  });

  test('inverted colors', () => {
    expect(analyze({ ...ok, fg: '#ffffff', bg: '#000000' }).warnings).toEqual(['inverted']);
  });

  test('transparent background is judged against white', () => {
    expect(analyze({ ...ok, bg: '#000000', transparent: true }).warnings).toEqual([]);
    expect(analyze({ ...ok, fg: '#eeeeee', bg: '#000000', transparent: true }).warnings).toEqual([
      'lowContrast',
    ]);
  });

  test('logo needs Q or H', () => {
    for (const ecl of ['L', 'M'] as const)
      expect(analyze({ ...ok, hasLogo: true, ecl }).warnings).toEqual(['logoTooLarge']);
    for (const ecl of ['Q', 'H'] as const)
      expect(analyze({ ...ok, hasLogo: true, ecl }).warnings).toEqual([]);
  });

  test('dense codes', () => {
    expect(analyze({ ...ok, version: DENSE_VERSION }).warnings).toEqual([]);
    expect(analyze({ ...ok, version: DENSE_VERSION + 1 }).warnings).toEqual(['dense']);
  });

  test('every curated preset combination has no warnings', () => {
    for (const fg of FG_PRESETS)
      for (const bg of BG_PRESETS) {
        expect(analyze({ ...ok, fg, bg }).warnings, `${fg}/${bg}`).toEqual([]);
        expect(analyze({ ...ok, fg, bg, transparent: true }).warnings).toEqual([]);
        expect(contrastRatio(fg, bg), `${fg}/${bg}`).toBeGreaterThanOrEqual(7);
      }
    expect(analyze({ ...ok, fg: DEFAULT_STYLE.fg, bg: DEFAULT_STYLE.bg }).warnings).toEqual([]);
  });
});

describe('color', () => {
  test('parseHex', () => {
    expect(parseHex('#ABC')).toBe('#aabbcc');
    expect(parseHex(' 1f2328 ')).toBe('#1f2328');
    expect(parseHex('#12345')).toBeNull();
    expect(parseHex('red')).toBeNull();
    expect(parseHex('#1234567')).toBeNull();
  });

  test('contrastRatio', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1);
  });
});
