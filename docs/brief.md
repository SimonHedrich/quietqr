# Project brief

Why quietqr exists, what it should be, and what it must not become. Tech decisions:
[decisions.md](decisions.md). Next steps: [plan.md](plan.md).

## Motivation

Simon wants a QR code generator on his own server: for privacy (the encoded data – WiFi
passwords, contacts, URLs – should never touch a third party) and to avoid creating accounts
on hosted generators, which often also hide features behind sign-ups or turn codes into
tracking redirects.

He looked for an existing open-source project and found none that fit. They either have too few
options, look ugly, or are overloaded.

### Why not mini-qr

[lyqht/mini-qr](https://github.com/lyqht/mini-qr) was the closest match, but:

- **It looks bad:** UI colors, settings layout, and overall structure. On first use it was not
  clear where anything is.
- **It is overloaded with options nobody needs:** separate dot / corner-square / corner-dot types,
  four different coloring settings, branded presets, and a "randomize colors and shapes"
  button. Nine out of ten randomized codes look ugly.
- **Priorities are wrong:** the data templates (WiFi, vCard, …), the main reason to use such a
  tool, are hidden in a submenu, while save/load of the QR configuration are huge buttons.

mini-qr is built on `qr-code-styling`; that library's options model is where most of the
styling bloat comes from.

## Goal

A QR code generator that others want to use and contribute to, published on GitHub
(`SimonHedrich/quietqr`, MIT):

- **Self-hostable Docker image** with a good balance of functionality, aesthetics, speed, and
  low resource use (image size, CPU, memory).
- **Demo on GitHub Pages**, from the same build as the image.
- **A clean repo:** clean code, good documentation, tests, CI. It should invite contributions.

### Principles

- **Private by construction:** everything runs in the browser. No backend, no telemetry, no
  external requests (fonts, CDNs) – checkable via CSP.
- **Few, good options instead of many:** a curated set that always produces a good-looking,
  scannable code. No randomizer, no branded presets.
- **Content first:** data templates are the primary UI, not a submenu.
- **Nice to look at:** a calm, clear UI; the code preview is the centre.
- **Small and fast:** tiny bundle, few dependencies, few-MB container image.

### Non-goals

- Accounts, server-side storage, dynamic/redirect QR codes, analytics.
- Exhaustive styling options (separate dot/corner shape types, gradients per element, presets).

## Name

`quietqr`: the *quiet zone* is the blank margin every QR code needs, and "quiet" fits the
promise of no tracking, no account and no network calls. When the name was chosen there was
one exact-name repo on GitHub (0 stars) and it was free on npm.
