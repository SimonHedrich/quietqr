<script lang="ts">
  import { encodeQr } from '../../lib/qr/encode';
  import { renderSvg } from '../../lib/qr/render';
  import { app } from '../../lib/state/app.svelte';
  import { t } from '../../lib/state/prefs.svelte';
  import { BG_PRESETS, ECL_CHOICES, ECL_PERCENT, FG_PRESETS, SHAPES } from '../../lib/style';
  import Checkbox from '../fields/Checkbox.svelte';
  import Segmented from '../fields/Segmented.svelte';
  import ColorField from './ColorField.svelte';
  import LogoField from './LogoField.svelte';

  // A tiny fixed code for the shape buttons, drawn in the user's colors.
  const sample = encodeQr('quietqr', 'L');
  const minis = $derived(
    Object.fromEntries(
      SHAPES.map((shape) => [
        shape,
        renderSvg(sample, { shape, fg: app.style.fg, bg: app.style.bg, transparent: false }),
      ]),
    ),
  );

  const caption = $derived.by(() => {
    if (app.style.ecl !== 'auto')
      return t('style.eclCaptionFixed', { percent: ECL_PERCENT[app.ecl] });
    if (app.logo) return t('style.eclCaptionAutoLogo', { percent: ECL_PERCENT[app.baseEcl] });
    // Before anything is entered, the placeholder code says nothing about the user's content.
    if (app.isEmpty || app.ecl === app.baseEcl)
      return t('style.eclCaptionAuto', { percent: ECL_PERCENT[app.baseEcl] });
    return t('style.eclCaptionAutoRaised', {
      percent: ECL_PERCENT[app.ecl],
      base: ECL_PERCENT[app.baseEcl],
    });
  });
</script>

<section class="style card" aria-labelledby="style-heading">
  <h2 id="style-heading" class="section-title">{t('style.heading')}</h2>

  <Segmented name="shape" legend={t('style.shape')} options={SHAPES} bind:value={app.style.shape}>
    {#snippet label(shape)}
      <!-- Safe: built from a fixed payload and validated colors (render.ts). -->
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      <span class="mini" aria-hidden="true">{@html minis[shape]}</span>
      <span>{t(`style.shape.${shape}`)}</span>
    {/snippet}
  </Segmented>

  <div class="colors">
    <ColorField
      id="fg"
      label={t('style.foreground')}
      presets={FG_PRESETS}
      bind:value={app.style.fg}
    />
    <ColorField
      id="bg"
      label={t('style.background')}
      presets={BG_PRESETS}
      bind:value={app.style.bg}
      disabled={app.style.transparent}
    />
  </div>
  <Checkbox label={t('style.transparent')} bind:checked={app.style.transparent} />

  <LogoField />

  <div>
    <Segmented name="ecl" legend={t('style.ecl')} options={ECL_CHOICES} bind:value={app.style.ecl}>
      {#snippet label(choice)}
        {#if choice === 'auto'}
          <span>{t('style.ecl.auto')}</span>
        {:else}
          <span>{ECL_PERCENT[choice]} %</span><span class="level">{choice}</span>
        {/if}
      {/snippet}
    </Segmented>
    <p class="hint caption">{caption}</p>
  </div>
</section>

<style>
  .style {
    padding: var(--space-4) var(--space-5) var(--space-5);
    display: grid;
    gap: var(--space-5);
  }

  .colors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    margin-bottom: calc(-1 * var(--space-3));
  }

  .mini {
    display: block;
    width: 36px;
    height: 36px;
    margin: 4px 0 2px;
  }

  .mini :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 3px;
  }

  .level {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1;
  }

  .caption {
    margin-top: 6px;
  }

  @media (max-width: 600px) {
    .style {
      padding: var(--space-3) var(--space-4) var(--space-4);
    }
  }

  @media (max-width: 420px) {
    .colors {
      grid-template-columns: 1fr;
    }
  }
</style>
