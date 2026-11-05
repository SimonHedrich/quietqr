<script lang="ts">
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import TextField from '../fields/TextField.svelte';
  import { fieldError } from './field-error';
</script>

<TextField
  id="email-to"
  label={t('email.to')}
  type="email"
  inputmode="email"
  spellcheck={false}
  bind:value={app.values.email.to}
  error={fieldError('to')}
/>
<TextField id="email-subject" label={t('email.subject')} bind:value={app.values.email.subject} />
<TextField id="email-body" label={t('email.body')} multiline bind:value={app.values.email.body} />
