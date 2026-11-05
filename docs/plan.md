# Plan

Where the work stands and what comes next. Delete finished steps; fold their results into the docs.

## Status

The project is scaffolded (Vite + Svelte 5 + TS strict, ESLint + Prettier, Vitest; Node 26
LTS). The QR core (encoder, SVG renderer with three shapes, logo excavation, capacity)
and the nine data templates are done and covered by unit and decode-based scan tests, and so is the scannability analysis. The UI (EN + DE, light + dark, desktop + mobile),
export (SVG, PNG, clipboard), "Copy link" and style persistence are done, with a
Playwright smoke test in `e2e/`. The
motivation and goals ([brief.md](brief.md)), the tech stack ([decisions.md](decisions.md))
and the feature set ([features.md](features.md)) are decided.

## Next steps

How to carry these out (order, architecture, quality gates, milestones):
[implementation-guide.md](implementation-guide.md).

1. **Docker:** multi-stage build → static-web-server, non-root, CSP and other security
   headers; check image size and memory.
2. **CI/CD:** checks on PRs, Pages deploy, GHCR multi-arch release on tags, Dependabot.
3. **Docs:** full README (screenshot, demo link, docker/compose, inspiration credit to
   mini-qr), CONTRIBUTING.md, `docs/` updated to current state.
