<script lang="ts">
  import { LOCALE_NAMES, LOCALES, type Locale } from '../lib/i18n';
  import { icons } from '../lib/icons';
  import { prefs, t } from '../lib/state/prefs.svelte';
  import Icon from './Icon.svelte';

  const systemDark =
    typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
  let systemIsDark = $state(systemDark?.matches ?? false);
  $effect(() => {
    const update = () => (systemIsDark = systemDark?.matches ?? false);
    systemDark?.addEventListener('change', update);
    return () => systemDark?.removeEventListener('change', update);
  });
  const dark = $derived(prefs.theme ? prefs.theme === 'dark' : systemIsDark);
</script>

<header class="header">
  <h1 class="name">
    <svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M2 2h5v5H2zm1 1v3h3V3zm6-1h5v5H9zm1 1v3h3V3zM2 9h5v5H2zm1 1v3h3v-3zm1-6h1v1H4zm7 0h1v1h-1zM4 11h1v1H4zm5-2h2v2H9zm2 2h1v1h-1zm1-2h2v1h-2zm0 3h2v2h-2zm-3 1h2v1H9z"
      />
    </svg>
    {t('app.name')}
  </h1>
  <div class="actions">
    <label class="lang icon-button" title={t('header.language')}>
      <Icon paths={icons.languages} />
      <span class="visually-hidden">{t('header.language')}</span>
      <select
        value={prefs.locale}
        onchange={(e) => prefs.setLocale(e.currentTarget.value as Locale)}
      >
        {#each Object.keys(LOCALES) as code (code)}
          <option value={code}>{LOCALE_NAMES[code as Locale]}</option>
        {/each}
      </select>
    </label>
    <button
      type="button"
      class="icon-button"
      aria-label={dark ? t('header.themeLight') : t('header.themeDark')}
      title={dark ? t('header.themeLight') : t('header.themeDark')}
      onclick={() => prefs.setTheme(dark ? 'light' : 'dark')}
    >
      <Icon paths={dark ? icons.sun : icons.moon} />
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) 0;
  }

  .name {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 19px;
    font-weight: 650;
    letter-spacing: -0.01em;
  }

  .name svg {
    color: var(--accent);
  }

  .actions {
    display: flex;
    gap: var(--space-1);
  }

  .lang {
    position: relative;
  }

  .lang:has(:focus-visible) {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .lang select {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
</style>
