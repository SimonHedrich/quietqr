# Features

What quietqr does and how it behaves. Why: [brief.md](brief.md). Tech: [decisions.md](decisions.md).

## Data templates

All templates are shown as icon chips in this order of importance. As many as fit are visible;
the rest sit behind a "…" chip that opens a small menu. When a template is picked from that
menu, the "…" chip takes its icon and name (the visible chips are not reshuffled). URL is
selected on first load.

| # | Template | Fields | Encoding |
|---|---|---|---|
| 1 | URL | one field; `https://` is added when no scheme is given | the URL |
| 2 | WiFi | network name (SSID); password with show/hide; security **WPA/WPA2/WPA3 · WEP · None** (WPA preselected, password hidden for None); "hidden network" checkbox | `WIFI:T:WPA;S:…;P:…;;` with `; , " \ :` escaped; `T:WPA` also for WPA3, `T:nopass` without `P` for None, `H:true` only when hidden |
| 3 | Text | textarea | the text |
| 4 | Contact | first name, last name, phone visible; under "More fields": organisation, job title, email, website, address (street, postal code, city, country), note. One of each, no photo | vCard 3.0 (no MeCard), CRLF, `N` and `FN` always present |
| 5 | Email | recipient, subject, body | `mailto:addr?subject=…&body=…`, percent-encoded (`%20`, `%0D%0A`) |
| 6 | Phone | number | `tel:` with spaces and separators removed |
| 7 | SMS | number, message | `SMSTO:<number>:<message>`, message unencoded (iOS prefills the message only for `SMSTO:`) |
| 8 | Geo | latitude, longitude; "Use my location" (browser Geolocation API); pasting a Google Maps or OpenStreetMap link fills the coordinates. No map (it would need external tiles) | `geo:lat,lng`, at most 5 decimals (~1 m) |
| 9 | Calendar | title, start, end, all-day toggle, location, description. No recurrence, no reminders | bare `VEVENT` (no `VCALENDAR` wrapper, no UID/DTSTAMP), CRLF; times entered in local time, stored as UTC (`…Z`); all-day as `VALUE=DATE` with exclusive end |

Behaviour:

- Validation messages appear inline and never block the code. An empty form shows none.
- Geo: pasting a Google Maps link (`@lat,lng`, `q=`, `ll=`, `query=`, `!3d…!4d…`), an
  OpenStreetMap link (`#map=z/lat/lng`, `mlat`/`mlon`) or plain coordinates into a coordinate
  field fills both. Short links (`maps.app.goo.gl`) can't be resolved offline; a hint says so.
- Each template keeps its field values in memory while switching templates (session only,
  never persisted). Each form has a "Clear" button.
- A capacity indicator near the preview shows how much of the code's capacity at the current
  error-correction level is used (e.g. "312 / ~1,200 characters"), for every template.
- Before anything is entered, the preview shows a faded placeholder code (encoding the repo
  URL) with "Enter something to generate your code". Export is disabled until there is real
  content.

## Styling

One style section, no "Advanced" section:

- **Shape:** Square · Rounded · Dots. The finder patterns follow the chosen shape (sharp,
  rounded, round). No separate dot / corner types.
- **Colors:** foreground and background, each with a swatch that opens the native color
  picker, a hex field, and a row of about 6 curated presets that are tested to scan well.
  A "transparent background" toggle. No gradients, no swap button (it invites inverted codes).
- **Logo:** upload by click or drag-and-drop; PNG, JPG, WebP, SVG. Every format is
  converted to PNG in the browser before embedding, so an SVG can't carry scripts and the
  exported SVG stays self-contained. Fixed size (about 20 % of the code width); the modules
  behind it are cleared with a small padding in the background color. The only control is
  "Remove".
- **Error correction:** a segmented control **Auto · 7 % · 15 % · 25 % · 30 %** (L/M/Q/H as
  small text). Auto is the default and picks 15 % without a logo, 30 % with one. A caption
  shows the choice ("Auto: 30 % (logo)"). A fixed level stays until Auto is clicked again.
- **Quiet zone:** fixed at 4 modules, not configurable.

## Export and sharing

Under the preview:

- Download SVG.
- Download PNG at 512, 1024 or 2048 px.
- Copy PNG to the clipboard.
- "Copy link": writes content and style into the URL hash and copies the link, with a note
  that the link contains the data.

Files are named `quietqr-<template>.svg/.png` (e.g. `quietqr-wifi.png`), never after the
content, so SSIDs or names don't leak into download folders or sync services.

No PDF and no print button.

## State and privacy

- localStorage keeps only the **style** (shape, colors, transparency, error-correction
  choice), never the content.
- The URL hash is not synced automatically; only "Copy link" writes it. Opening such a link
  restores content and style.
- The logo is never stored, neither in localStorage nor in the hash.

## Scannability warnings

A calm inline notice under the preview; it never blocks export. Checks:

- low contrast between foreground and background,
- inverted colors (light foreground on dark background),
- logo too large for the error-correction level (e.g. a fixed low level with a logo),
- very dense code (high version).

The only hard error is data that exceeds the code's capacity; it replaces the preview.

## Layout and look

- One screen, no routing.
- Desktop: template chips and form on the left; style section below the form; a large sticky
  preview with the export buttons on the right.
- Mobile: stacked, with a small sticky preview that stays visible while typing.
- Header: name on the left; language and theme toggles as small icon buttons on the right.
- Footer, one line: "Runs entirely in your browser · No tracking · GitHub" plus the version.
- Look: neutral greys, one accent color, the system font stack (no web fonts), generous
  whitespace, the preview as the dominant element on a subtle card. Dark mode follows the
  system, with a manual toggle.

## Languages

English and German for the first release. The language is detected from the browser and can
be switched in the header.

## Out of scope

- CSV batch generation and QR scanning/decoding: separate products, ruled out.
- PWA/offline: a possible follow-up, not part of the first release.
