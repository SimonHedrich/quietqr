# Implementation guide (v1)

Instructions for the agent that builds quietqr v1 from the current docs-only repo to a
released, tested app. Written for a capable autonomous coding agent (Claude Opus 5.5) working
in Claude Code in this repo.

## 1. Your job

Build the whole app described in [features.md](features.md): code, tests, Docker image, CI and
docs, in the milestones below. Work autonomously. Verify each milestone before moving on, and
commit after each one.

Read these first, fully, in this order: [AGENTS.md](../AGENTS.md), [brief.md](brief.md),
[decisions.md](decisions.md), [features.md](features.md), [plan.md](plan.md). They are the
spec. This guide adds the *how*: order, architecture, quality gates and when to stop.

**Scope rule:** build exactly what `features.md` lists. If you think something is missing,
don't add it. Note it under "Suggestions" in your final report instead.

## 2. How to work

### Milestones, gates, commits

- Work through the milestones in section 4 in order. Each has a **definition of done (DoD)**.
  A milestone is finished only when its DoD holds and the **standard gate** passes:
  `npm run check` (svelte-check + tsc), `npm run lint`, `npm test`, `npm run build`.
- Work on a branch `build/v1` (create it from `main`). Commit after every milestone, and
  more often if useful, using conventional, imperative messages (`feat: add WiFi template`).
  Stage paths explicitly. **Don't push and don't open PRs**; Simon does that after review.
- In the same commit as the code: update `docs/` to the current state. Delete finished steps
  from `plan.md`, and record any decision you made in `decisions.md`/`features.md` (see below).

### Decisions you make vs. questions for Simon

- The docs settle the product. Implementation details they leave open (exact thresholds,
  library choice between named candidates, encoding variants, component structure) are
  **yours to decide**. Decide by the principles (private, few options, always scannable,
  small), write the decision and its one-line reason into the matching doc, and list it in
  the final report.
- **Stop and ask Simon only** when a choice would change what the user sees or can do in a way
  the docs don't cover, or would break a principle (e.g. a needed dependency over ~30 KB gz,
  an external request, dropping a listed feature). Batch such questions; keep working on
  unblocked milestones while you wait.
- Facts (library sizes, maintenance status, how scanners handle a format) are for you to look
  up, not to ask. Use web search, and npm/GitHub metadata.

### Using subagents

- **Research in parallel** where it doesn't block you: encoder comparison (M2) and SMS / vCard
  / VEVENT compatibility research (M3) can run in background subagents while you scaffold.
- **Templates can fan out:** once the `TemplateDef` interface (section 3) is committed, the 9
  template modules + tests are independent and can be written by parallel subagents. Review
  every result yourself before committing. Consistency matters more than speed.
- Keep the QR core, state, and UI shell in your own hands; they define the architecture.
- At the end (M9), get one **independent review** of the whole diff (a fresh subagent or the
  `/code-review` skill) and fix what holds up.

### Verifying in a real browser

Unit tests aren't enough for a UI. From M5 on, run the dev server and drive it with
Playwright (dev dependency) to:

- take screenshots at desktop (1280 px) and mobile (390 px) width, light and dark;
- assert **zero console errors** and **zero requests to any origin other than the app's**;
- click through each template, style option and export.

Look at the screenshots yourself and judge them against the look in `features.md`. Fix what
looks off before you call the milestone done. Keep a small Playwright smoke test in the repo
(`e2e/`) for CI.

## 3. Architecture

### Layout

```
src/
  lib/
    qr/          encode.ts (text + ecl → matrix), render.ts (matrix + style → SVG string),
                 logo.ts (excavation area), capacity.ts, analyze.ts (scannability checks)
    templates/   types.ts, registry.ts, url.ts, wifi.ts, text.ts, contact.ts, email.ts,
                 phone.ts, sms.ts, geo.ts, calendar.ts, (+ *.test.ts next to each)
    state/       app state (Svelte runes in .svelte.ts), style persistence, hash codec
    export/      svg.ts, png.ts, clipboard.ts, filename.ts
    i18n/        index.ts, en.ts, de.ts
    color.ts     hex parsing, relative luminance, contrast ratio
  components/    Svelte UI only
  app.css        design tokens (custom properties), light + dark
e2e/             Playwright smoke test
tests/scan/      decode-based scan tests
```

