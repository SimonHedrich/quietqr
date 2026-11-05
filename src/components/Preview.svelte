<script lang="ts">
  import { formatNumber } from '../lib/i18n';
  import { app } from '../lib/state/app.svelte';
  import { prefs, t } from '../lib/state/prefs.svelte';
  import { ECL_PERCENT } from '../lib/style';

  const warnings = $derived(app.isEmpty ? [] : app.analysis.warnings);
  const capacityText = $derived(
    t('preview.capacity', {
      used: formatNumber(prefs.locale, app.capacity.used),
      max: formatNumber(prefs.locale, app.capacity.max),
    }),
  );
</script>

<section class="preview card" aria-label={t('preview.label')}>
  <div
    class="code"
    class:placeholder={app.isEmpty}
    class:checker={app.style.transparent && !app.isEmpty}
  >
    {#if app.svg}
      <!-- Safe: built from numbers, validated colors and our own PNG data URL (render.ts). -->
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <div class="svg" role="img" aria-label={t('preview.alt')}>{@html app.svg}</div>
      {#if app.isEmpty}
        <p class="overlay">{t('preview.placeholder')}</p>
      {/if}
    {:else}
      <p class="error" role="alert">{t('preview.overCapacity')}</p>
    {/if}
  </div>

  <div class="status">
    <p class="capacity" class:over={!app.qr}>{capacityText}</p>
    <div class="warnings" aria-live="polite">
      {#each warnings as w (w)}
        <p class="warning">
          {t(`warning.${w}`, { percent: ECL_PERCENT[app.ecl] })}
        </p>
      {/each}
    </div>
  </div>
</section>

<style>
  .preview {
    padding: var(--space-5);
    display: grid;
    gap: var(--space-4);
  }

  .code {
    position: relative;
    aspect-ratio: 1;
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .svg,
  .svg :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .checker {
    background-color: var(--surface);
    background-image:
      linear-gradient(45deg, var(--surface-2) 25%, transparent 25%),
      linear-gradient(-45deg, var(--surface-2) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--surface-2) 75%),
      linear-gradient(-45deg, transparent 75%, var(--surface-2) 75%);
    background-size: 16px 16px;
    background-position:
      0 0,
      0 8px,
      8px -8px,
      -8px 0;
  }

  .placeholder .svg {
    opacity: 0.12;
    filter: grayscale(1);
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-5);
    text-align: center;
    font-weight: 500;
    color: var(--text-muted);
  }

  .error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--space-5);
    text-align: center;
    color: var(--danger);
    background: var(--surface-2);
    border-radius: var(--radius-sm);
  }

  .status {
    display: grid;
    gap: var(--space-2);
  }

  .capacity {
    font-size: 13px;
    color: var(--text-muted);
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .capacity.over {
    color: var(--danger);
  }

  .warnings {
    display: grid;
    gap: var(--space-2);
  }

  .warning {
    padding: 8px 12px;
    font-size: 13px;
    background: var(--warning-bg);
    border: 1px solid var(--warning-border);
    border-radius: var(--radius-sm);
    color: var(--warning-text);
  }

  /* Mobile: a compact sticky preview, code beside the status. */
  @media (max-width: 860px) {
    .preview {
      grid-template-columns: 112px 1fr;
      align-items: center;
      padding: var(--space-3);
      gap: var(--space-3);
    }

    .code {
      max-width: 112px;
    }

    .overlay {
      display: none;
    }

    .capacity {
      text-align: left;
    }

    .warning {
      padding: 4px 8px;
      font-size: 12px;
    }

    .error {
      padding: var(--space-2);
      font-size: 11px;
    }
  }
</style>
