<script lang="ts">
  import { canCopyImage, copyPng, copyText } from '../lib/export/clipboard';
  import { downloadBlob, svgBlob } from '../lib/export/download';
  import { exportFilename } from '../lib/export/filename';
  import { PNG_SIZES, svgToPng, type PngSize } from '../lib/export/png';
  import { icons } from '../lib/icons';
  import { app } from '../lib/state/app.svelte';
  import { t } from '../lib/state/prefs.svelte';
  import Icon from './Icon.svelte';

  let size = $state<PngSize>(1024);
  let imageStatus = $state<'copied' | 'failed' | null>(null);
  let linkStatus = $state<'copied' | 'failed' | null>(null);
  const showCopyImage = canCopyImage();
  const disabled = $derived(app.isEmpty || !app.svg);

  function flash(set: (v: 'copied' | 'failed' | null) => void, value: 'copied' | 'failed') {
    set(value);
    setTimeout(() => set(null), 2000);
  }

  function downloadSvg() {
    if (app.svg) downloadBlob(svgBlob(app.svg), exportFilename(app.template, 'svg'));
  }

  async function downloadPng() {
    if (app.svg) downloadBlob(await svgToPng(app.svg, size), exportFilename(app.template, 'png'));
  }

  async function copyImage() {
    if (!app.svg) return;
    try {
      await copyPng(svgToPng(app.svg, size));
      flash((v) => (imageStatus = v), 'copied');
    } catch {
      flash((v) => (imageStatus = v), 'failed');
    }
  }

  async function copyLink() {
    const hash = app.toHash();
    const link = location.href.split('#')[0] + hash;
    history.replaceState(history.state, '', link);
    app.linkHash = hash;
    try {
      await copyText(link);
      flash((v) => (linkStatus = v), 'copied');
    } catch {
      flash((v) => (linkStatus = v), 'failed');
    }
  }

  const statusText = (s: 'copied' | 'failed' | null, idle: string, done: string) =>
    s === 'copied' ? done : s === 'failed' ? t('export.copyFailed') : idle;
</script>

<section class="export" aria-label={t('export.heading')}>
  <div class="downloads">
    <button
      type="button"
      class="button primary"
      aria-label={t('export.download', { format: 'SVG' })}
      {disabled}
      onclick={downloadSvg}
    >
      <Icon paths={icons.download} />
      {t('export.svg')}
    </button>
    <div class="png">
      <button
        type="button"
        class="button primary"
        aria-label={t('export.download', { format: 'PNG' })}
        {disabled}
        onclick={downloadPng}
      >
        <Icon paths={icons.download} />
        {t('export.png')}
      </button>
      <label class="visually-hidden" for="png-size">{t('export.size')}</label>
      <select id="png-size" class="input size" bind:value={size} {disabled}>
        {#each PNG_SIZES as s (s)}<option value={s}>{s} px</option>{/each}
      </select>
    </div>
  </div>
  <div class="copies">
    {#if showCopyImage}
      <button type="button" class="button" {disabled} onclick={copyImage}>
        <Icon paths={imageStatus === 'copied' ? icons.check : icons.copy} />
        <span aria-live="polite"
          >{statusText(imageStatus, t('export.copyImage'), t('export.copied'))}</span
        >
      </button>
    {/if}
    <button type="button" class="button" {disabled} onclick={copyLink}>
      <Icon paths={linkStatus === 'copied' ? icons.check : icons.link} />
      <span aria-live="polite"
        >{statusText(linkStatus, t('export.copyLink'), t('export.linkCopied'))}</span
      >
    </button>
  </div>
  <p class="hint note">{t('export.linkNote')}</p>
</section>

<style>
  .export {
    display: grid;
    gap: var(--space-2);
  }

  .downloads,
  .copies {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }

  .copies:has(> :only-child) {
    grid-template-columns: 1fr;
  }

  .png {
    display: flex;
    min-width: 0;
  }

  .png .button {
    flex: 1;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .size {
    width: auto;
    padding: 0 6px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 0;
    font-size: 13px;
  }

  .note {
    text-align: center;
  }
</style>
