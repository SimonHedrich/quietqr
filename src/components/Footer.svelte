<script lang="ts">
  import { t } from '../lib/state/prefs.svelte';
</script>

<footer class="footer">
  <span>{t('footer.local')}</span>
  <span aria-hidden="true">·</span>
  <span>{t('footer.noTracking')}</span>
  <span aria-hidden="true">·</span>
  <a href="https://github.com/SimonHedrich/quietqr" rel="noopener noreferrer"
    >{t('footer.source')}</a
  >
  <span aria-hidden="true">·</span>
  <span>{t('footer.version', { version: __APP_VERSION__ })}</span>
</footer>

<style>
  .footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    padding: var(--space-6) 0 var(--space-5);
    font-size: 13px;
    color: var(--text-muted);
  }
</style>
