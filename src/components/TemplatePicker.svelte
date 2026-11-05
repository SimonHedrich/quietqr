<script lang="ts">
  import { tick } from 'svelte';
  import { icons } from '../lib/icons';
  import { app } from '../lib/state/app.svelte';
  import { prefs, t } from '../lib/state/prefs.svelte';
  import { getTemplate, TEMPLATE_ORDER } from '../lib/templates/registry';
  import type { TemplateId } from '../lib/templates/types';
  import Icon from './Icon.svelte';

  const GAP = 6;
  /** Width of the "…" chip without a label, and the extra width of its chevron. */
  const dotsWidth = 38;
  const CHEVRON = 22;

  let row: HTMLDivElement | undefined = $state();
  let measure: HTMLDivElement | undefined = $state();
  let menu: HTMLDivElement | undefined = $state();
  let moreButton: HTMLButtonElement | undefined = $state();
  let width = $state(0);
  let chipWidths = $state<number[]>([]);
  let open = $state(false);
  /** Index of the chip that has tabindex 0 (roving focus). */
  let focusIndex = $state(0);

  /** How many of the first chips fit into `available` pixels. */
  function fit(available: number): number {
    let used = 0;
    let n = 0;
    for (const w of chipWidths) {
      if (used + w > available) break;
      used += w + GAP;
      n++;
    }
    return n;
  }

  /**
   * How many chips fit next to the "…" chip; all of them if no overflow is needed. Space is
   * reserved for the "…" chip showing the widest overflowed template, so the row doesn't
   * change when one of them is picked from the menu.
   */
  const visibleCount = $derived.by(() => {
    if (!width || chipWidths.length === 0) return TEMPLATE_ORDER.length;
    if (fit(width) === chipWidths.length) return chipWidths.length;
    const first = fit(width - dotsWidth - GAP);
    const reserve = Math.max(dotsWidth, ...chipWidths.slice(first)) + CHEVRON;
    return Math.max(1, fit(width - reserve - GAP));
  });
  const visible = $derived(TEMPLATE_ORDER.slice(0, visibleCount));
  const overflow = $derived(TEMPLATE_ORDER.slice(visibleCount));
  const activeInOverflow = $derived(overflow.includes(app.template));
  /** Focusable chips in the row: the visible ones plus "…" if there is an overflow. */
  const stops = $derived(visible.length + (overflow.length ? 1 : 0));

  // Re-measure chip widths when labels change (language switch).
  $effect(() => {
    void prefs.locale;
    if (!measure) return;
    const chips = [...measure.querySelectorAll<HTMLElement>('[data-chip]')];
    chipWidths = chips.map((c) => c.getBoundingClientRect().width);
  });

  $effect(() => {
    if (!row) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) width = entry.contentRect.width;
    });
    ro.observe(row);
    return () => ro.disconnect();
  });

  // Keep the roving tab stop on the active template.
  $effect(() => {
    const i = visible.indexOf(app.template);
    focusIndex = i >= 0 ? i : visible.length;
  });

  function select(id: TemplateId) {
    app.template = id;
  }

  function chipButtons(): HTMLButtonElement[] {
    return row ? [...row.querySelectorAll<HTMLButtonElement>(':scope > button')] : [];
  }

  function onRowKeydown(e: KeyboardEvent) {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    let next: number | null = null;
    if (e.key in keys) next = (focusIndex + (keys[e.key] ?? 0) + stops) % stops;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = stops - 1;
    if (next === null || (open && e.target !== moreButton)) return;
    if (e.key === 'ArrowDown' && e.target === moreButton) return; // opens the menu instead
    e.preventDefault();
    focusIndex = next;
    chipButtons()[next]?.focus();
  }

  async function openMenu() {
    open = true;
    await tick();
    const items = menuItems();
    (items.find((i) => i.getAttribute('aria-checked') === 'true') ?? items[0])?.focus();
  }

  function closeMenu(refocus = true) {
    open = false;
    if (refocus) moreButton?.focus();
  }

  function menuItems(): HTMLButtonElement[] {
    return menu ? [...menu.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')] : [];
  }

  function onMoreKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void openMenu();
    }
  }

  function onMenuKeydown(e: KeyboardEvent) {
    const items = menuItems();
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = (i + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      return;
    } else if (e.key === 'Tab') {
      closeMenu(false);
      return;
    }
    if (next !== null) {
      e.preventDefault();
      items[next]?.focus();
    }
  }

  function pick(id: TemplateId) {
    select(id);
    closeMenu();
  }

  function onWindowClick(e: MouseEvent) {
    if (!open) return;
    const target = e.target as Node;
    if (!menu?.contains(target) && !moreButton?.contains(target)) closeMenu(false);
  }
