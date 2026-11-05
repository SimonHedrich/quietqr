# Decisions

The technical decisions behind quietqr and why each one was made. Change one only for a
concrete reason, and update this file in the same pull request.

## A static app, no backend

QR encoding runs entirely in the browser, so the app is a static bundle:

- Privacy is checkable: the data never leaves the browser, and a strict CSP forbids
  connections to anywhere.
- The container is just a static file server, so it stays tiny.
- GitHub Pages and the Docker image serve the **same build**. Vite's `base` is relative
  (`./`), so the app works at `/` and under a sub-path such as `/quietqr/`.
- No runtime configuration: a static app would need an entrypoint that writes a config
  file. Worth adding only for a real need (e.g. default colors).

## Frontend: Svelte 5 + Vite + TypeScript

| Option | Runtime | Verdict |
|---|---|---|
| Vanilla TS | 0 KB | State handling for many interdependent options gets messy |
| **Svelte 5** | a few KB, compiled | **Chosen**: readable components, low barrier for contributors, tiny output |
| Vue 3 | ~35 KB gz | Fine, but no advantage here |
| Preact / Solid | small | Fewer contributors know them |
| React | ~45 KB+ gz | Too heavy for a single page |

Plain Vite + Svelte, not SvelteKit: it's one page without routing. Styling uses Svelte's
scoped CSS with design tokens as CSS custom properties (also for dark mode); a utility
framework would add tooling without much gain on a single screen.

Toolchain: Node 26 LTS (`.nvmrc`, `engines`), Vite 8, TypeScript 6 in strict mode
(TypeScript 7 waits for `svelte-check` support), ESLint with typescript-eslint and
eslint-plugin-svelte, Prettier, Vitest, Playwright.

Code structure: everything under `src/lib/` except the reactive state and the browser
export glue is plain TypeScript without DOM access, so it is unit-tested in Node. Svelte
components only do UI.

## QR encoding and rendering