### Boundaries

- Everything under `src/lib/` (except `state/`'s runes file and `export/` browser glue) is
  **plain, framework-free TypeScript with no DOM access**, so it runs in Vitest under Node.
- `render.ts` returns an SVG **string**. The preview, SVG export and PNG export all use the
  same string, so what you see is what you export.
- Components do UI only: no encoding logic, no string building of payloads.

### Key types (adjust names, keep the shape)

```ts
type TemplateId = 'url' | 'wifi' | 'text' | 'contact' | 'email' | 'phone' | 'sms' | 'geo' | 'calendar';

interface TemplateDef<V> {
  id: TemplateId;
  icon: string;                 // inline SVG path data
  empty: () => V;               // initial field values
  isEmpty: (v: V) => boolean;   // drives placeholder + disabled export
  validate: (v: V) => FieldError[]; // i18n keys, per field
  encode: (v: V) => string;     // the QR payload
}

interface Style {
  shape: 'square' | 'rounded' | 'dots';
  fg: string; bg: string; transparent: boolean;
  ecl: 'auto' | 'L' | 'M' | 'Q' | 'H';
}
```

Template field components are per template (`components/templates/WifiForm.svelte` …).
Don't build a generic form engine; nine small forms are clearer.

### i18n

No library. A typed dictionary: `en.ts` is the source of truth and `de.ts` must satisfy
`typeof en` (missing keys are type errors). A `t(key, params?)` helper and a reactive locale
store, detected from `navigator.languages`, with a switcher in the header. Every user-visible
string goes through `t`, including aria labels and warnings. Set `<html lang>` accordingly.

### Icons

Inline SVG, no icon font, no runtime icon library. Copying a few icons from a permissively
licensed set (e.g. Lucide, ISC) is fine. Note the source and license in a comment and in the
README.

### Dependencies

Runtime: ideally only the QR encoder. Dev: Vite, Svelte, TS, ESLint, Prettier, Vitest,
Playwright, a decoder (`zxing-wasm` or `jsQR`) and an SVG rasterizer for Node scan tests
(e.g. `@resvg/resvg-js`). For each one you add, put its size and maintenance status in the
commit message (AGENTS.md rule).

## 4. Milestones

### M0 – Setup check

Check the Node version (use current LTS; add `.nvmrc` and `engines`) and that Docker is
available. Create the branch. In the background, start research subagents for M2 (encoder)
and M3 (formats).

DoD: branch exists; research running.

### M1 – Scaffold

Vite + Svelte 5 + TS strict, `base: './'`; ESLint (flat config, typescript-eslint,
eslint-plugin-svelte) + Prettier; Vitest; npm scripts `dev`, `build`, `preview`, `check`,
`lint`, `format`, `test`, `test:e2e`. Folder layout from section 3. An `index.html` with no
external references. A minimal page that renders "quietqr".

DoD: standard gate passes; `dist/` works when opened under a sub-path (`npx vite preview
--base /quietqr/` or equivalent).

### M2 – QR core

- **Encoder:** choose between `uqr` and Nayuki's `qrcodegen` by maintenance, size, API (needs
  matrix output + fixed ECL; mask/version control is a plus), correctness. Record the choice
  in `decisions.md`.
- **Renderer:** three shapes. Square modules merge into crisp rects (combine runs, so there
  are no hairline gaps between modules). Rounded uses rounded outer corners on connected
  shapes or rounded modules; pick whichever looks better and scans in tests. Dots draws
  circles. Finder patterns are drawn separately and follow the shape (sharp / rounded /
  round). Fixed 4-module quiet zone. Transparent background omits the background rect.
  Output is minimal, valid SVG with a `viewBox`.
- **Logo:** the excavated area is centered and about 20 % of the code width, plus padding of
  about 1 module. It is snapped to whole modules and never touches finder, timing or
  alignment patterns. Embed the logo as a PNG data URL `<image>`.
