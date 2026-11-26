BUILD PROMPT — Carrier   (plan row #26 of 37)

## Inputs

```
APP:        Carrier
SPEC:       QUEUE/app-carrier.md
REPO:       https://github.com/drsamonline/app-carrier   (empty)
            the plan also matches: carrier, app-carrier
PLAN_ROW:   #26
MERGED:     carrier, dropzone, beam, chirp-key, sonar-drop, tap, hush, prism, vault, handoff
```

This build absorbs 10 specs into one app. Their must-nots still bind, and all of them are quoted below.

Needs before it can ship: LAN transport (room-kit), hardware access, crypto-kit

**Note before starting:** Ten specs, one app. Vault has a real architecture difference (incremental backup + desktop companion) — split it out first if the merge feels wrong.

Rule 0 — check these existing repos before writing code, in case one already does the job: `corpus-extendum-vault-01`

---

## What you are building

One app, from its spec, into that repo. Nothing else. Not a second app, not a kit unless the
spec needs one, not a refactor of a neighbour.

### The house rules (they are not preferences)

- **Offline-first, always.** No server, no account, no telemetry, no network call at runtime.
  If the app needs a model, it ships in the app or the app says what it cannot do.
- **Single-file where possible.** One `docs/play/index.html` with its kits beside it. The
  build kit (`app-builder`) turns that into a Windows EXE and an Android APK — so the same
  bytes must work as a file:// page, an installed PWA and an APK.
- **The spec's "what it must NOT do" are test assertions, not prose.** Each one becomes a
  named test that fails if the app ever does it.
- **The spec's "what it does when things go wrong" is four cases**, and all four ship:
  bad input, no network, storage full or unavailable, corrupt saved state. An app that
  silently treats "no data" as "no matches" is not done.
- **Nothing is fabricated.** No invented data, no placeholder screenshot presented as a live
  capture, no badge nobody measures, no sample corpus passed off as the real thing. If an
  asset must be supplied by the owner, say so and leave the slot visibly empty.
- **India is the default audience**: ₹, lakh/crore, metric, dd/mm/yyyy, IST, and the local
  examples before the international ones.
- **Licence:** PolyForm Noncommercial 1.0.0 unless the spec says otherwise; SPDX headers on
  every source file; `data/SOURCE.md` recording the source, the licence of the **data**, and
  the fetch date for anything not written by us.

### Step 0 — Preflight (before you claim anything is missing)

1. Read the spec. Read its master-list row. Read its `PLAN.json` row, including `members` —
   a merged build's other specs are in `QUEUE/archive/` and their must-nots still apply.
2. **Rule 0: check the estate first.** Search the org for an app that already does this job.
   If one does, stop and report the collision with the repo name. Building the second version
   of a shipped app is the most expensive mistake available here.
3. Ask which credential you are holding. A `gh` 404 is a wrong credential, never proof of
   absence. Any finding of "impossible" must name the credential it was attempted with.
4. **You cannot create repositories.** If the repo does not exist, that is the owner's step —
   say so and stop. An empty repo that exists is yours to fill.

### Step 1 — Scope it in writing, before code

Produce a short block and keep it for the final report:

- the job, in one sentence;
- the mechanic that makes it not-generic, in one sentence;
- every **must-not**, as a test name;
- the four failure cases, as behaviour;
- the kits it needs (from the spec) and whether each already exists;
- what the app will **not** do in v1, explicitly.

If the app needs a capability no kit has: create the kit first, with its own test, and say so.

### Step 2 — Scaffold, do not hand-roll

`python3 scripts/new-app.py <app-id>` writes the shape:

```
docs/index.html          landing page (what it is, honest status, how to run it)
docs/play/index.html     the app itself
docs/play/*.js           the kits it vendors, next to the page that loads them
tests/self-tests.js      assertions, no framework
PAGES.json               the page manifest
README.md                what it does, how to run, what is not built
```

**Then prove the shape before you fill it:** every `<script src>` in the page must resolve to
a file that exists beside it. A scaffold has shipped here before with the kits in the wrong
folder, and the page 404'd its own runtime while the build stayed green.

If the repo is empty and `scripts/` is not available to you, build the same shape by hand —
the file list above is the contract, not the script.

### Step 3 — Build to the spec

Work the spec top to bottom. Where the spec is silent, choose the smaller behaviour and say
so in the report. Where the spec and the master-list one-liner disagree, **the spec body
wins** and the disagreement goes in the report (five such contradictions are already known).

### Step 4 — Tests that could fail

- `node tests/self-tests.js` — every must-not is an assertion; every failure case is a case.
- Print the count. A suite of 0 assertions is a failure, not a pass.
- **Mutation-test it**: break three things on purpose (remove a guard, make a refused input
  succeed, report a failed save as saved) and confirm the suite goes red each time. Restore.
- If the suite cannot go red, it is documentation, not a test.

### Step 5 — Deliver

- Pages on, demo live at `https://drsamonline.github.io/<repo>/`, and the demo **is** the app
  (no separate build of the page).
- A release with the EXE and APK from `app-builder`, built from the same source.
- Topics set (they are the discovery surface), licence headers, `CHANGELOG.md`, `NOTICE`.
- README states the real status: what works, what does not, what is untested.

### Step 6 — Record it

- Append one line to `PROGRESS.log`: what was built, the test counts, the demo URL, what was
  **not** built and why.
- **Do not edit `QUEUE/PLAN.json`.** `tools/queue-sync.py` flips the row to `built` when the
  repo and its Pages answer. Writing `built` by hand is how a plan starts lying.
- Do not edit `ACTIONS.md` — its build order is generated.

### Step 7 — Report in this shape

```
APP      <name>  (plan row #<order>, <n> specs merged)
REPO     <url>   commit <sha>
DEMO     <url>
TESTS    <n>/<n> assertions, mutation-tested <n> ways
BUILT    <the features that exist>
NOT BUILT <the features the spec asks for that do not, and why>
MUST-NOT <each one, and the test that holds it>
NEEDS    <what only the owner can supply: assets, keys, data, a decision>
NEXT     <the smallest honest next step for this app, or "done">
```

Never write "done" for a feature you did not prove. `unverified` with the reason is a better
line than a green claim.

---

## Definition of done (the owner's, not yours)

> A working app, with a working release, a landing page, and a live demo where the app is a
> web app — and the tests that prove the must-nots, run in CI.

Anything less is `partial`, and the report says which of the three is missing.

---

## When you are blocked

Say which of these it is, in one line, and stop:

- **no spec** → the spec is the next step, not the code;
- **the app already exists** → name the repo and the overlapping features;
- **the repo does not exist** → the owner creates it; you cannot;
- **a capability no kit has** → the kit is the next step;
- **an asset only the owner has** (a photo, a UPI ID, a licensed corpus, a key) → build the
  slot, leave it visibly empty, name what is needed;
- **a credential that cannot see the thing** → name the credential, not a verdict.

---

## The five ways this has gone wrong before

1. **Built the second version of a shipped app** — Rule 0 exists because of it.
2. **Shipped a scaffold whose page could not load its own kits** — prove every `src` resolves.
3. **Claimed a badge or a status nobody measures** — a green shield that lies is worse than none.
4. **Logged "done" from an exit code** — the verdict is the artifact on the branch, not git's
   exit status.
5. **Reported the system blocked on the strength of the wrong credential** — a 404 is a
   credential, not a fact.

---

# THE SPEC — Carrier (`app-carrier`)

# Carrier

- **id:** app-carrier
- **category:** Other ideas worth keeping
- **tier:** Epic
- **source:** the app master list, #100
- **status:** READY - spec written

## Pitch

one transfer app, auto-selects the best channel

## The job

- Carry a message to someone who has no network.

## The mechanic

- It is SNEAKERNET: the message is a file you carry, and the app tracks whether it arrived, like a physical letter.

## What it must NOT do

- promise delivery. It hands you the message and records when it was passed on.

## What it does when things go wrong

- **Bad input** — a message with no reachable channel is refused with the channels tried and why each
  failed, rather than being queued under a channel that is not there.
- **No network** — nothing changes at the local level: the app lists which channels are available right
  now (LAN, camera, sound) and says which of them need a network it does not have.
- **Storage full or unavailable** — the message is not stored and the app says the hand-off was not
  recorded; it does not show a delivery that was never made.
- **Corrupt saved state** — an unreadable hand-off log is reported and offered for export; the message
  queue is never rebuilt from it, so a corrupt log cannot cause a re-send.

## Kits it will need

- `web-kit` for the shell, storage and the PWA
- web-kit, crypto-kit, export-kit

## The data

- the messages and their hand-offs, on the device.

## Done means

- A message exported on device A and imported on B shows the same text and records **1** hand-off with its date; carried onward to C it shows **2**, in order, naming each carrier. The message body is unchanged at every hop — the chain records who carried it and never edits it. Re-importing on a device that already has it does not add a second hop for the same person.

---

# SPECS THIS BUILD ABSORBS (9)

## `app-dropzone` — Dropzone

**Pitch**

send files and photos across any device, on the LAN

**What it must NOT do**

- grow a second job. If a request needs "and", it is two apps.

**What it does when things go wrong**

- **Bad input** — a device that advertises itself but never accepts a connection is dropped after a
  stated timeout and named, so a transfer is never left looking in progress.
- **No network** — the LAN is the network: with no peers the app says nobody is in range. It needs no
  internet, and says so.
- **Storage full or unavailable** — the receive stops at the byte it could not write, with bytes written
  of total, and the partial file is marked incomplete rather than delivered.
- **Corrupt saved state** — each received file is checksummed before it is offered; a mismatch is
  reported and the file is not presented as usable.

**The spec (the prompt it was written from)**

**Prompt:**
Build a LAN app called **Dropzone** for **cross-platform, account-free file and
photo transfer** between any two devices on the same network — phone ↔ phone,
phone ↔ laptop, Android ↔ iOS — with no internet.

Implement:
- **Send:** pick files, then share a QR/code; the receiver scans to open a local
  web page or the app and pulls the files directly.
- **Receive:** show what's arriving with progress; save to the device.
- **No account, no cloud:** transfer is device-to-device over the LAN; nothing is
  uploaded anywhere.
- **Cross-platform:** the receiver works in a plain browser too, so a device
  without the app can still receive.
- **Event mode:** a "hot drop" room where a photographer at a wedding, or a
  teacher, can offer a folder that many people pull at once.

LAN architecture: sender runs an embedded HTTP server; receiver connects by QR'd
IP. On a hotspot with no data, still works.

Novelty: **AirDrop for everyone, without the platform lock-in or the internet** —
ideal for India's mixed-device reality and venues with no usable Wi-Fi.

---

## `app-beam` — Beam

**Pitch**

file transfer by screen and camera

**The job**

- Send a file to the person next to you over the local network.

**The mechanic**

- It uses the LOCAL network only and shows the transfer honestly, so a large file does not need a cloud in between.

**What it must NOT do**

- upload anything. The file goes device to device.

**What it does when things go wrong**

- **Bad input** — a frame that does not decode is retried and then reported as a failed frame with the
  count, so a partial transfer is never presented as complete. A file with no readable header is refused
  before the first frame is shown.
- **No network** — nothing changes. The transfer is screen to camera and needs no network at all.
- **Storage full or unavailable** — the receive stops at the byte it could not write and says so, with
  the bytes written and the total. It does not report a short file as received.
- **Corrupt saved state** — the received file is checksummed against the header before it is offered; a
  mismatch is reported and the file is not presented as usable.

**Kits it will need**

- `web-kit` for the shell, storage and the PWA
- web-kit, lan-kit

## `app-chirp-key` — Chirp Key

**Pitch**

pair devices by sound

**The job**

- Exchange a key by sound, between two devices in the same room.

**The mechanic**

- It uses AUDIO as the transport, so two air-gapped devices can share a key with nothing but a speaker and a microphone.

**What it must NOT do**

- replace proper key exchange for high-value secrets. It is for the room, and it says so.

**What it does when things go wrong**

- **Bad input** — a sound that is not a chirp key is ignored with a "listening" indicator that stays
  honest, rather than being accepted as a key. A truncated key is rejected and named as truncated.
- **No network** — nothing changes. Pairing is sound between two devices in the same room.
- **Storage full or unavailable** — the key is not kept and the app says so; pairing still completes for
  the session, and the user is told it will not survive a reload.
- **Corrupt saved state** — an unreadable stored key is discarded with a notice, because a key that
  cannot be read is not a key; the user is asked to pair again.

**Kits it will need**

- `web-kit` for the shell, storage and the PWA
- web-kit, audio-kit, crypto-kit

## `app-sonar-drop` — Sonar Drop

**Pitch**

transfer by sound alone

**The job**

- Drop a file to anyone in the room, without pairing.

**The mechanic**

- It BROADCASTS availability and lets the receiver pull, so nothing is paired and nothing is configured.

**What it must NOT do**

- send to anyone outside the room. The room is the boundary.

**What it does when things go wrong**

- **Bad input** — a payload that fails its checksum is reported as corrupt with the bytes received of
  total, and is never offered as a usable file. A drop too large for the channel is refused before it
  starts, with the limit.
- **No network** — nothing changes. The channel is sound between two devices in the room.
- **Storage full or unavailable** — the receive stops at the byte it could not write and says so; the
  partial file is marked incomplete.
- **Corrupt saved state** — nothing persists by default, so there is no saved state; a kept item that
  fails to decode is discarded with a notice.

**Kits it will need**

- `web-kit` for the shell, storage and the PWA
- web-kit, lan-kit

## `app-tap` — Tap

**Pitch**

transfer by touch

**The job**

- Pass a short piece of text to the phone next to you by touching the two together.

**The mechanic**

- The transfer is a TAP, not a session: one device writes a small payload, the other reads it, and there is nothing to pair, name or accept. It stays short — a link, a number, a name — because a touch is a gesture for one thing, not a file manager.

**What it must NOT do**

- transfer files, or claim to work on hardware that cannot write a tag. Where the device cannot write, it says so and offers the QR fallback rather than failing silently.

**What it does when things go wrong**

- **Bad input** — a payload that fails its checksum is reported as corrupt and not offered as a file.
  A touch that carries no payload is reported as "nothing received" rather than as an empty file.
- **No network** — nothing changes. The transfer is two devices touching.
- **Storage full or unavailable** — the receive stops at the byte it could not write and says so; the
  partial payload is marked incomplete.
- **Corrupt saved state** — the payload lives in memory, so there is no saved state; only items the
  user keeps are written, and one that fails to write fails with a notice.

**Kits it will need**

- `web-kit` for the shell and the PWA
- `optical-kit` for the QR fallback
- `export-kit` for keeping a received item

## `app-hush` — Hush

**Pitch**

the inaudible token channel

**The job**

- Send a short token between two devices in the same room over sound the room cannot hear.

**The mechanic**

- It encodes the token into a near-ultrasonic tone and listens for it, so the transfer needs no pairing, no network and no visible link. It is deliberately SHORT — a token, not a file — because the bandwidth of an inaudible carrier in a noisy room is tiny, and a channel that pretends otherwise fails in exactly the crowded place it is meant for.

**What it must NOT do**

- pretend to be private. Anyone with a microphone can hear it: it is quiet to the room, not secret. The app must say that plainly and must never be presented as encryption.

**What it does when things go wrong**

- **Bad input** — a sound that is not a token is ignored with the listening indicator staying honest; a
  token that decodes to the wrong checksum is rejected and named as corrupt.
- **No network** — nothing changes. The channel is sound between two devices in the room.
- **Storage full or unavailable** — the token lives in memory, so nothing is at risk; a token the user
  asks to keep fails to save and the app says so.
- **Corrupt saved state** — a kept token that will not decode is discarded with a notice, because a
  token that cannot be read is not a token; the user is asked to pair again.

**Kits it will need**

- `web-kit` for the shell and the PWA
- `audio-kit` for the tone and the listen
- `crypto-kit` if the token is to be sealed as well as sent

## `app-prism` — Prism

**Pitch**

One app, two kinds of light: move files between devices without a server.

**The job**

- Get a file from one device to another with **no server and no account**: either over the local
  network, or by showing the data as light on one screen and reading it with the other's camera.

**The mechanic**

- **Two transports, one job.** The LAN path is fast and needs both devices on the same Wi-Fi; the
  optical path is slow and needs only a line of sight. Offering both is the point — one covers the
  case the other cannot.
- **Nothing is uploaded.** The file goes device to device or screen to camera, so "no server" is
  architectural rather than a promise.

**What it must NOT do**

- become a file manager or a sync client. It moves one thing from here to there.
- claim the optical path is fast. It is the fallback, and saying so is honest.

**What it does when things go wrong**

- **Bad input** — a frame that does not decode is retried and then reported as a failed frame with the
  count, so a partial transfer is never presented as complete.
- **No network** — nothing changes. Both channels are local: the transfer needs no server and no
  internet, which is the app's whole claim.
- **Storage full or unavailable** — the receive stops at the byte it could not write and says so, with
  bytes written of total; the partial file is marked incomplete.
- **Corrupt saved state** — nothing persists by default, so there is no saved state; a received file is
  checksummed before it is offered, and a mismatch is reported.

**Kits it will need**

- `lan-kit` for the local-network path
- `web-kit` for the shell and storage
- `export-kit` for saving what arrives

## `app-vault` — Vault

**Pitch**

back up your phone to a laptop on the same Wi-Fi

**What it must NOT do**

- grow a second job. If a request needs "and", it is two apps.

**What it does when things go wrong**

- **Bad input** — a backup with no destination device, or a selection that resolves to nothing, is
  refused with the reason. A file that cannot be read is listed as skipped rather than counted.
- **No network** — the Wi-Fi is the network: with no laptop reachable the app says so and does not
  start a backup it cannot finish. No internet is involved and none is attempted.
- **Storage full or unavailable** — the backup stops at the file it could not write and the app says
  which files are missing from it. A partial backup is never presented as a complete one.
- **Corrupt saved state** — each file is checksummed before the backup is called complete; a mismatch
  is reported and the backup is marked incomplete rather than trusted.

**The spec (the prompt it was written from)**

**Prompt:**
Build a LAN app called **Vault** that backs up a phone's **photos, videos and files
to a computer on the same local network** — no cloud, no subscription, no
internet.

Implement:
- **Companion on the computer** (desktop app or a local web UI) that advertises
  itself over mDNS; the phone finds it automatically.
- **Incremental backup:** the phone sends only new/changed items over the LAN;
  the computer stores them in a dated, browsable folder structure.
- **Restore & browse:** pull individual items back to the phone, or browse the
  archive from the computer.
- **Scheduled & resumable:** runs when on the home Wi-Fi; resumes if interrupted.
- **Encryption:** optional end-to-end encryption of the archive with a passphrase.

LAN architecture: desktop hosts a local server; phone connects over Wi-Fi; large
transfers stream directly. Works with no internet — only the LAN matters.

Novelty: **personal backup with zero cloud and zero cost** — the user's own
computer is the backup target, and their data never leaves the house.

---

## `app-handoff` — Handoff

**Pitch**

A scratchpad that moves instantly between your own devices over the LAN.

**The job**

- A scratchpad that moves instantly between your own devices over the LAN.

**The mechanic**

- It uses the LOCAL network only, so nothing goes through anyone's server - the devices find each other and exchange the note.

**What it must NOT do**

- sync to the cloud or keep a history on a server. It moves the current note, on your own network.

**What it does when things go wrong**

- **Bad input** — a note with no device in range is kept on the sending device and the app says it was
  not delivered, with the peers it tried. It never shows a note as handed off when it was not.
- **No network** — the LAN is the network: with no peers the note still edits locally and the app says
  the transfer is pending. No internet is needed and none is attempted.
- **Storage full or unavailable** — the incoming note is refused at the byte it could not write and the
  sender is told, so a truncated note is never presented as complete.
- **Corrupt saved state** — a note that fails its checksum is refused with the mismatch reported; the
  receiving device keeps its previous note rather than replacing a good one with a broken one.

**Kits it will need**

- `web-kit` for the shell, storage and the PWA
- web-kit, lan-kit

---

## After the build

- Append one line to `PROGRESS.log`. Do **not** edit `QUEUE/PLAN.json` — `tools/queue-sync.py` moves row #26 to `built` when the repo and its Pages answer.
- Report in the shape the brief asks for. Anything you did not prove is `unverified`, not done.
