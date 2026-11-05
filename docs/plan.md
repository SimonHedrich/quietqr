# Plan

Where the work stands and what comes next. Delete finished steps; fold their results into the docs.

## Status

The project is scaffolded (Vite + Svelte 5 + TS strict, ESLint + Prettier, Vitest; Node 26
LTS). The
motivation and goals ([brief.md](brief.md)), the tech stack ([decisions.md](decisions.md))
and the feature set ([features.md](features.md)) are decided.

## Next steps

How to carry these out (order, architecture, quality gates, milestones):
[implementation-guide.md](implementation-guide.md).

1. **Core:** matrix encoder choice (`uqr` vs Nayuki), SVG renderer (3 shapes, logo
   excavation, fixed quiet zone), the 9 data templates with unit tests (check `SMSTO:` vs
   `sms:` on iOS and Android first), decode-based scan tests.
2. **UI** following `docs/features.md`, i18n (EN + DE), accessibility.
3. **Export** (SVG/PNG/clipboard), "Copy link" hash state, style in localStorage.
4. **Docker:** multi-stage build → static-web-server, non-root, CSP and other security
   headers; check image size and memory.
5. **CI/CD:** checks on PRs, Pages deploy, GHCR multi-arch release on tags, Dependabot.
6. **Docs:** full README (screenshot, demo link, docker/compose, inspiration credit to
   mini-qr), CONTRIBUTING.md, `docs/` updated to current state.
