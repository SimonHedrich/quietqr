<script lang="ts">
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import TextField from '../fields/TextField.svelte';
</script>

<TextField
  id="text-text"
  label={t('text.text')}
  multiline
  rows={6}
  bind:value={app.values.text.text}
/>
