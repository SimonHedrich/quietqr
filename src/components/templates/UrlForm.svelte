<script lang="ts">
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import TextField from '../fields/TextField.svelte';
  import { fieldError } from './field-error';
</script>

<TextField
  id="url-url"
  label={t('url.url')}
  type="url"
  inputmode="url"
  autocomplete="url"
  placeholder="example.com"
  spellcheck={false}
  bind:value={app.values.url.url}
  error={fieldError('url')}
/>
