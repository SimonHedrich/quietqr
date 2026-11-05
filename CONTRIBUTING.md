# Contributing to quietqr

Thanks for helping! Translations, new templates, bug reports and fixes are all welcome.
Before adding an option, read [docs/brief.md](docs/brief.md): quietqr deliberately has few
options, and a suggestion for a curated default is often better than a new setting.

## Setup

```sh
nvm use            # Node 26, from .nvmrc
npm install
npx playwright install chromium   # once, for the e2e test
npm run dev
```

## Before you open a pull request

All of these must pass (CI runs them too):

```sh
npm run check      # svelte-check + TypeScript (strict)
npm run lint       # ESLint + Prettier (npm run format fixes formatting)
npm test           # unit tests + scan tests
npm run build
npm run test:e2e   # Playwright smoke test
```

Use conventional, imperative commit messages (`feat: add WiFi template`,
`fix: escape commas in vCard notes`).

## How the code is organised

```
src/lib/qr/          encode (text → matrix), render (matrix → SVG string), logo area,
                     capacity, analyze (scannability warnings)
src/lib/templates/   one module per data template + tests; registry.ts lists them
src/lib/state/       app state (Svelte runes), style persistence, link hash codec
src/lib/export/      SVG/PNG download, clipboard, logo conversion (browser glue)
src/lib/i18n/        dictionaries (en.ts is the source of truth)
src/components/      Svelte UI only
tests/scan/          renders codes and decodes them again with ZXing
e2e/                 Playwright smoke test
```

Rules of thumb: everything under `src/lib/` (except the runes state and the export glue) is
plain TypeScript without DOM access, so it is unit-tested in Node. Components do UI only:
no payload building, no encoding. The preview, SVG and PNG all use the same SVG string
from `render.ts`, which accepts only validated colors and a PNG data URL, so user input
can't reach the markup. Every exported function gets a doc comment.

## Adding a template

1. Add the id to `TemplateId` in `src/lib/templates/types.ts`.
2. Create `src/lib/templates/<id>.ts` exporting a `TemplateDef` (`empty`, `isEmpty`,
   `validate`, `encode`, an icon from `src/lib/icons.ts`) and `<id>.test.ts` covering
   normal values, empty optional fields, special characters, unicode and a scan round trip
   (`roundTrip` from `tests/scan/helpers.ts`). Copy `url.ts` as a starting point.
3. Register it in `src/lib/templates/registry.ts` (`TemplateValues`, `templates`,
   `TEMPLATE_ORDER`). The registry test checks the contract for every template.
4. Add a form: `src/components/templates/<Id>Form.svelte` (see `UrlForm.svelte`) and list
   it in `FORMS` in `src/components/TemplatePanel.svelte`.
5. Add `template.<id>` and the field labels to `src/lib/i18n/en.ts` and every other
   language.
6. Describe it in [docs/features.md](docs/features.md).

## Adding a language

1. Copy `src/lib/i18n/de.ts` to `src/lib/i18n/<code>.ts` and translate the strings. Keep
   `{placeholders}` as they are; a test checks them.
2. Add it to `LOCALES` and `LOCALE_NAMES` in `src/lib/i18n/index.ts`.

TypeScript (`satisfies Messages`) reports missing or extra keys. The browser language is
detected automatically and the header has a language switch.

## Docs

`docs/` describes the current state: [brief](docs/brief.md) (why),
[decisions](docs/decisions.md) (tech choices and reasons), [features](docs/features.md)
(what the app does) and [plan](docs/plan.md) (what's next). If your change affects one of
them, update it in the same pull request.
