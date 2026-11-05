# Project brief

Why quietqr exists, what it aims for, and what it deliberately leaves out. Read this before
proposing a feature or an option. Tech choices: [decisions.md](decisions.md). What the app
does: [features.md](features.md). What's next: [roadmap.md](roadmap.md).

## Why

QR codes often carry private data: WiFi passwords, contact details, links you'd rather not
hand to a third party. Hosted generators see all of it, often require an account, hide
features behind sign-ups, or turn codes into tracking redirects.

Open-source alternatives exist, but they tend to fall into two camps: too few options to
make a decent-looking code, or so many (separate shapes for dots and corners, several
coloring modes, gradients, randomizers) that most combinations look bad or don't scan.
They also often bury the data templates (WiFi, contact, …), the main reason to use such a
tool, behind the styling settings.

## Goal

A QR code generator that is private by construction, pleasant to use, and easy to host:

- a **static web app** that does everything in the browser,
- a **tiny Docker image** for self-hosting,
- a **public demo** built from the same code,
- a **clean, tested codebase** that invites contributions.

## Principles

- **Private by construction:** everything runs in the browser. No backend, no telemetry,
  no external requests (fonts, CDNs), enforced by a strict Content Security Policy.
- **Few, good options instead of many:** a curated set that always produces a good-looking,
  scannable code. Every option combination is decode-tested.
- **Content first:** data templates are the primary UI, not a submenu.
- **Nice to look at:** a calm, clear UI; the code preview is the centre.
- **Small and fast:** tiny bundle, few dependencies, a few-MB container image.

## Non-goals

- Accounts, server-side storage, dynamic/redirect QR codes, analytics.
- Exhaustive styling (separate dot and corner shapes, gradients, branded presets, randomizers).
- Batch generation and QR scanning: different products.

## Name

The *quiet zone* is the blank margin every QR code needs, and "quiet" fits the promise: no
tracking, no account, no network calls.
