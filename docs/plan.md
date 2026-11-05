# Plan

Where the work stands and what comes next. Delete finished steps; fold their results into the docs.

## Status

The repo holds only planning docs, `LICENSE` (MIT) and a stub README. No code yet. The
motivation and goals ([brief.md](brief.md)), the tech stack ([decisions.md](decisions.md))
and the feature set ([features.md](features.md)) are decided.

## Next steps

1. **Scaffold:** Vite + Svelte 5 + TS, ESLint + Prettier, Vitest, `base: './'`, folder layout
   (`src/lib/qr/` encoder+renderer, `src/lib/templates/` data encoders, `src/components/`).
2. **Core:** matrix encoder choice (`uqr` vs Nayuki), SVG renderer (3 shapes, logo
   excavation, fixed quiet zone), the 9 data templates with unit tests (check `SMSTO:` vs
   `sms:` on iOS and Android first), decode-based scan tests.
3. **UI** following `docs/features.md`, i18n (EN + DE), accessibility.
4. **Export** (SVG/PNG/clipboard), "Copy link" hash state, style in localStorage.
5. **Docker:** multi-stage build → static-web-server, non-root, CSP and other security
   headers; check image size and memory.
6. **CI/CD:** checks on PRs, Pages deploy, GHCR multi-arch release on tags, Dependabot.
7. **Docs:** full README (screenshot, demo link, docker/compose, inspiration credit to
   mini-qr), CONTRIBUTING.md, `docs/` updated to current state.
