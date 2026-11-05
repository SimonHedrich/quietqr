<script lang="ts">
  import { icons } from '../../lib/icons';
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import type { WifiSecurity } from '../../lib/templates/wifi';
  import Checkbox from '../fields/Checkbox.svelte';
  import Segmented from '../fields/Segmented.svelte';
  import TextField from '../fields/TextField.svelte';
  import Icon from '../Icon.svelte';
  import { fieldError } from './field-error';

  const SECURITY: readonly WifiSecurity[] = ['WPA', 'WEP', 'nopass'];
  let showPassword = $state(false);
  const v = $derived(app.values.wifi);
</script>

<TextField
  id="wifi-ssid"
  label={t('wifi.ssid')}
  spellcheck={false}
  bind:value={app.values.wifi.ssid}
  error={fieldError('ssid')}
/>

<Segmented
  name="wifi-security"
  legend={t('wifi.security')}
  options={SECURITY}
  bind:value={app.values.wifi.security}
>
  {#snippet label(option)}{t(`wifi.security.${option}`)}{/snippet}
</Segmented>

{#if v.security !== 'nopass'}
  <TextField
    id="wifi-password"
    label={t('wifi.password')}
    type={showPassword ? 'text' : 'password'}
    autocomplete="off"
    spellcheck={false}
    bind:value={app.values.wifi.password}
    error={fieldError('password')}
  >
    {#snippet action()}
      <button
        type="button"
        class="icon-button"
        aria-pressed={showPassword}
        aria-label={t('wifi.showPassword')}
        onclick={() => (showPassword = !showPassword)}
      >
        <Icon paths={showPassword ? icons.eyeOff : icons.eye} />
      </button>
    {/snippet}
  </TextField>
{/if}

<Checkbox label={t('wifi.hidden')} bind:checked={app.values.wifi.hidden} />
