# Decisions

The tech decisions and why each option beat the alternatives. Numbers in the comparison
tables are estimates made before implementation; measured values for quietqr itself are
marked as measured.

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

- **Encoder: [`uqr`](https://github.com/unjs/uqr)** (unjs, MIT, ~4 KB gz). It is a typed ESM
  port of Nayuki's reference encoder and produced identical matrices in a comparison. It
  never raises the error-correction level unless asked (`boostEcc: false`), and it reports
  the type of each module (finder, timing, alignment, format), which the renderer and the
  logo excavation need. Nayuki's own code has no official npm package (we would vendor a
  file), raises the level by default in `encodeText`, and hides the function-pattern map.
- Text with lone UTF-16 surrogates is repaired to U+FFFD before encoding (the encoder would
  throw).
- **Own SVG renderer** (`src/lib/qr/render.ts`), one SVG string for preview, SVG and PNG:
  - Square: horizontal runs merged into one `<path>`, so there are no hairline seams.
  - Rounded: a module's corner is rounded (radius 0.5) when both neighbours on that side
    are light, so connected shapes get rounded outer corners and a lone module is a circle.
    Inner corners stay sharp.
  - Dots: circles with radius 0.4 modules.
  - Finder patterns are drawn separately and follow the shape: sharp, rounded squares,
    or concentric circles.
  - Fixed 4-module quiet zone; colors must be validated `#rrggbb`, the logo a PNG data URL,
    or the renderer throws.
- **Logo excavation** (`src/lib/qr/logo.ts`): a centered square of the nearest odd module
  count to 20 % of the symbol width + 1 module padding per side. With a logo the code is
  at least version 2, because in version 1 the area would reach the format information.
  From version 7 on the central alignment pattern sits in the middle and is covered; the
  scan tests show decoders cope. Finder, timing and format modules are never touched
  (unit-tested for every version).
- **Capacity indicator:** UTF-8 bytes of the payload against the byte-mode capacity of a
  version-40 code at the current level (L 2953, M 2331, Q 1663, H 1273). Shown with "~"
  because digits and upper-case text pack denser; the hard error comes from the encoder
  itself, so it is exact.
- **Scan tests** (`tests/scan/`) render every shape × level × logo (none / solid / noisy)
  × color pair × short/long payload, plus every preset color combination and a sweep of
  versions with a logo at H. They rasterize with `@resvg/resvg-js` (~8 px per module) and
  decode with `zxing-wasm` (ZXing-C++). With a logo, L and M failed for the long payload in
  every shape, Q and H always passed; those combinations get a warning instead.
- Export: SVG directly; PNG by drawing the SVG to a canvas at the chosen size; copy to the
  clipboard.

## Payload formats

Researched from Apple's iOS QR tech talk, ZXing and AOSP sources and user reports (no
first-hand device tests were available; worth checking on real phones before release):

- **SMS: `SMSTO:<number>:<message>`.** iOS prefills the message only for `SMSTO:`; `sms:`
  gets the number only. ZXing (Android) splits at the first colon, so colons in the
  message are fine; nothing is percent-encoded.
- **Calendar: bare `VEVENT`.** ZXing finds `BEGIN:VEVENT` anywhere and needs only `DTSTART`;
  iOS accepts iCalendar events. `VCALENDAR`, `UID`, `DTSTAMP` and `PRODID` cost capacity and
  nobody reads them. CRLF per RFC 5545, no line folding (readers don't need it, and it
  costs bytes).
- **vCard 3.0** with CRLF; `N` and `FN` always present (iOS shows an empty name without
  `N`); UTF-8 without `CHARSET` (vCard 4.0 garbled umlauts on iOS).
- **WiFi:** `T:WPA` for WPA/WPA2/WPA3 (the Wi-Fi Alliance spec allows nothing else for
  password networks; iOS ignores `T:SAE`). No quoting of hex-looking SSIDs (iOS rejects
  quoted values).
- **Geo:** `geo:lat,lng` (iOS Camera opens Maps for it), 5 decimals.

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

