# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates: dd/mm/yyyy.

## [Unreleased]

## [1.0.0] — 26/11/2026

### Added
- **Compose** a message for a named person, with the body hashed (FNV-1a) as it is written.
- A **chain of hand-offs**: each records who carried it and when, in order. The body is never touched.
- **Export and import** as a small JSON file — the channel this app actually has, since there is no
  Bluetooth, cable API or QR camera here.
- A **changed body is refused**: a file whose text no longer matches its hash is not shown as the same
  message.
- **The same carrier twice adds no second hop** — a person who carries it twice carried it once, and the
  comparison is case-insensitive.
- Every hand-off says **"it does not promise it arrived"**, and the received view calls itself a record of
  hand-offs rather than a delivery receipt.
- Refusals: a message with no words, nobody to carry it to, a hand-off with no carrier, an empty or
  malformed file, a tampered body.
- A failed save says **NOT SAVED** and leaves the message on screen unchanged.
- PWA shell, CI (49 engine assertions + 20 in jsdom + page smoke), and the app-builder pipeline pinned to
  the canonical SHA for the EXE/APK/Linux release.

### Not built
- Bluetooth, cable transfer, QR transfer, and any auto-selection between channels. There is one channel:
  a file you carry.
