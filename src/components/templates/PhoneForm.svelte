<script lang="ts">
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import TextField from '../fields/TextField.svelte';
  import { fieldError } from './field-error';
</script>

<TextField
  id="phone-number"
  label={t('phone.number')}
  type="tel"
  inputmode="tel"
  placeholder="+49 721 123456"
  bind:value={app.values.phone.number}
  error={fieldError('number')}
/>
