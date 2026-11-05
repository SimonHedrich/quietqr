<script lang="ts">
  import ExportBar from './components/ExportBar.svelte';
  import Footer from './components/Footer.svelte';
  import Header from './components/Header.svelte';
  import Preview from './components/Preview.svelte';
  import StyleSection from './components/style/StyleSection.svelte';
  import TemplatePanel from './components/TemplatePanel.svelte';
  import TemplatePicker from './components/TemplatePicker.svelte';
  import { app } from './lib/state/app.svelte';
  import { prefs } from './lib/state/prefs.svelte';

  $effect(() => {
    document.documentElement.lang = prefs.locale;
  });

  $effect(() => {
    if (prefs.theme) document.documentElement.dataset.theme = prefs.theme;
    else delete document.documentElement.dataset.theme;
  });

  // A link pasted into a tab where the app is already open only changes the hash.
  $effect(() => {
    const onHashChange = () => {
      if (location.hash !== app.linkHash) app.loadHash(location.hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });

  // Persist the style (and only the style) whenever it changes.
  $effect(() => {
    app.saveStyle();
  });

  // Once the user edits after loading or copying a link, drop the hash from the address
  // bar so stale content isn't shared again by accident.
  $effect(() => {
    const current = app.toHash();
    if (app.linkHash !== null && current !== app.linkHash) {
      app.linkHash = null;
      history.replaceState(history.state, '', location.pathname + location.search);
    }
  });
</script>

<div class="page">
  <Header />
  <main class="layout">
    <div class="inputs">
      <div class="picker"><TemplatePicker /></div>
      <div class="form"><TemplatePanel /></div>
      <div class="style"><StyleSection /></div>
    </div>
    <aside class="output">
      <div class="preview"><Preview /></div>
      <div class="export"><ExportBar /></div>
    </aside>
  </main>
  <Footer />
</div>

<style>
  .page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 var(--space-5);
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
    gap: var(--space-6);
    align-items: start;
  }

  .inputs {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
    min-width: 0;
  }

  .output {
    position: sticky;
    top: var(--space-4);
    display: grid;
    gap: var(--space-4);
  }

  /* Mobile: one column; the compact preview sticks to the top while typing. */
  @media (max-width: 860px) {
    .page {
      padding: 0 var(--space-4);
    }

    .layout {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-4);
    }

    .inputs,
    .output {
      display: contents;
    }

    .preview {
      order: 0;
      position: sticky;
      top: 0;
      z-index: 5;
      padding-top: var(--space-2);
      margin-top: calc(-1 * var(--space-2));
      background: var(--bg);
    }

    .picker {
      order: 1;
      min-width: 0;
    }

    .form {
      order: 2;
    }

    .export {
      order: 3;
    }

    .style {
      order: 4;
    }
  }
</style>
