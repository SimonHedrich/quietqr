import { describe, expect, test } from 'vitest';
import type { Hex } from '../../src/lib/color';
import type { Ecl } from '../../src/lib/qr/encode';
import { BG_PRESETS, FG_PRESETS, SHAPES } from '../../src/lib/style';
import { roundTrip, testLogo } from './helpers';

const ECLS: Ecl[] = ['L', 'M', 'Q', 'H'];
const SHORT = 'https://example.com/';
const LONG =
  'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Müller;Jürgen;;;\r\nFN:Jürgen Müller\r\nORG:Beispiel GmbH\r\n' +
  'TITLE:Leiter Einkauf\r\nTEL;TYPE=CELL:+49 170 1234567\r\nEMAIL:juergen.mueller@example.de\r\n' +
  'URL:https://example.de\r\nADR;TYPE=WORK:;;Hauptstraße 1;Karlsruhe;;76131;Deutschland\r\n' +
  'NOTE:Bitte nur werktags anrufen\\, danke! 👋\r\nEND:VCARD';

const COLOR_PAIRS: [Hex, Hex][] = [
  ['#1f2328', '#ffffff'],
  ['#1e3a8a', '#eff6ff'],
  ['#7f1d1d', '#fdf6e3'],
  ['#713f12', '#fdf2f8'],
];

const logos = { solid: testLogo('solid'), noisy: testLogo('noisy') };

describe('every shape × level × logo × colors × payload scans', () => {
  for (const shape of SHAPES)
    for (const ecl of ECLS)
      for (const logo of [undefined, 'solid', 'noisy'] as const)
        for (const [fg, bg] of COLOR_PAIRS)
          for (const [name, payload] of [
            ['short', SHORT],
            ['long', LONG],
          ] as const) {
            // A logo at L or M is outside what the app recommends (it warns, see analyze.ts).
            const warned = logo !== undefined && (ecl === 'L' || ecl === 'M');
            const label = `${shape} ${ecl} logo=${logo ?? 'none'} ${fg}/${bg} ${name}`;
            test.skipIf(warned)(label, async () => {
              const text = await roundTrip(payload, ecl, {
                shape,
                fg,
                bg,
                logo: logo && logos[logo],
              });
              expect(text).toBe(payload);
            });
          }
});

describe('every preset combination scans', () => {
  for (const fg of FG_PRESETS)
    for (const bg of BG_PRESETS)
      for (const shape of SHAPES)
        test(`${shape} ${fg}/${bg}`, async () => {
          expect(await roundTrip(SHORT, 'M', { shape, fg, bg })).toBe(SHORT);
        });
});

test('transparent background scans on white', async () => {
  for (const shape of SHAPES)
    expect(await roundTrip(LONG, 'M', { shape, transparent: true })).toBe(LONG);
});

describe('logo works across many versions at H', () => {
  const lengths: number[] = [];
  for (let len = 5; len <= 1200; len = Math.ceil(len * 1.35)) lengths.push(len);
  for (const len of lengths)
    for (const shape of SHAPES)
      test(`${shape} ${len} bytes`, async () => {
        const payload = 'x'.repeat(len);
        expect(await roundTrip(payload, 'H', { shape, logo: logos.noisy })).toBe(payload);
      });
});
