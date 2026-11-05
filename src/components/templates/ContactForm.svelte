<script lang="ts">
  import { icons } from '../../lib/icons';
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import TextField from '../fields/TextField.svelte';
  import Icon from '../Icon.svelte';
  import { fieldError } from './field-error';

  const MORE = [
    'org',
    'title',
    'email',
    'url',
    'street',
    'postalCode',
    'city',
    'country',
    'note',
  ] as const;
  // Open by default when a hidden field already has a value (e.g. from a shared link).
  let expanded = $state(MORE.some((k) => app.values.contact[k] !== ''));
</script>

<div class="row">
  <TextField
    id="contact-firstName"
    label={t('contact.firstName')}
    autocomplete="given-name"
    bind:value={app.values.contact.firstName}
  />
  <TextField
    id="contact-lastName"
    label={t('contact.lastName')}
    autocomplete="family-name"
    bind:value={app.values.contact.lastName}
  />
</div>
<TextField
  id="contact-phone"
  label={t('contact.phone')}
  type="tel"
  inputmode="tel"
  autocomplete="tel"
  bind:value={app.values.contact.phone}
  error={fieldError('phone')}
/>

<button
  type="button"
  class="button ghost disclosure"
  aria-expanded={expanded}
  aria-controls="contact-more"
  onclick={() => (expanded = !expanded)}
>
  <span class="chevron" class:open={expanded}><Icon paths={icons.chevronDown} size={16} /></span>
  {t('form.moreFields')}
</button>

<div id="contact-more" class="more" hidden={!expanded}>
  <div class="row">
    <TextField
      id="contact-org"
      label={t('contact.org')}
      autocomplete="organization"
      bind:value={app.values.contact.org}
    />
    <TextField
      id="contact-title"
      label={t('contact.title')}
      autocomplete="organization-title"
      bind:value={app.values.contact.title}
    />
  </div>
  <TextField
    id="contact-email"
    label={t('contact.email')}
    type="email"
    inputmode="email"
    autocomplete="email"
    bind:value={app.values.contact.email}
    error={fieldError('email')}
  />
  <TextField
    id="contact-url"
    label={t('contact.url')}
    type="url"
    inputmode="url"
    autocomplete="url"
    bind:value={app.values.contact.url}
    error={fieldError('url')}
  />
  <TextField
    id="contact-street"
    label={t('contact.street')}
    autocomplete="street-address"
    bind:value={app.values.contact.street}
  />
  <div class="row postal">
    <TextField
      id="contact-postalCode"
      label={t('contact.postalCode')}
      autocomplete="postal-code"
      bind:value={app.values.contact.postalCode}
    />
    <TextField
      id="contact-city"
      label={t('contact.city')}
      autocomplete="address-level2"
      bind:value={app.values.contact.city}
    />
  </div>
  <TextField
    id="contact-country"
    label={t('contact.country')}
    autocomplete="country-name"
    bind:value={app.values.contact.country}
  />
  <TextField
    id="contact-note"
    label={t('contact.note')}
    multiline
    rows={3}
    bind:value={app.values.contact.note}
  />
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
  }

  .row.postal {
    grid-template-columns: 1fr 2fr;
  }

  .more {
    display: grid;
    gap: var(--space-4);
  }

  .more[hidden] {
    display: none;
  }

  .disclosure {
    justify-self: start;
    padding-left: 6px;
    color: var(--accent);
  }

  .chevron {
    display: inline-flex;
    transform: rotate(-90deg);
    transition: transform var(--duration);
  }

  .chevron.open {
    transform: none;
  }

  @media (max-width: 420px) {
    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
