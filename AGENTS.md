# AGENTS.md

Instructions for LLM agents (and humans) working on quietqr – a private, self-hostable QR code
generator that runs entirely in the browser.

## Start here

1. [docs/brief.md](docs/brief.md) – motivation, goals, principles, non-goals. Read it fully;
   it explains what to leave out and why.
2. [docs/decisions.md](docs/decisions.md) – tech stack and the reasoning behind it. Don't
   reopen a decision without a concrete new reason; if one changes, update that file.
3. [docs/features.md](docs/features.md) – what the app does: templates, styling, export,
   state, warnings, layout. Build to this; don't add features it doesn't list.
4. [docs/roadmap.md](docs/roadmap.md) – current state, help wanted, ideas.
5. [CONTRIBUTING.md](CONTRIBUTING.md) – setup, checks, code layout, how to add a template or
   a language.

## Rules

- **Fewer options, better defaults.** Before adding an option, check it against the
  non-goals in the brief. Prefer a curated choice that always produces a good, scannable code.
- **Privacy:** no backend calls, no telemetry, no external fonts/CDNs/assets. Everything
  ships in the bundle.
- **Dependencies:** add one only when writing it ourselves would be clearly worse. Mention
  its size and maintenance status in the PR/commit.
- **Code:** TypeScript strict; small, focused modules; QR/encoding logic stays in plain TS
  (framework-free, unit-tested), Svelte components only do UI.
- **Docs:** every exported function gets a doc comment. Docs describe the current state only
  (git has the history). When a change affects a decision, feature or step, update the
  matching file in `docs/` in the same commit; remove finished items from `docs/roadmap.md`.
- **Git:** conventional, imperative commit messages (`feat: add WiFi template`). Stage
  paths explicitly. Ask before pushing or force-pushing.
