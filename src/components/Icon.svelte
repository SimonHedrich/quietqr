<script lang="ts">
  /** An inline SVG icon from src/lib/icons.ts (decorative; label the button around it). */
  let { paths, size = 18 }: { paths: readonly string[]; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#each paths as d (d)}<path {d} />{/each}
</svg>
