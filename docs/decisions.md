# Decisions

The tech decisions and why each option beat the alternatives. Planned in a session before the repo
existed. The numbers are estimates from that session; check them when you implement.

## Build from scratch, don't fork mini-qr

- Almost everything Simon dislikes about mini-qr (UI, layout, option set, presets, randomizer,
  save/load) is most of its code. A fork would remove more than it keeps and inherit someone
  else's structure.
- mini-qr's styling model comes from `qr-code-styling`. Keeping the library would keep the
  options model.
- License: check mini-qr's license before reusing any code from it. It is believed to be
  GPL-3.0, which would not be compatible with releasing quietqr as MIT. Using it for ideas only
  is fine. Credit it in the README as inspiration.
- A GitHub fork shows "forked from" and sends visitors and contributors back to upstream.

## No backend – a static single-page app

QR encoding runs fully client-side, so the app is a static bundle:

- Privacy can be checked: the data never leaves the browser. Strict CSP, no external
  requests.
- The container is only a static file server. Its footprint depends almost entirely on the
  server choice.
- GitHub Pages and the Docker image serve the **same build**. Use a relative Vite `base`
  (`./`) so it works both at `/` and at `/quietqr/`.
- It can work offline (PWA optional, later).

## Frontend: Svelte 5 + Vite + TypeScript

| Option | Runtime | Verdict |
|---|---|---|
| Vanilla TS | 0 KB | State handling for many interdependent options gets messy |
| **Svelte 5** | a few KB, compiled away | **Chosen**: readable components, low barrier for contributors, tiny output |
| Vue 3 | ~35 KB gz | Fine (mini-qr uses it), no advantage here |
| Preact / Solid | small | Fewer contributors know them |
| React | ~45 KB+ gz | Too heavy for this |

Plain Vite + Svelte, **not SvelteKit**: it's a single page with no routing.

Toolchain: Node 26 (current LTS, pinned in `.nvmrc` and `engines`), Vite 8, Svelte 5,
TypeScript 6 (TypeScript 7 is out, but `svelte-check` doesn't support it yet), ESLint 10 flat
config with typescript-eslint and eslint-plugin-svelte, Prettier, Vitest.

## QR: small encoder + own SVG renderer

- Encode with a library that returns the module matrix and lets you control the error-correction
  level, version and mask: **`uqr`** (unjs; ESM, TS, tiny) or **Nayuki's QR Code generator**
  (reference quality, MIT). Pick one when you implement; check that it is maintained and
  how big it is.
- **Write our own SVG renderer** (~100–200 lines). We decide exactly which few styles exist
  (e.g. square vs rounded modules, one foreground/background color, an optional logo with an
  excavated area) instead of inheriting `qr-code-styling`'s option sprawl.
- Export: SVG directly; PNG by drawing the SVG to a canvas at the chosen size; copy to the clipboard.

## Styling: scoped CSS + custom properties

Svelte scoped CSS with design tokens as CSS custom properties (also used for dark mode). Tailwind
v4 would work, but for a single-screen app it adds tooling without much gain.

## Container: static-web-server

| Server | Image (approx.) | Idle RAM | Notes |
|---|---|---|---|
| nginx:alpine / nginx-unprivileged | ~20 MB compressed | a few MB | Familiar, easy header config. Fallback choice |
| **static-web-server** (Rust) | ~3–5 MB | ~1–3 MB | **Chosen**: built for exactly this, scratch-based, headers via config/env |
| busybox httpd | ~1–2 MB | <1 MB | Too primitive (headers, compression) |
| Caddy | ~40 MB | 10+ MB | Overkill unless it also does TLS |

Multi-stage Dockerfile: a `node` build stage, then `dist/` copied into the static-web-server
image. Run as non-root, works with a read-only root filesystem, security headers (CSP etc.) set by
the server. Multi-arch (amd64 + arm64), published to `ghcr.io/simonhedrich/quietqr`.
Target app bundle: ~30–60 KB gzipped.

No runtime configuration through env vars for now: a static app would need an entrypoint that
writes a `config.json`. Add it only if a real need shows up (e.g. default colors).

## Other decisions

- **License: MIT** (already in the repo) for the widest use.
- **Scannability is a feature:** warn about low contrast, inverted colors, a logo too large for
  the error-correction level, or a very dense code.
- **Automated scan tests:** Vitest unit tests for the data encoders (WiFi escaping, vCard,
  …), plus tests that render codes across the offered option range and decode them
  (`zxing-wasm` or `jsQR`), so every option combination is guaranteed to scan.
- **No save/load buttons; content is never persisted.** WiFi passwords and contact data must
  not end up in browser history or localStorage by accident. localStorage keeps only the
  style. The URL hash is written only on an explicit "Copy link", which makes a configuration
  a shareable link that never touches a server. The logo is never stored.
- **Data templates first-class:** URL, WiFi, Text, Contact, Email, Phone, SMS, Geo, Calendar
  (details in [features.md](features.md)). One module per template in `src/lib/templates/`.
- **Error correction:** automatic by default (M without a logo, H with one), with a manual
  override shown directly as a 5-button segmented control (Auto + the four levels). Only four
  levels exist, so a slider would add nothing.
- **Fixed quiet zone** of 4 modules, not configurable: it removes a common reason codes fail
  to scan.
- **i18n from day one** (English + German for the first release). Translations are the easiest way for
  outsiders to contribute, and retrofitting i18n is painful.
- **Accessibility:** keyboard navigation, labels, good contrast in the UI itself.
- **Few dependencies:** smaller supply-chain surface, which fits the privacy promise.
  Dependabot or Renovate.
- **CI (GitHub Actions):** lint + typecheck + test on PRs; deploy to GitHub Pages from
  `main`; a version tag builds and pushes the multi-arch image to GHCR.
- **Repo hygiene:** README with screenshot, demo link, `docker run` one-liner, compose
  snippet; CONTRIBUTING.md.
