import { describe, expect, test } from 'vitest';
import { roundTrip } from '../../../tests/scan/helpers';
import { email } from './email';
import { phone } from './phone';
import { sms } from './sms';
import { text } from './text';
import { escapeWifi, wifi } from './wifi';

describe('wifi template', () => {
  const base = wifi.empty();

  test('normal values', () => {
    expect(wifi.encode({ ...base, ssid: 'Home', password: 'secret123' })).toBe(
      'WIFI:T:WPA;S:Home;P:secret123;;',
    );
    expect(wifi.encode({ ...base, ssid: 'Old', password: '12345', security: 'WEP' })).toBe(
      'WIFI:T:WEP;S:Old;P:12345;;',
    );
  });

  test('open and hidden networks', () => {
    expect(wifi.encode({ ...base, ssid: 'Cafe', password: 'ignored', security: 'nopass' })).toBe(
      'WIFI:T:nopass;S:Cafe;;',
    );
    expect(wifi.encode({ ...base, ssid: 'Secret', password: 'abcdefgh', hidden: true })).toBe(
      'WIFI:T:WPA;S:Secret;P:abcdefgh;H:true;;',
    );
  });

  test('escapes special characters', () => {
    expect(escapeWifi('a\\b;c,d"e:f')).toBe('a\\\\b\\;c\\,d\\"e\\:f');
    expect(wifi.encode({ ...base, ssid: 'My;Net', password: 'p:a,s"s\\' })).toBe(
      'WIFI:T:WPA;S:My\\;Net;P:p\\:a\\,s\\"s\\\\;;',
    );
  });

  test('unicode is kept', () => {
    expect(wifi.encode({ ...base, ssid: 'Café ☕ 家', password: 'pässwörd' })).toBe(
      'WIFI:T:WPA;S:Café ☕ 家;P:pässwörd;;',
    );
  });

  test('unknown security falls back to WPA', () => {
    const v = { ...base, ssid: 'x', password: '12345678', security: 'bogus' as 'WPA' };
    expect(wifi.encode(v)).toBe('WIFI:T:WPA;S:x;P:12345678;;');
  });

  test('empty and validation', () => {
    expect(wifi.isEmpty(base)).toBe(true);
    expect(wifi.isEmpty({ ...base, password: 'x' })).toBe(false);
    expect(wifi.isEmpty({ ...base, password: 'x', security: 'nopass' })).toBe(true);
    expect(wifi.validate({ ...base, password: 'abcdefgh' })).toEqual([
      { field: 'ssid', key: 'required' },
    ]);
    expect(wifi.validate({ ...base, ssid: 'a', password: 'short' })).toEqual([
      { field: 'password', key: 'wpaPasswordLength' },
    ]);
    expect(wifi.validate({ ...base, ssid: 'a', password: 'short', security: 'WEP' })).toEqual([]);
  });

  test('scans', async () => {
    const payload = wifi.encode({ ...base, ssid: 'Home;Net', password: 'correct horse' });
    expect(await roundTrip(payload, 'M')).toBe(payload);
  });
});

describe('text template', () => {
  test('keeps text exactly, including unicode and line breaks', () => {
    expect(text.encode({ text: ' Hallo\nWelt 👋 ;,\\ ' })).toBe(' Hallo\nWelt 👋 ;,\\ ');
  });

  test('empty', () => {
    expect(text.isEmpty(text.empty())).toBe(true);
    expect(text.isEmpty({ text: ' \n ' })).toBe(true);
    expect(text.validate({ text: '' })).toEqual([]);
  });

  test('scans', async () => {
    const payload = 'Grüße aus Karlsruhe!\nZeile 2 – 日本語 👋';
    expect(await roundTrip(text.encode({ text: payload }), 'M')).toBe(payload);
  });
});

