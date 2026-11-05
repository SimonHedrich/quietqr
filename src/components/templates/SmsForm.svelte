<script lang="ts">
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import TextField from '../fields/TextField.svelte';
  import { fieldError } from './field-error';
</script>

<TextField
  id="sms-number"
  label={t('sms.number')}
  type="tel"
  inputmode="tel"
  placeholder="+49 170 1234567"
  bind:value={app.values.sms.number}
  error={fieldError('number')}
/>
<TextField
  id="sms-message"
  label={t('sms.message')}
  multiline
  bind:value={app.values.sms.message}
/>
