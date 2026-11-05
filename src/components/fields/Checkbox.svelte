<script lang="ts">
  /** A labelled checkbox. */
  let { label, checked = $bindable() }: { label: string; checked: boolean } = $props();
</script>

<label class="checkbox">
  <input type="checkbox" bind:checked />
  <span>{label}</span>
</label>

<style>
  .checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 32px;
    font-size: 14px;
    cursor: pointer;
  }

  input {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--accent);
  }
</style>