- **Encoder: [`uqr`](https://github.com/unjs/uqr)** (MIT, ~4 KB gz), a typed ESM port of
  Nayuki's reference encoder (identical output in a comparison). It never raises the
  error-correction level on its own and reports what each module is (finder, timing,
  alignment, format), which the renderer and the logo area need. Nayuki's code itself has
  no official npm package and hides that information.
- Lone UTF-16 surrogates in text are replaced with U+FFFD before encoding (the encoder
  would throw).
- **Own SVG renderer** (`src/lib/qr/render.ts`): one SVG string for the preview, the SVG
  download and the PNG export, so what you see is what you get.
  - Square: horizontal runs merged into one `<path>`, so there are no hairline seams.
  - Rounded: a corner is rounded (radius 0.5 modules) when both neighbours on that side are
    light, so connected shapes get rounded outer corners and a lone module becomes a dot.
  - Dots: circles with radius 0.4 modules.
  - Finder patterns are drawn separately and follow the shape (sharp, rounded, round).
  - It only accepts validated `#rrggbb` colors and a PNG data URL as logo; anything else
    throws, so user input can't inject markup.
- **Fixed quiet zone** of 4 modules: a missing margin is a common reason codes fail.
- **Logo area** (`src/lib/qr/logo.ts`): a centered square of about 20 % of the code width
  (snapped to an odd number of modules) plus 1 module of padding. With a logo the code is
  at least version 2, because in version 1 the area would reach the format information.
  Finder, timing and format modules are never covered (tested for every version). From
  version 7 on, the central alignment pattern is covered; decoders estimate it from the
  others, which the scan tests confirm. Uploaded images of any format are redrawn as PNG
  in a canvas, so an SVG logo can't carry scripts.
- **Error correction:** Auto starts at M (15 %) without a logo and H (30 %) with one, then
  takes the highest level that still fits into the same QR version: free robustness for
  short content (`encodeRaised` in `src/lib/qr/encode.ts`). uqr has a similar option, but it
  doesn't report the resulting level, which the UI shows. A fixed level is used as is. A
  5-button control (Auto + four levels) rather than a slider, since there are only four.
- **Capacity indicator:** UTF-8 bytes of the payload against the byte-mode capacity of a
  version-40 code at the starting level (L 2953, M 2331, Q 1663, H 1273 bytes). Shown with
  "~" because digits and upper-case text pack denser; the hard "too long" error comes from
  the encoder itself.

## Payload formats

Chosen from Apple's iOS QR documentation, the ZXing and Android sources, and user reports.
Device reports are welcome (see [roadmap.md](roadmap.md)).

- **WiFi:** `WIFI:T:WPA;S:…;P:…;;` with `\ ; , " :` escaped. `T:WPA` also for WPA2/WPA3
  (the Wi-Fi Alliance spec allows nothing else for password networks; iOS ignores
  `T:SAE`). `T:nopass` without `P` for open networks, `H:true` only for hidden ones.
  Hex-looking SSIDs are not quoted (iOS rejects quoted values).
- **Contact: vCard 3.0** with CRLF; `N` and `FN` always present (iOS shows an empty name
  without `N`); UTF-8 without `CHARSET` (vCard 4.0 garbled umlauts on iOS); no MeCard.
- **Email:** `mailto:` with RFC 6068 percent-encoding (`%20` for spaces, `%0D%0A` for line
  breaks; `+` would show up literally in some mail apps).
- **SMS: `SMSTO:<number>:<message>`.** iOS prefills the message only for `SMSTO:`; `sms:`
  gets the number only. ZXing splits at the first colon, so colons in the message are fine.
- **Phone:** `tel:` with separators removed and a `(0)` after the country code dropped.
- **Location:** `geo:lat,lng` with at most 5 decimals (~1 m); iOS Camera opens Maps for it.
- **Event: a bare `VEVENT`** with CRLF. ZXing finds `BEGIN:VEVENT` anywhere and needs only
  `DTSTART`; a `VCALENDAR` wrapper, `UID`, `DTSTAMP` and `PRODID` cost capacity and are not
  read. Times are entered in local time and stored as UTC; all-day events use
  `VALUE=DATE` with an exclusive end date. No line folding (readers don't need it).

## Scannability warnings

`src/lib/qr/analyze.ts`; thresholds calibrated with the scan tests:

- **Low contrast:** below 3:1 (WCAG for graphics). Clean renders decode down to ~1.3:1, but
  cameras face glare, print and poor light, so there's no reason to go lower.
- **Inverted:** the foreground is lighter than the background.
- **Transparent background** is judged against white, where such codes usually end up.
- **Logo too large:** a logo at L or M. In the scan tests both failed for longer payloads;
  Q and H always passed.
- **Very dense:** above version 20 (97 modules; under 0.5 mm per module when printed 5 cm
  wide). A full contact card with a logo is about version 16 and doesn't warn.
- The curated color presets all have at least 7:1 contrast and produce no warnings.

## Tests

- **Unit tests** (Vitest) for every template (escaping, empty fields, unicode), the
  renderer, logo area, warnings, i18n and state.
- **Scan tests** (`tests/scan/`) render every shape × level × logo (none / solid / noisy) ×
  color pair × short/long payload, every preset combination, a sweep of versions with a
  logo, and Auto-raised codes; then rasterize them with `@resvg/resvg-js` (~8 px per module)
  and decode them with `zxing-wasm` (ZXing-C++). Every combination must either decode or
  produce a warning.
- **Playwright smoke test** (`e2e/`) clicks through every template, the keyboard flow,
  downloads (decoding the PNG), clipboard, shared links, persistence, logo and warnings,
  and fails on any console error or request to another origin. CI runs it against the
  built app and against the Docker image.

## State and privacy

- **No save/load and no stored content.** WiFi passwords and contact data must not end up
  in localStorage or browser history by accident. localStorage keeps only the style and
  the UI language/theme.
- **Links are explicit:** the URL hash is written only by "Copy link"
  (`#v1=<base64url(JSON)>`, versioned so the format can evolve). Data from a hash or from
  localStorage is sanitized field by field before use.
- **The logo is never stored**, neither in localStorage nor in links.
- **Downloads are named after the template**, never after the content.

## Internationalisation

From the start, because translations are the easiest way to contribute and retrofitting is
painful. No library: `src/lib/i18n/en.ts` is the source of truth, other languages must
`satisfies Messages` (missing or extra keys are type errors), and a test checks that
placeholders match.

## Container: static-web-server

| Server | Image (approx.) | Verdict |
|---|---|---|
| nginx (alpine/unprivileged) | ~20 MB | Familiar, but larger |
| **static-web-server** (Rust) | ~4 MB | **Chosen**: built for this, scratch-based, headers via config |
| busybox httpd | ~1–2 MB | Too primitive (headers, compression) |
| Caddy | ~40 MB | Overkill unless it also terminates TLS |

- Multi-stage `Dockerfile`: a `node:26-alpine` build stage that runs on the build machine's
  platform (multi-arch builds don't emulate Node), then `dist/` copied into
  `joseluisq/static-web-server` (scratch-based: no shell, no package manager).
- Runs as `65534:65534` on port 8080; works with `--read-only` and `--cap-drop ALL`.
- `docker/sws.toml`: brotli/gzip compression, no directory listing, `/health` endpoint.
- Measured for v0.1.0: image 3.6 MB, idle memory about 6.5 MiB, app bundle 45 KB gzipped
  (JS + CSS).

**Headers:**

- `Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self';
  img-src 'self' data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none';
  frame-ancestors 'none'`. No `'unsafe-inline'` is needed: Svelte's CSS is extracted to a
  file and dynamic styles go through the CSSOM. `data:` is for the logo inside the SVG,
  `blob:` for drawing images into a canvas.
- `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy` and `-Resource-Policy: same-origin`, and a
  `Permissions-Policy` that allows only geolocation (for "Use my location").
- Caching: hashed files under `assets/` are `immutable` for a year; everything else,
  including `index.html`, is `no-cache`.

**Hosts without headers** (such as GitHub Pages): every build also contains the CSP as a
`<meta http-equiv>` tag (single source: `src/csp.ts`; a test keeps `docker/sws.toml` in
sync) and `<meta name="referrer" content="no-referrer">`. A meta tag can't carry
`frame-ancestors`, `X-Content-Type-Options`, `Permissions-Policy`, COOP/CORP or cache
headers, but the core guarantee (no requests to other origins) holds. The dev server has
no CSP because Vite injects inline styles for hot reloading.

## CI/CD

- **CI** on pull requests and `main`: type check, lint, unit and scan tests, build,
  Playwright; a second job builds the Docker image, runs it read-only and runs the
  Playwright test against it.
- **Pages** deploys `main` to GitHub Pages; **Release** builds and pushes a multi-arch image
  (amd64 + arm64) to `ghcr.io/simonhedrich/quietqr` on `v*` tags, with semver tags, `latest`
  and OCI labels, and fails if the tag doesn't match `package.json`. Both call CI first, so
  nothing ships untested.
- Actions are pinned to exact versions with least-privilege permissions. Dependabot updates
  npm packages, actions and the Docker base images weekly, grouped.

## Dependencies and license

- **Few dependencies:** at runtime only Svelte and uqr. A smaller supply chain fits the
  privacy promise. New dependencies need a reason, plus their size and maintenance status
  in the pull request.
- **MIT license**, for the widest use. Icons are adapted from Lucide (ISC).