</script>

<svelte:window onclick={onWindowClick} />

<div class="picker">
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="row"
    role="toolbar"
    aria-label={t('templates.label')}
    bind:this={row}
    onkeydown={onRowKeydown}
  >
    {#each visible as id, i (id)}
      <button
        type="button"
        class="chip"
        aria-pressed={app.template === id}
        tabindex={focusIndex === i ? 0 : -1}
        onclick={() => select(id)}
      >
        <Icon paths={getTemplate(id).icon} size={16} />
        <span>{t(`template.${id}`)}</span>
      </button>
    {/each}
    {#if overflow.length}
      <button
        type="button"
        class="chip more"
        bind:this={moreButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="template-menu"
        aria-pressed={activeInOverflow}
        aria-label={activeInOverflow ? undefined : t('templates.more')}
        tabindex={focusIndex === visible.length ? 0 : -1}
        onclick={() => (open ? closeMenu() : openMenu())}
        onkeydown={onMoreKeydown}
      >
        {#if activeInOverflow}
          <Icon paths={getTemplate(app.template).icon} size={16} />
          <span>{t(`template.${app.template}`)}</span>
          <Icon paths={icons.chevronDown} size={14} />
        {:else}
          <Icon paths={icons.more} size={16} />
        {/if}
      </button>
    {/if}
  </div>

  {#if open}
    <div
      class="menu card"
      id="template-menu"
      role="menu"
      tabindex="-1"
      aria-label={t('templates.more')}
      bind:this={menu}
      onkeydown={onMenuKeydown}
    >
      {#each overflow as id (id)}
        <button
          type="button"
          role="menuitemradio"
          aria-checked={app.template === id}
          tabindex="-1"
          class="item"
          onclick={() => pick(id)}
        >
          <Icon paths={getTemplate(id).icon} size={16} />
          <span>{t(`template.${id}`)}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Invisible copy of all chips, used only to measure their widths. -->
  <div class="measure" aria-hidden="true" bind:this={measure}>
    {#each TEMPLATE_ORDER as id (id)}
      <span class="chip" data-chip>
        <Icon paths={getTemplate(id).icon} size={16} /><span>{t(`template.${id}`)}</span>
      </span>
    {/each}
  </div>
</div>

<style>
  .picker {
    position: relative;
    min-width: 0;
  }

  .row {
    display: flex;
    gap: 6px;
    min-width: 0;
  }

  .chip {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    white-space: nowrap;
    transition:
      background var(--duration),
      color var(--duration),
      border-color var(--duration);
  }

  .chip:hover {
    color: var(--text);
    border-color: var(--border-strong);
  }

  .chip[aria-pressed='true'] {
    background: var(--accent-soft);
    border-color: var(--accent);
    color: var(--accent);
  }

  .more:not([aria-pressed='true']) {
    padding: 0 10px;
  }

  @media (max-width: 480px) {
    .chip {
      gap: 5px;
      padding: 0 10px;
      font-size: 13.5px;
    }
  }

  .menu {
    position: absolute;
    z-index: 10;
    top: calc(100% + 6px);
    right: 0;
    min-width: 180px;
    padding: 4px;
    display: grid;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 38px;
    padding: 0 12px;
    background: none;
    border: 0;
    border-radius: 6px;
    text-align: left;
    font-size: 14px;
  }

  .item:hover,
  .item:focus-visible {
    background: var(--surface-2);
  }

  .item[aria-checked='true'] {
    color: var(--accent);
    font-weight: 600;
  }

  .measure {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    display: flex;
    gap: 6px;
    top: 0;
    left: 0;
  }
</style>
