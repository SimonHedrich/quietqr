# Plan

Where the work stands and what comes next. Delete finished steps; fold their results into the docs.

## Status

The repo holds only planning docs, `LICENSE` (MIT) and a stub README. No code yet. The
motivation and goals ([brief.md](brief.md)) and the tech stack ([decisions.md](decisions.md))
are decided.

## Next steps

1. **Functionality interview, before writing any code.** Simon explicitly deferred
   "what features and how" to this step. Ask him (one topic at a time, with a recommendation
   for each), then write the answers into a new `docs/features.md`:
   - Which data templates, and which fields each has (URL, text, WiFi, vCard/MeCard, email,
     SMS, phone, geo, calendar event, …)?
   - Styling options: which module shapes (square, rounded, dots?), colors (fg/bg only?),
     logo upload (size limit, padding/excavation), margin, error-correction level (auto
     vs manual)?
   - Export: SVG, PNG (sizes/DPI), copy to clipboard, print, PDF?
   - Layout and look: single screen, preview position, mobile layout, dark mode, any visual
     references he likes?
   - State: URL hash + localStorage as decided, or anything else (named saved codes)?
   - Scannability warnings: which checks, and how intrusive?
   - Languages for the first release.
   - Extras to consider or rule out: batch generation from CSV, QR scanning/decoding,
     PWA/offline.
2. **Scaffold:** Vite + Svelte 5 + TS, ESLint + Prettier, Vitest, `base: './'`, folder layout
   (`src/lib/qr/` encoder+renderer, `src/lib/templates/` data encoders, `src/components/`).
3. **Core:** matrix encoder choice (`uqr` vs Nayuki), SVG renderer, data templates with unit
   tests, decode-based scan tests.
4. **UI** following `docs/features.md`, i18n, accessibility.
5. **Export** (SVG/PNG/clipboard), URL-hash state.
6. **Docker:** multi-stage build → static-web-server, non-root, CSP and other security
   headers; check image size and memory.
7. **CI/CD:** checks on PRs, Pages deploy, GHCR multi-arch release on tags, Dependabot.
8. **Docs:** full README (screenshot, demo link, docker/compose, inspiration credit to
   mini-qr), CONTRIBUTING.md, `docs/` updated to current state.