- **Auto ECL:** M without a logo, H with one.
- **Capacity:** the used/maximum count for the current ECL, and the "exceeds capacity"
  error.
- **Scan tests** (`tests/scan/`): render every combination of
  shape × ECL × (with/without logo) × (a few color pairs, including each curated preset) ×
  (short/long payload), rasterize, decode, and assert the payload round-trips. Logo test
  images are generated in the test (e.g. a solid or noisy square), not downloaded. Combinations
  that the app warns about (e.g. logo with a low ECL) are expected to *maybe* fail. Assert the
  warning instead.

DoD: gate passes; all scan tests pass; renderer output looks right (render a sample grid to an
HTML file and screenshot it).

### M3 – Templates

Define `types.ts` + `registry.ts` (order from `features.md`) first and commit them. Then build
the nine modules with unit tests, in parallel if you use subagents. Each module needs:

- correct escaping (WiFi: `\ ; , " :`; vCard 3.0: `\ ; ,` and newlines; iCalendar text
  escaping), CRLF where the format requires it, no trailing junk for empty optional fields;
- URL: add `https://` only when there's no scheme; leave `mailto:` etc. alone;
- Geo: validate ranges; parse coordinates from common Google Maps (`@lat,lng`, `q=lat,lng`,
  `ll=`) and OpenStreetMap (`#map=z/lat/lng`, `mlat/mlon`) URLs, with tests per pattern.
  Short links (`maps.app.goo.gl`) can't be resolved offline; show a hint instead;
- Calendar: local input → UTC `…Z` timestamps; all-day uses `VALUE=DATE` with an exclusive
  end date; decide whether the payload is a bare `VEVENT` or wrapped in `VCALENDAR` based on
  research into what iOS and Android camera apps accept, and record it;
- SMS: decide between `SMSTO:` and `sms:` based on that research, and record it.

DoD: gate passes; every template has tests for normal values, empty optional fields, special
characters, unicode, and the scan round trip of a typical payload.

### M4 – Scannability analysis

`analyze.ts` takes (style, logo present, version, ecl, capacity) and returns
`{ warnings: WarningId[], error?: 'overCapacity' }`:

- low contrast: below a ratio you calibrate with the scan tests (start from WCAG 3:1 and
  adjust only with evidence);
- inverted: the foreground is lighter than the background;
- logo too large for the ECL: logo present and ECL below Q (fine-tune with scan tests);
- very dense: version above a threshold you choose (e.g. > 20), with the reason recorded.

The curated presets must produce **no** warnings. Add a test for that.

DoD: gate passes; thresholds recorded in `decisions.md`.

### M5 – UI

Build the screen from `features.md` → *Layout and look*, with tokens in `app.css` (light +
dark, `prefers-color-scheme` + manual toggle stored in localStorage).

- Template chips with overflow: measure with `ResizeObserver`; chips that don't fit go behind
  "…", and that chip shows the active template when it comes from the menu. It must be fully
  keyboard operable (arrow keys in the chip row; menu with roving focus and Escape).
- Forms: labelled inputs, `autocomplete`/`inputmode` where useful (tel, email, url), inline
  validation messages, a password show/hide button with `aria-pressed`, "More fields"
  disclosure for Contact, a Clear button per form. Values per template are kept in memory
  across switches.
- Preview: sticky, re-renders on input (debounce only if needed for long payloads);
  placeholder state; capacity indicator; warnings as a polite live region.
- Style section: shape (segmented, with mini previews), colors (native picker + hex +
  presets), transparent toggle, logo (click/drop, Remove), error correction (segmented
  Auto · 7 % · 15 % · 25 % · 30 % with the "Auto: …" caption).
- Accessibility: visible focus, contrast ≥ 4.5:1 for text in both themes, everything usable
  with only a keyboard, `prefers-reduced-motion` respected.

DoD: gate passes; Playwright screenshots (desktop/mobile × light/dark) reviewed and good;
no console errors; no external requests; keyboard walkthrough works.

### M6 – Export and state

- SVG download; PNG via canvas at 512/1024/2048; copy PNG with `ClipboardItem`. If the browser
  can't do that, the button is hidden or shows a clear message. Filenames are
  `quietqr-<template>.<ext>`.