describe('email template', () => {
  const base = email.empty();

  test('normal values', () => {
    expect(email.encode({ to: 'a@example.com', subject: 'Hi there', body: 'Line 1\nLine 2' })).toBe(
      'mailto:a@example.com?subject=Hi%20there&body=Line%201%0D%0ALine%202',
    );
  });

  test('empty optional fields', () => {
    expect(email.encode({ ...base, to: ' a@example.com ' })).toBe('mailto:a@example.com');
    expect(email.encode({ ...base, to: 'a@example.com', body: 'x' })).toBe(
      'mailto:a@example.com?body=x',
    );
  });

  test('special characters and unicode', () => {
    expect(email.encode({ to: 'a+b@example.com', subject: 'Q&A = 100%?', body: 'Grüße 👋' })).toBe(
      'mailto:a%2Bb@example.com?subject=Q%26A%20%3D%20100%25%3F&body=Gr%C3%BC%C3%9Fe%20%F0%9F%91%8B',
    );
  });

  test('empty and validation', () => {
    expect(email.isEmpty(base)).toBe(true);
    expect(email.isEmpty({ ...base, subject: 'x' })).toBe(false);
    expect(email.validate({ ...base, subject: 'x' })).toEqual([{ field: 'to', key: 'required' }]);
    expect(email.validate({ ...base, to: 'nope' })).toEqual([{ field: 'to', key: 'invalidEmail' }]);
    expect(email.validate({ ...base, to: 'a@example.com' })).toEqual([]);
  });

  test('scans', async () => {
    const payload = email.encode({ to: 'a@example.com', subject: 'Hallo', body: 'Wie geht’s?' });
    expect(await roundTrip(payload, 'M')).toBe(payload);
  });
});

describe('phone template', () => {
  test('normalizes the number', () => {
    expect(phone.encode({ number: '+49 (0) 721 123-45.67' })).toBe('tel:+4907211234567');
    expect(phone.encode({ number: ' 0721/12345 ' })).toBe('tel:072112345');
    expect(phone.encode({ number: '*100#' })).toBe('tel:*100#');
  });

  test('empty and validation', () => {
    expect(phone.isEmpty(phone.empty())).toBe(true);
    expect(phone.validate({ number: '' })).toEqual([]);
    expect(phone.validate({ number: '+49 721 1234' })).toEqual([]);
    expect(phone.validate({ number: 'call me' })).toEqual([
      { field: 'number', key: 'invalidPhone' },
    ]);
    expect(phone.validate({ number: '١٢٣' })).toEqual([{ field: 'number', key: 'invalidPhone' }]);
  });

  test('scans', async () => {
    const payload = phone.encode({ number: '+49 721 123456' });
    expect(await roundTrip(payload, 'M')).toBe(payload);
  });
});

describe('sms template', () => {
  test('normal values', () => {
    expect(sms.encode({ number: '+49 170 1234567', message: 'Hello' })).toBe(
      'SMSTO:+491701234567:Hello',
    );
  });

  test('empty message', () => {
    expect(sms.encode({ number: '0170 123', message: '' })).toBe('SMSTO:0170123:');
  });

  test('special characters and unicode stay raw', () => {
    expect(sms.encode({ number: '123', message: 'Time: 10:30; ok? 👋 ä' })).toBe(
      'SMSTO:123:Time: 10:30; ok? 👋 ä',
    );
  });

  test('empty and validation', () => {
    expect(sms.isEmpty(sms.empty())).toBe(true);
    expect(sms.validate({ number: '', message: 'hi' })).toEqual([
      { field: 'number', key: 'required' },
    ]);
    expect(sms.validate({ number: 'abc', message: '' })).toEqual([
      { field: 'number', key: 'invalidPhone' },
    ]);
  });

  test('scans', async () => {
    const payload = sms.encode({ number: '+49 170 1234567', message: 'Bin gleich da: 5 Min.' });
    expect(await roundTrip(payload, 'M')).toBe(payload);
  });
});
