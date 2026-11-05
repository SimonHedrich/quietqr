<script lang="ts" generics="T extends string">
  import type { Snippet } from 'svelte';

  /**
   * A segmented control built on native radio buttons, so arrow keys, focus and screen
   * reader semantics come from the browser.
   */
  let {
    name,
    legend,
    options,
    value = $bindable(),
    label,
    hideLegend = false,
  }: {
    name: string;
    legend: string;
    options: readonly T[];
    value: T;
    /** Renders one option's content. */
    label: Snippet<[T]>;
    hideLegend?: boolean;
  } = $props();
</script>

<fieldset class="segmented">
  <legend class={hideLegend ? 'visually-hidden' : 'label'}>{legend}</legend>
  <div class="options">
    {#each options as option (option)}
      <label class="option" class:selected={value === option}>
        <input type="radio" {name} value={option} bind:group={value} class="visually-hidden" />
        {@render label(option)}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .segmented {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  .options {
    display: flex;
    gap: 2px;
    padding: 3px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }

  .option {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 34px;
    padding: 4px 8px;
    border-radius: 5px;
    font-size: 14px;
    text-align: center;
    color: var(--text-muted);
    cursor: pointer;
    transition:
      background var(--duration),
      color var(--duration);
  }

  .option:hover {
    color: var(--text);
  }

  .option.selected {
    background: var(--selected);
    color: var(--text);
    font-weight: 500;
    box-shadow: 0 1px 2px rgb(0 0 0 / 12%);
  }

  .option:has(:focus-visible) {
    outline: 2px solid var(--focus);
    outline-offset: 1px;
  }
</style>
