# Plan

Where the work stands and what comes next. Delete finished steps; fold their results into the docs.

## Status

Version 0.1.0 is built on the `build/v1` branch: all nine templates, the style options,
scannability warnings, export (SVG, PNG, clipboard), "Copy link", EN + DE, light + dark,
the Docker image, CI, the Pages deploy and the release workflow. Tests: unit tests,
decode-based scan tests over every option combination, and a Playwright smoke test that
also runs against the Docker image in CI.

Measured: JS + CSS 44.8 KB gzipped (target ≤ 60 KB), image 3.6 MB, idle memory 6.5 MiB
(details in [decisions.md](decisions.md)).

## Next steps

1. **Review and merge** `build/v1`.
2. **Enable GitHub Pages** (Settings → Pages → Source: GitHub Actions) and check that the
   demo works at `https://simonhedrich.github.io/quietqr/`.
3. **Check payloads on real phones** (iOS Camera, Google Camera/Lens, Samsung): WiFi
   (incl. WPA3 and hidden), Contact, SMS prefill, Event (timed and all-day), Location. The
   formats are chosen from documentation and ZXing's source, not device tests.
4. **Release:** tag `v0.1.0`; the release workflow pushes the multi-arch image to GHCR.
   Make the package public in the GHCR package settings.

## Possible follow-ups (not planned)

- PWA / offline support (listed as a possible follow-up in [features.md](features.md)).
- More languages (see CONTRIBUTING.md).
- TypeScript 7 once `svelte-check` supports it (Dependabot ignores it until then).
