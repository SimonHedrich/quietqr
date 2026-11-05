import { describe, expect, test } from 'vitest';
import { roundTrip } from '../../../tests/scan/helpers';
import { formatCoordinate, geo, parseLocation } from './geo';

const munich = { lat: 48.1372, lng: 11.5756 };

describe('geo template', () => {
  test('encodes geo:<lat>,<lng>', () => {
    expect(geo.encode({ lat: '48.1372', lng: '11.5756' })).toBe('geo:48.1372,11.5756');
    expect(geo.encode({ lat: ' -33.8688 ', lng: '151.2093' })).toBe('geo:-33.8688,151.2093');
    expect(geo.encode({ lat: '0', lng: '-0.0' })).toBe('geo:0,0');
    expect(geo.encode({ lat: '+10', lng: '.5' })).toBe('geo:10,0.5');
  });

  test('rounds to 5 decimals and strips trailing zeros', () => {
    expect(geo.encode({ lat: '48.137154321', lng: '11.575490000' })).toBe('geo:48.13715,11.57549');
    expect(geo.encode({ lat: '48.100000', lng: '11.5' })).toBe('geo:48.1,11.5');
    expect(formatCoordinate(48.137159)).toBe('48.13716');
    expect(formatCoordinate(-0.000001)).toBe('0');
    expect(formatCoordinate(0.00001)).toBe('0.00001');
    expect(formatCoordinate(12)).toBe('12');
  });

  test('accepts a comma as decimal separator', () => {
    expect(geo.encode({ lat: '48,1372', lng: '11,5756' })).toBe('geo:48.1372,11.5756');
    expect(geo.validate({ lat: '48,1372', lng: '11,5756' })).toEqual([]);
  });

  test('empty and one-field cases', () => {
    expect(geo.isEmpty(geo.empty())).toBe(true);
    expect(geo.isEmpty({ lat: ' ', lng: '' })).toBe(true);
    expect(geo.isEmpty({ lat: '48', lng: '' })).toBe(false);
    expect(geo.validate(geo.empty())).toEqual([]);
    expect(geo.validate({ lat: '48', lng: '' })).toEqual([{ field: 'lng', key: 'required' }]);
    expect(geo.validate({ lat: '', lng: '11' })).toEqual([{ field: 'lat', key: 'required' }]);
  });

  test('validates ranges', () => {
    expect(geo.validate({ lat: '90', lng: '-180' })).toEqual([]);
    expect(geo.validate({ lat: '90.1', lng: '11' })).toEqual([
      { field: 'lat', key: 'latitudeRange' },
    ]);
    expect(geo.validate({ lat: '-91', lng: '180.5' })).toEqual([
      { field: 'lat', key: 'latitudeRange' },
      { field: 'lng', key: 'longitudeRange' },
    ]);
  });

  test('unicode and special characters are invalid numbers', () => {
    expect(geo.validate({ lat: '48°', lng: '11.5' })).toEqual([
      { field: 'lat', key: 'invalidNumber' },
    ]);
    expect(geo.validate({ lat: '48.1.2', lng: '1e3' })).toEqual([
      { field: 'lat', key: 'invalidNumber' },
      { field: 'lng', key: 'invalidNumber' },
    ]);
    expect(geo.validate({ lat: '٤٨', lng: '11' })).toEqual([
      { field: 'lat', key: 'invalidNumber' },
    ]);
  });

  test('encodes garbage as trimmed raw text without throwing', () => {
    expect(geo.encode({ lat: ' 48° N ', lng: 'east' })).toBe('geo:48° N,east');
    expect(geo.encode({ lat: '', lng: '' })).toBe('geo:,');
    expect(geo.encode({ lat: 'NaN', lng: 'Infinity' })).toBe('geo:NaN,Infinity');
  });

  test('scans', async () => {
    const payload = geo.encode({ lat: '48.1372', lng: '11.5756' });
    expect(await roundTrip(payload, 'M')).toBe(payload);
  });
});

describe('parseLocation', () => {
  test('plain coordinates', () => {
    expect(parseLocation('48.1372, 11.5756')).toEqual(munich);
    expect(parseLocation('48.1372,11.5756')).toEqual(munich);
    expect(parseLocation('  48.1372 11.5756 ')).toEqual(munich);
    expect(parseLocation('-33.8688, -151.2093')).toEqual({ lat: -33.8688, lng: -151.2093 });
  });

  test('Google Maps place URL prefers !3d!4d over @', () => {
    expect(
      parseLocation(
        'https://www.google.com/maps/place/Marienplatz/@48.1373,11.5754,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d48.1372!4d11.5756!16s',
      ),
    ).toEqual(munich);
  });

  test('Google Maps @ viewport', () => {
    expect(parseLocation('https://www.google.com/maps/@48.1372,11.5756,15z?entry=ttu')).toEqual(
      munich,
    );
  });

  test('Google Maps q, ll and query parameters', () => {
    expect(parseLocation('https://maps.google.com/?q=48.1372,11.5756')).toEqual(munich);
    expect(parseLocation('https://maps.google.com/maps?ll=48.1372,11.5756&z=15')).toEqual(munich);
    expect(
      parseLocation('https://www.google.com/maps/search/?api=1&query=48.1372,11.5756'),
    ).toEqual(munich);
  });

  test('URL-encoded comma', () => {
    expect(
      parseLocation('https://www.google.com/maps/search/?api=1&query=48.1372%2C11.5756'),
    ).toEqual(munich);
  });

  test('OpenStreetMap #map', () => {
    expect(parseLocation('https://www.openstreetmap.org/#map=15/48.1372/11.5756')).toEqual(munich);
  });

  test('OpenStreetMap mlat/mlon preferred over #map', () => {
    expect(
      parseLocation(
        'https://www.openstreetmap.org/?mlat=48.1372&mlon=11.5756#map=15/48.1400/11.5800',
      ),
    ).toEqual(munich);
  });

  test('short links', () => {
    expect(parseLocation('https://maps.app.goo.gl/AbCdEf123')).toBe('shortLink');
    expect(parseLocation('https://goo.gl/maps/AbCdEf123')).toBe('shortLink');
  });

  test('anything else or out of range', () => {
    expect(parseLocation('')).toBeNull();
    expect(parseLocation('Marienplatz, München')).toBeNull();
    expect(parseLocation('https://example.com/?q=hello')).toBeNull();
    expect(parseLocation('48.1372')).toBeNull();
    expect(parseLocation('91, 11')).toBeNull();
    expect(parseLocation('48, 181')).toBeNull();
  });

  test('a single decimal comma is not a coordinate pair', () => {
    expect(parseLocation('48,137')).toBeNull();
    expect(parseLocation('48,137, 11,575')).toBeNull();
    expect(parseLocation('48.137,11.575')).toEqual({ lat: 48.137, lng: 11.575 });
  });
});