Multi-stage `Dockerfile`: a `node:26-alpine` build stage (runs on the build platform, so
multi-arch builds don't emulate Node), then `dist/` copied into
`joseluisq/static-web-server:2.44.1` (scratch-based: no shell, no package manager). Runs as
`65534:65534` on port 8080 and works with `--read-only` and `--cap-drop ALL`. Config in
`docker/sws.toml`: dynamic compression (brotli/gzip), no directory listing, `/health`.
Multi-arch (amd64 + arm64), published to `ghcr.io/simonhedrich/quietqr`.

Measured (v0.1.0, arm64): **app bundle 45.0 KB gzipped** (JS 41.5 KB + CSS 3.6 KB; target
was ≤ 60 KB), **image 3.6 MB** (server 3.5 MB + app 0.13 MB), **idle memory
6.5 MiB** (`docker stats` after start; ~19 MiB right after serving a test run).

**Headers** (`docker/sws.toml`):
- `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self';
  img-src 'self' data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none';
  frame-ancestors 'none'`. Svelte needs no `'unsafe-inline'`: its CSS is extracted to a file
  and dynamic styles are set through the CSSOM. `data:` is for the logo inside the SVG,
  `blob:` for loading SVG/logo files into a canvas. The e2e suite runs against the
  container and fails on any console error, so CSP violations would show.
- `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy`/`-Resource-Policy: same-origin`, `Permissions-Policy` that
  allows only geolocation for the app itself.
- Caching: `assets/**` (hashed names) `public, max-age=31536000, immutable`; everything
  else, including `index.html`, `no-cache`.

**GitHub Pages** can't send headers. The build writes the same CSP (single source:
`src/csp.ts`, a test keeps `sws.toml` in sync) as a `<meta http-equiv>` tag, plus
`<meta name="referrer" content="no-referrer">`. Not enforceable there: `frame-ancestors`
(ignored in meta, so the demo can be framed), `X-Content-Type-Options`, `Permissions-Policy`,
COOP/CORP and our cache headers. The privacy guarantee (no requests to other origins) holds
on Pages too. The meta tag is only added to builds; Vite's dev server needs inline styles.

No runtime configuration through env vars for now: a static app would need an entrypoint that
writes a `config.json`. Add it only if a real need shows up (e.g. default colors).

## Other decisions

- **License: MIT** (already in the repo) for the widest use.
- **Scannability is a feature:** warn about low contrast, inverted colors, a logo too large for
  the error-correction level, or a very dense code (`src/lib/qr/analyze.ts`). Thresholds:
  - *Low contrast:* below 3:1 (WCAG for graphics). Clean renders decode down to ~1.3:1 in
    the scan tests, but cameras face glare, print and poor light, so there's no evidence
    to go lower.
  - *Inverted:* the foreground has a higher luminance than the background.
  - *Transparent background* is judged against white, where such codes usually end up.
  - *Logo too large:* a logo at L or M. In the scan tests both failed for longer payloads;
    Q and H always passed.
  - *Very dense:* version above 20 (97 modules; under 0.5 mm per module at 5 cm print).
    A full contact card with a logo (H) is about version 16 and doesn't warn.
  - The curated presets all have at least 7:1 contrast and produce no warnings (tested).
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
  outsiders to contribute, and retrofitting i18n is painful. No library: `src/lib/i18n/en.ts`
  is the source of truth, other languages must `satisfies Messages` (missing or extra keys
  are type errors), and a test checks that placeholders match.
- **Accessibility:** keyboard navigation, labels, good contrast in the UI itself.
- **Few dependencies:** smaller supply-chain surface, which fits the privacy promise.
  Dependabot or Renovate.
- **CI (GitHub Actions):** lint + typecheck + test on PRs; deploy to GitHub Pages from
  `main`; a version tag builds and pushes the multi-arch image to GHCR (the tag must match
  `package.json`). The CI also builds the image, runs it read-only and runs the Playwright
  smoke test against it. The Pages and Release workflows call CI first, so nothing is deployed
  or published untested. Actions are pinned to exact versions and updated by Dependabot
  (npm, actions, Docker; grouped, weekly).
- **Repo hygiene:** README with screenshot, demo link, `docker run` one-liner, compose
  snippet; CONTRIBUTING.md.
