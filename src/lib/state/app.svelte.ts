import { analyze, type Analysis } from '../qr/analyze';
import { capacity, type Capacity } from '../qr/capacity';
import { CapacityError, encodeQr, type Ecl, type QrMatrix } from '../qr/encode';
import { LOGO_MIN_VERSION } from '../qr/logo';
import { renderSvg } from '../qr/render';
import { resolveEcl, type Style } from '../style';
import { getTemplate, TEMPLATE_ORDER, type TemplateValues } from '../templates/registry';
import type { FieldError, FieldValues, TemplateId } from '../templates/types';
import { decodeHash, encodeHash } from './hash';
import { storage } from './storage';
import { parseStoredStyle, serializeStyle, STYLE_KEY } from './style';

/** Encoded by the faded placeholder code shown before anything is entered. */
export const PLACEHOLDER_PAYLOAD = 'https://github.com/SimonHedrich/quietqr';

type AllValues = { [K in TemplateId]: TemplateValues[K] };

function emptyValues(): AllValues {
  return Object.fromEntries(TEMPLATE_ORDER.map((id) => [id, getTemplate(id).empty()])) as AllValues;
}

/**
 * The app's state: the active template, every template's field values (in memory only),
 * the style (persisted), the logo (never stored) and everything derived from them.
 */
export class AppState {
  template = $state<TemplateId>('url');
  values = $state<AllValues>(emptyValues());
  style = $state<Style>(parseStoredStyle(storage.get(STYLE_KEY)));
  /** Logo as a PNG data URL produced by our canvas code, or null. */
  logo = $state<string | null>(null);
  /**
   * The link hash currently in the address bar (from opening a shared link or "Copy link").
   * Cleared, together with the address bar's hash, as soon as the user edits.
   */
  linkHash = $state<string | null>(null);

  /** The active template's values, typed loosely for generic code. */
  readonly current: FieldValues = $derived(this.values[this.template]);
  readonly isEmpty: boolean = $derived(getTemplate(this.template).isEmpty(this.current));
  readonly errors: FieldError<FieldValues>[] = $derived(
    this.isEmpty ? [] : getTemplate(this.template).validate(this.current),
  );
  readonly payload: string = $derived(
    this.isEmpty ? PLACEHOLDER_PAYLOAD : getTemplate(this.template).encode(this.current),
  );
  readonly ecl: Ecl = $derived(resolveEcl(this.style.ecl, this.logo !== null));
  readonly qr: QrMatrix | null = $derived.by(() => {
    try {
      return encodeQr(this.payload, this.ecl, this.logo ? LOGO_MIN_VERSION : 1);
    } catch (e) {
      if (e instanceof CapacityError) return null;
      throw e;
    }
  });
  readonly svg: string | null = $derived(
    this.qr &&
      renderSvg(this.qr, {
        ...this.style,
        logo: this.isEmpty ? undefined : (this.logo ?? undefined),
      }),
  );
  readonly analysis: Analysis = $derived(
    analyze({
      ...this.style,
      hasLogo: this.logo !== null,
      version: this.qr?.version ?? null,
      ecl: this.ecl,
    }),
  );
  readonly capacity: Capacity = $derived(capacity(this.isEmpty ? '' : this.payload, this.ecl));

  /** Resets the active template's fields. */
  clear(): void {
    this.values[this.template] = getTemplate(this.template).empty() as never;
  }

  /** Saves the style to localStorage. Content and logo are never stored. */
  saveStyle(): void {
    storage.set(STYLE_KEY, serializeStyle(this.style));
  }

  /** The current template, values and style as a `#v1=…` hash. Never includes the logo. */
  toHash(): string {
    return encodeHash({ template: this.template, values: this.current, style: this.style });
  }

  /** Restores template, values and style from a link hash. Returns false if it isn't valid. */
  loadHash(hash: string): boolean {
    const shared = decodeHash(hash);
    if (!shared) return false;
    this.template = shared.template;
    this.values[shared.template] = shared.values as never;
    this.style = shared.style;
    this.linkHash = hash;
    return true;
  }
}

/** The single app state instance. */
export const app = new AppState();
