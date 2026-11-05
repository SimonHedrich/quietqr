import { icons } from '../icons';
import type { FieldError, TemplateDef } from './types';

/** WiFi security type as encoded in `T:`. WPA covers WPA, WPA2 and WPA3. */
export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

/** Field values of the WiFi template. */
export type WifiValues = {
  ssid: string;
  password: string;
  security: WifiSecurity;
  hidden: boolean;
};

/** Escapes `\ ; , " :` with a backslash, as the `WIFI:` format requires. */
export function escapeWifi(s: string): string {
  return s.replace(/[\\;,":]/g, (c) => `\\${c}`);
}

/** Coerces any string to a known security type (values may come from the link hash). */
function security(v: WifiValues): WifiSecurity {
  return v.security === 'WEP' || v.security === 'nopass' ? v.security : 'WPA';
}

/**
 * WiFi template: `WIFI:T:WPA;S:<ssid>;P:<password>;H:true;;`. WPA3 networks use `T:WPA`
 * too (the Wi-Fi Alliance spec allows nothing else for password networks; `T:SAE` is not
 * understood by iOS). `P` is left out for open networks, `H` unless the network is hidden.
 */
export const wifi: TemplateDef<WifiValues> = {
  id: 'wifi',
  icon: icons.wifi,
  empty: () => ({ ssid: '', password: '', security: 'WPA', hidden: false }),
  isEmpty: (v) => v.ssid === '' && (security(v) === 'nopass' || v.password === ''),
  validate: (v) => {
    const errors: FieldError<WifiValues>[] = [];
    if (wifi.isEmpty(v)) return errors;
    if (v.ssid === '') errors.push({ field: 'ssid', key: 'required' });
    if (security(v) === 'WPA' && v.password !== '' && [...v.password].length < 8) {
      errors.push({ field: 'password', key: 'wpaPasswordLength' });
    }
    return errors;
  },
  encode: (v) => {
    const t = security(v);
    let s = `WIFI:T:${t};S:${escapeWifi(v.ssid)};`;
    if (t !== 'nopass') s += `P:${escapeWifi(v.password)};`;
    if (v.hidden) s += 'H:true;';
    return s + ';';
  },
};
