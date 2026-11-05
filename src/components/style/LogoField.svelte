<script lang="ts">
  import { LOGO_TYPES, logoToPng } from '../../lib/export/logo';
  import { icons } from '../../lib/icons';
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import Icon from '../Icon.svelte';

  let input: HTMLInputElement | undefined = $state();
  let dragging = $state(false);
  let failed = $state(false);

  async function use(file: File | undefined) {
    if (!file) return;
    try {
      app.logo = await logoToPng(file);
      failed = false;
    } catch {
      failed = true;
    }
  }

  function ondrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    void use(e.dataTransfer?.files[0]);
  }

  function remove() {
    app.logo = null;
    if (input) input.value = '';
  }
</script>

<div class="logo">
  <span class="label" id="logo-label">{t('style.logo')}</span>
  {#if app.logo}
    <div class="current">
      <img src={app.logo} alt="" width="40" height="40" />
      <button type="button" class="button" onclick={remove}>
        <Icon paths={icons.x} size={16} />
        {t('style.logoRemove')}
      </button>
    </div>
  {:else}
    <button
      type="button"
      class="drop"
      class:dragging
      aria-labelledby="logo-label logo-drop-text"
      onclick={() => input?.click()}
      ondragover={(e) => {
        e.preventDefault();
        dragging = true;
      }}
      ondragleave={() => (dragging = false)}
      {ondrop}
    >
      <Icon paths={icons.image} size={20} />
      <span id="logo-drop-text">{t('style.logoDrop')}</span>
      <span class="hint">{t('style.logoFormats')}</span>
    </button>
  {/if}
  <input
    bind:this={input}
    type="file"
    accept={LOGO_TYPES.join(',')}
    class="visually-hidden"
    tabindex="-1"
    aria-hidden="true"
    onchange={(e) => use(e.currentTarget.files?.[0])}
  />
  {#if failed}<p class="field-error" role="alert">{t('style.logoFailed')}</p>{/if}
</div>

<style>
  .drop {
    display: grid;
    justify-items: center;
    gap: 2px;
    width: 100%;
    padding: var(--space-4);
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    font-size: 14px;
    transition:
      border-color var(--duration),
      background var(--duration);
  }

  .drop:hover,
  .drop.dragging {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--text);
  }

  .current {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  img {
    border-radius: 6px;
    border: 1px solid var(--border);
    background: #fff;
    object-fit: contain;
  }
</style>
