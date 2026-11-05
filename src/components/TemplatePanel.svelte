<script lang="ts">
  import type { Component } from 'svelte';
  import { app } from '../lib/state/app.svelte';
  import { t } from '../lib/state/prefs.svelte';
  import type { TemplateId } from '../lib/templates/types';
  import CalendarForm from './templates/CalendarForm.svelte';
  import ContactForm from './templates/ContactForm.svelte';
  import EmailForm from './templates/EmailForm.svelte';
  import GeoForm from './templates/GeoForm.svelte';
  import PhoneForm from './templates/PhoneForm.svelte';
  import SmsForm from './templates/SmsForm.svelte';
  import TextForm from './templates/TextForm.svelte';
  import UrlForm from './templates/UrlForm.svelte';
  import WifiForm from './templates/WifiForm.svelte';

  const FORMS: Record<TemplateId, Component> = {
    url: UrlForm,
    wifi: WifiForm,
    text: TextForm,
    contact: ContactForm,
    email: EmailForm,
    phone: PhoneForm,
    sms: SmsForm,
    geo: GeoForm,
    calendar: CalendarForm,
  };

  const Form = $derived(FORMS[app.template]);
</script>

<section class="panel card" aria-labelledby="form-heading">
  <div class="head">
    <h2 id="form-heading" class="section-title">{t(`template.${app.template}`)}</h2>
    <button
      type="button"
      class="button ghost clear"
      onclick={() => app.clear()}
      disabled={app.isEmpty}
    >
      {t('form.clear')}
    </button>
  </div>
  <div class="fields">
    {#key app.template}<Form />{/key}
  </div>
</section>

<style>
  .panel {
    padding: var(--space-4) var(--space-5) var(--space-5);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
    min-height: 36px;
  }

  .clear {
    min-height: 32px;
    padding: 4px 10px;
    margin-right: -10px;
  }

  .fields {
    display: grid;
    gap: var(--space-4);
  }

  @media (max-width: 600px) {
    .panel {
      padding: var(--space-3) var(--space-4) var(--space-4);
    }
  }
</style>
