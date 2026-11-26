# Carrier

Carry a message to someone who has no network. **It does not promise delivery** — it hands you the message
and records when it was passed on.

- **Demo:** https://drsamonline.github.io/app-carrier/play/index.html
- **Landing page:** https://drsamonline.github.io/app-carrier/
- **Release:** https://github.com/drsamonline/app-carrier/releases/tag/app-latest
- **Plan row:** #26 of 37 in `drsamonline/forge` → `QUEUE/PLAN.json`
- **Specs absorbed:** `app-carrier` (lead) + 9 absorbed specs
- **Licence:** PolyForm Noncommercial 1.0.0

## Status

| | |
|---|---|
| **Built** | Compose; a chain of hand-offs with carrier and time; body hashed at composition; export/import as a file; a changed body refused; the same carrier counted once; "does not promise it arrived" at every hop. |
| **Release** | Windows EXE, Android APK and Linux binary, built from this source by `app-builder` in CI. |
| **Not built** | **Bluetooth, cable transfer, QR transfer, and auto-selection between channels.** The file *is* the channel, and the page says so. |
| **Untested** | Whether a message survives a real village hand-off chain. The chain is exact and tested; whether people actually pass a file along is not something a test can see. |

## The spec's "done means", counted

| The spec says | The test |
|---|---|
| exported on A, imported on B: same text, **1** hand-off with its date | `body` equal, `chain.length === 1`, carrier named, date `dd/mm/yyyy hh:mm` |
| carried to C it shows **2**, in order, naming each carrier | `chain.length === 2`, "Ravi then Meena", and the view reads `Ravi → Meena` |
| the body is unchanged at every hop | equal at B and at C, hash still matches, and two hops in a row leave `body` identical |
| re-importing does not add a second hop for the same person | same carrier again → `chain.length` still 2, `duplicate: true`, and a case variant is the same person |

## The honest part: one channel, not "the best channel"

The spec's pitch is *auto-selects the best channel*. There is no radio here — no Bluetooth, no cable API, no
camera — so the app does not pretend to choose between them. **The file is the channel**: you export it,
carry it, import it. The chain then does the work the app can actually do, which is to record who took it.

## What it will not do

- **Promise delivery.** A hand-off records that someone took it, not that it arrived.
- **Edit the body.** The hash proves it.
- **Count the same carrier twice.**
- **Find a radio.**
- **Use the internet.**

## When things go wrong

| Case | Behaviour |
|---|---|
| **Bad input** | No words, nobody to carry it to, no carrier name — each refused with the field named. |
| **A changed file** | Refused: the body no longer matches the hash recorded at composition. |
| **No network** | Nothing changes — the file is the channel. |
| **Storage full or unavailable** | **NOT SAVED**, message unchanged on screen. |

## Tests

```bash
npm test                      # all three suites
node tests/self-tests.js      # engine — 49 assertions
node tests/ui-tests.js        # the page in jsdom — 20 assertions
node tests/page-smoke.js      # every local src/href resolves, nothing off-origin
```

Mutation-tested six ways on 26/11/2026, all red: the same carrier adding a second hop (4 failures), a hop
editing the body (crash), a tampered body accepted (3), the chain becoming a set rather than an order (2),
the app claiming delivery (2), and a message with no body accepted (1).

One test was wrong before the code was: my "no delivery field" check matched the sentence *"It is not
delivered:"* — the promise being refused, flagged as the promise. It now looks for an object **key**.

## Layout

```
docs/index.html            landing page
docs/play/index.html       the app — compose, the chain, carry out, import
docs/play/app.js           DOM wiring: compose, hand-off, export/import, save guard
docs/play/carrier-core.js  the engine — hash, compose, hand-off, received view, file rules
docs/play/web-kit.js       vendored kit (unmodified)
docs/play/export-kit.js    vendored kit (unmodified)
tests/self-tests.js        engine suite (49)
tests/ui-tests.js          page suite (20, jsdom)
tests/page-smoke.js        shape on disk
PAGES.json                 landing = docs/index.html, app = docs/play/index.html
```

## Where the spec was silent, and what was chosen

- **FNV-1a, not a signature.** It catches an edited body; it does not stop a determined forger. Calling it a checksum in the code and a hash in the UI is the honest naming.
- **Case-insensitive carrier matching**, because "Meena" and "meena" are one person in a village chain.
- **A duplicate hand-off is a success, not an error** — the person did carry it; it just does not add a hop.
- **The filename is the recipient's name**, so a pile of carried files on someone's desktop is legible.
- **The received view says what it is not**, every time, rather than once in a help page.

## What is not built, and why

**Bluetooth, cable transfer, QR transfer, auto-selection.** None of those APIs exist in this environment,
and a transfer app that invented a radio would be lying about the one thing it is for. What ships is the
part that is genuinely useful without a radio: a message you can carry, and a chain that says who took it.
