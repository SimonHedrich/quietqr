# Roadmap

Where quietqr stands and where help is welcome. When something here is done, remove it and
describe the result in [features.md](features.md) or [decisions.md](decisions.md).

## Current state

All features in [features.md](features.md) are implemented: nine data templates, three
shapes, colors with curated presets, logo, error correction, scannability warnings, SVG/PNG
export, clipboard, shareable links, English and German, light and dark themes. Releases ship
as a multi-arch Docker image and a demo on GitHub Pages.

## Help wanted

- **Device testing.** The payload formats (see [decisions.md](decisions.md#payload-formats))
  follow documentation and the ZXing source, not systematic tests on phones. Reports of how
  the built-in camera apps on iOS and Android (Apple Camera, Google Camera/Lens, Samsung
  Camera) handle each template are very welcome, especially WiFi with WPA3 or a hidden
  network, SMS prefill, all-day events and contacts with non-ASCII names.
- **Translations.** Adding a language takes one file; see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Ideas (not planned yet)

- Offline support as a PWA.
- TypeScript 7, once `svelte-check` supports it.

Before suggesting a new option, check it against the non-goals in [brief.md](brief.md).
