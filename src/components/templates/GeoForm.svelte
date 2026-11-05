<script lang="ts">
  import { icons } from '../../lib/icons';
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import { formatCoordinate, parseLocation } from '../../lib/templates/geo';
  import TextField from '../fields/TextField.svelte';
  import Icon from '../Icon.svelte';
  import { fieldError } from './field-error';

  let note = $state<'shortLink' | 'locationFailed' | null>(null);
  let locating = $state(false);
  const canLocate = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  /** Pasting a maps link or "lat, lng" into either field fills both. */
  function onpaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') ?? '';
    const found = parseLocation(text);
    if (found === 'shortLink') {
      e.preventDefault();
      note = 'shortLink';
    } else if (found) {
      e.preventDefault();
      app.values.geo.lat = formatCoordinate(found.lat);
      app.values.geo.lng = formatCoordinate(found.lng);
      note = null;
    }
  }

  function locate() {
    locating = true;
    note = null;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        app.values.geo.lat = formatCoordinate(pos.coords.latitude);
        app.values.geo.lng = formatCoordinate(pos.coords.longitude);
        locating = false;
      },
      () => {
        note = 'locationFailed';
        locating = false;
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
</script>

<div class="row">
  <TextField
    id="geo-lat"
    label={t('geo.lat')}
    inputmode="decimal"
    placeholder="48.13743"
    bind:value={app.values.geo.lat}
    error={fieldError('lat')}
    {onpaste}
  />
  <TextField
    id="geo-lng"
    label={t('geo.lng')}
    inputmode="decimal"
    placeholder="11.57549"
    bind:value={app.values.geo.lng}
    error={fieldError('lng')}
    {onpaste}
  />
</div>

{#if canLocate}
  <button type="button" class="button locate" onclick={locate} disabled={locating}>
    <Icon paths={icons.locate} />
    {locating ? t('geo.locating') : t('geo.useLocation')}
  </button>
{/if}

<p class="hint" role="status">
  {#if note === 'shortLink'}{t('geo.shortLink')}{:else if note === 'locationFailed'}{t(
      'geo.locationFailed',
    )}{:else}{t('geo.pasteHint')}{/if}
</p>

<style>
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .locate {
    justify-self: start;
  }
</style>
