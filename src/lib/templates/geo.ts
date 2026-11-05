import { icons } from '../icons';
import type { FieldError, TemplateDef } from './types';

/** Field values of the location template, as typed in the inputs. */
export type GeoValues = { lat: string; lng: string };

/** Parses a typed coordinate; accepts `,` as decimal separator. Null if it isn't a plain number. */
function parseNumber(input: string): number | null {
  const s = input.trim().replace(',', '.');
  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Formats a coordinate for the payload: at most 5 decimals (about 1 m), no trailing zeros,
 * `.` as decimal separator.
 */
export function formatCoordinate(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return String(Number(n.toFixed(5)));
}

/** A typed value as it is encoded: formatted if it parses, the trimmed raw text otherwise. */
function encodeValue(input: string): string {
  const n = parseNumber(input);
  return n === null ? input.trim() : formatCoordinate(n);
}

const inRange = (lat: number, lng: number) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/** A signed decimal number inside a URL or pasted text. */
const NUM = String.raw`(-?\d+(?:\.\d+)?)`;

/**
 * Where to find a latitude/longitude pair in pasted text, most specific first. Each pattern
 * captures latitude then longitude.
 */
const PATTERNS: readonly RegExp[] = [
  // Google Maps place data; more precise than `@`, which is the viewport centre.
  new RegExp(String.raw`!3d${NUM}!4d${NUM}`),
  // OpenStreetMap marker; preferred over `#map=`, which is the viewport.
  new RegExp(String.raw`[?&]mlat=${NUM}&mlon=${NUM}`),
  // Google Maps query parameters (`q`, `ll`, Maps URLs API `query`).
  new RegExp(String.raw`[?&](?:q|ll|query)=${NUM},(?:\s|\+)*${NUM}`),
  // Google Maps viewport: `/@lat,lng,zoom`.
  new RegExp(String.raw`@${NUM},${NUM}`),
  // OpenStreetMap viewport: `#map=zoom/lat/lng`.
  new RegExp(String.raw`#map=\d+(?:\.\d+)?/${NUM}/${NUM}`),
  // Plain coordinates: `48.1372, 11.5756`, `48.1372,11.5756`, `48.1372 11.5756`.
  new RegExp(String.raw`^\s*${NUM}\s*[,\s]\s*${NUM}\s*$`),
];

/**
 * Extracts a location from pasted text: plain coordinates, a Google Maps or OpenStreetMap
 * URL. Returns `'shortLink'` for Google short links, which can't be resolved offline, and
 * null when nothing is found or the numbers are out of range.
 */
export function parseLocation(text: string): { lat: number; lng: number } | 'shortLink' | null {
  const s = text.trim().replace(/%2C/gi, ',').replace(/%20/g, ' ');
  if (/\b(?:maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(s)) return 'shortLink';
  for (const pattern of PATTERNS) {
    const m = pattern.exec(s);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    return inRange(lat, lng) ? { lat, lng } : null;
  }
  return null;
}

/** Location template: `geo:<lat>,<lng>`. */
export const geo: TemplateDef<GeoValues> = {
  id: 'geo',
  icon: icons.mapPin,
  empty: () => ({ lat: '', lng: '' }),
  isEmpty: (v) => v.lat.trim() === '' && v.lng.trim() === '',
  validate: (v) => {
    const errors: FieldError<GeoValues>[] = [];
    const check = (field: keyof GeoValues, other: keyof GeoValues, max: number) => {
      if (v[field].trim() === '') {
        if (v[other].trim() !== '') errors.push({ field, key: 'required' });
        return;
      }
      const n = parseNumber(v[field]);
      if (n === null) errors.push({ field, key: 'invalidNumber' });
      else if (Math.abs(n) > max) {
        errors.push({ field, key: field === 'lat' ? 'latitudeRange' : 'longitudeRange' });
      }
    };
    check('lat', 'lng', 90);
    check('lng', 'lat', 180);
    return errors;
  },
  encode: (v) => `geo:${encodeValue(v.lat)},${encodeValue(v.lng)}`,
};
