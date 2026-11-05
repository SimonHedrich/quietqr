<script lang="ts">
  import { parseHex, type Hex } from '../../lib/color';
  import { t } from '../../lib/state/prefs.svelte';

  /** Swatch (native color picker), hex input and curated presets for one color. */
  let {
    id,
    label,
    value = $bindable(),
    presets,
    disabled = false,
  }: {
    id: string;
    label: string;
    value: Hex;
    presets: readonly Hex[];
    disabled?: boolean;
  } = $props();

  let text = $state('');
  let invalid = $state(false);

  // Mirror the value into the hex field whenever it changes from outside.
  $effect.pre(() => {
    text = value;
    invalid = false;
  });

  function onTextInput() {
    const hex = parseHex(text);
    invalid = hex === null;
    if (hex) value = hex;
  }
</script>

<fieldset class="color" {disabled}>
  <legend class="label">{label}</legend>
  <div class="inputs">
    <label class="swatch" style:--swatch={value}>
      <span class="visually-hidden">{t('style.pickColor', { name: label })}</span>
      <input type="color" bind:value />
    </label>
    <input
      {id}
      class="input hex"
      type="text"
      spellcheck="false"
      autocomplete="off"
      maxlength="7"
      aria-label={t('style.hex', { name: label })}
      aria-invalid={invalid ? 'true' : undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      bind:value={text}
      oninput={onTextInput}
      onblur={() => (text = value)}
    />
  </div>
  <div class="presets">
    {#each presets as preset (preset)}
      <button
        type="button"
        class="preset"
        style:--swatch={preset}
        aria-label={t('style.preset', { color: preset })}
        aria-pressed={value === preset}
        onclick={() => (value = preset)}
      ></button>
    {/each}
  </div>
  {#if invalid}<p class="field-error" id="{id}-error">{t('style.invalidHex')}</p>{/if}
</fieldset>

<style>
  .color {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  .color:disabled {
    opacity: 0.5;
  }

  .inputs {
    display: flex;
    gap: var(--space-2);
  }

  .swatch {
    position: relative;
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--swatch);
    border: 1px solid var(--border-strong);
    cursor: pointer;
  }

  .swatch:has(:focus-visible) {
    outline: 2px solid var(--focus);
    outline-offset: 2px;
  }

  .swatch input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .hex {
    font-family: var(--font-mono);
    font-size: 14px;
    text-transform: lowercase;
  }

  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: var(--space-2);
  }

  .preset {
    width: 26px;
    height: 26px;
    padding: 0;
    border-radius: 50%;
    background: var(--swatch);
    border: 1px solid var(--border-strong);
  }

  .preset[aria-pressed='true'] {
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 4px var(--accent);
  }
</style>