- Style persisted to localStorage (wrapped in try/catch; works without it). Content and logo
  are never persisted.
- "Copy link": a versioned, compact hash (e.g. `#v1=<base64url(JSON)>`) with the template,
  the values and the style, never the logo. On load, a valid hash restores the state; an
  invalid one is ignored silently. After loading, keep the hash in the address bar until the
  user edits, then clear it (so stale data isn't re-shared). Record this behaviour in
  `features.md`.

DoD: gate passes; unit tests for the hash codec (round trip, unknown version, garbage);
Playwright checks downloads and the link round trip.

### M7 – Docker

Multi-stage `Dockerfile`: Node build stage → `static-web-server` image. Runs as non-root,
works with `--read-only`. Headers: strict CSP (`default-src 'none'`, `script-src 'self'`,
`style-src 'self'` and only what Svelte really needs, `img-src 'self' data: blob:`,
`connect-src 'none'` unless something needs it, `base-uri 'none'`, `form-action 'none'`,
`frame-ancestors 'none'`), `Referrer-Policy: no-referrer`, `X-Content-Type-Options`,
`Permissions-Policy` (only allow geolocation for self), and sensible caching (hashed assets
immutable, `index.html` no-cache). Compression is on. Add a `.dockerignore` and a
`compose.yaml` example.

Verify that the app in the container works with the CSP (no CSP violations in the console),
and that **the CSP also works on GitHub Pages**. Pages can't set headers, so add the same
policy as a `<meta http-equiv>` where possible and note what can't be enforced there. Measure
and record the image size and the idle memory use.

DoD: `docker build` + `docker run` works; the numbers are recorded in `decisions.md`.

### M8 – CI/CD

GitHub Actions:

- `ci.yml` on PRs and pushes: install with cache, then check, lint, test (including scan tests),
  build, Playwright smoke test;
- `pages.yml` on `main`: build and deploy to Pages;
- `release.yml` on `v*` tags: buildx multi-arch (amd64 + arm64) push to
  `ghcr.io/simonhedrich/quietqr` with semver tags + `latest`, plus OCI labels;
- `dependabot.yml` for npm, actions and Docker (grouped, weekly).

Pin actions to versions. Use least-privilege `permissions:`. You can't run these remotely.
Validate them with `actionlint` if available, and dry-run the steps locally.

DoD: workflows lint clean; local equivalents pass.

### M9 – Docs and review

- README: what/why (short), screenshot (from Playwright), demo link
  (`https://simonhedrich.github.io/quietqr/`), `docker run` one-liner, compose snippet,
  privacy statement (what the CSP guarantees), development commands, credit to mini-qr as
  inspiration, icon license.
- CONTRIBUTING.md: setup, gate commands, how to add a template (it should be a short recipe;
  if it isn't, the architecture needs work), how to add a language.
- `docs/` brought to the current state. `plan.md` shows what's left (likely just "review and
  release") and the follow-ups.
- Independent review (section 2). Fix the findings that hold up, then run the gate once more.

DoD: gate passes; bundle size measured (target ≤ 60 KB gz for JS+CSS) and recorded.

## 5. Quality bar

- TypeScript strict; no `any` without a comment explaining why.
- Every exported function has a doc comment.
- No `innerHTML` with user data. The SVG string is built from numbers and validated colors,
  and the logo is only an `<image>` with a PNG data URL produced by our own canvas.
- Color inputs are validated to `#rrggbb` before they reach the renderer.
- No network requests in the app at all (Geolocation is a browser API, not our request).
- Small modules; a file that grows beyond ~200 lines is a hint to split.

## 6. Final report

When done, reply with:

1. what was built, milestone by milestone, and anything that isn't done or doesn't work;
2. every decision you made that the docs didn't settle, with the reason (and where it's
   recorded);
3. measured numbers: bundle size (gz), image size, idle memory, test counts;
4. desktop and mobile screenshots;
5. open questions for Simon and suggestions you didn't build;
6. the commands Simon needs to push the branch and tag the first release.
