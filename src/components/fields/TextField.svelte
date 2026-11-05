<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';

  /** A labelled text input or textarea with an optional inline error. */
  let {
    id,
    label,
    value = $bindable(),
    error,
    multiline = false,
    rows = 4,
    type = 'text',
    inputmode,
    autocomplete = 'off',
    placeholder,
    spellcheck,
    onpaste,
    action,
  }: {
    id: string;
    label: string;
    value: string;
    error?: string | undefined;
    multiline?: boolean;
    rows?: number;
    type?: 'text' | 'url' | 'email' | 'tel' | 'password' | 'date' | 'datetime-local';
    inputmode?: HTMLInputAttributes['inputmode'];
    autocomplete?: HTMLInputAttributes['autocomplete'];
    placeholder?: string;
    spellcheck?: boolean;
    onpaste?: (e: ClipboardEvent) => void;
    /** Something inside the input's right edge, e.g. a show-password button. */
    action?: Snippet;
  } = $props();

  const errorId = $derived(`${id}-error`);
</script>

<div class="field">
  <label class="label" for={id}>{label}</label>
  <div class="control" class:has-action={action}>
    {#if multiline}
      <textarea
        {id}
        class="input"
        {rows}
        {placeholder}
        {spellcheck}
        bind:value
        {onpaste}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}></textarea>
    {:else}
      <input
        {id}
        class="input"
        {type}
        {inputmode}
        {autocomplete}
        {placeholder}
        {spellcheck}
        bind:value
        {onpaste}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
      />
    {/if}
    {#if action}<div class="action">{@render action()}</div>{/if}
  </div>
  {#if error}<p class="field-error" id={errorId}>{error}</p>{/if}
</div>

<style>
  .control {
    position: relative;
  }

  .has-action .input {
    padding-right: 44px;
  }

  .action {
    position: absolute;
    top: 2px;
    right: 2px;
  }
</style>
