/* carrier-core — the engine behind Carrier.
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * (c) 2026 Dr Sohil Momin
 *
 * ONE JOB: carry a message to someone who has no network. A message is exported as a small file, handed
 * over (a cable, a Bluetooth drop, a QR on a screen), imported on the other device, and the CHAIN records
 * who carried it and when.
 *
 * It does not promise delivery. It hands you the message and records when it was passed on — those are
 * different claims, and the second is the only one this app can keep.
 *
 * The chain never edits the body: every hop records the carrier and the time, and the text is hashed at
 * creation so a hop that changed it can be caught rather than trusted.
 *
 * THE TRANSPORT IS NOT BUILT: there is no Bluetooth, no cable API and no QR camera here. The export is a
 * file you carry yourself, and that is the honest channel this app actually has.
 *
 * Pure functions: no DOM, no network, no storage.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.CarrierCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var VERSION = "1.0.0";
  function clean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ddmm(ms) { var d = new Date(ms); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function hhmm(ms) { var d = new Date(ms); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  /* FNV-1a over the body: enough to notice an edit, and honest about being a checksum rather than a
   * signature. */
  function hash(text) {
    var h = 0x811c9dc5, s = String(text);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return ("00000000" + h.toString(16)).slice(-8);
  }

  function compose(input, now) {
    var to = clean(input && input.to);
    var from = clean(input && input.from);
    var body = String((input && input.body) || "");
    if (!clean(body)) return { ok: false, field: "body", reason: "a message with no words is refused: there would be nothing to carry" };
    if (!to) return { ok: false, field: "to", reason: "a message needs someone to carry it to" };
    var at = now || Date.now();
    return {
      ok: true,
      message: {
        id: "m" + at,
        to: to, from: from || "someone",
        body: body,
        bodyHash: hash(body),
        madeAt: at, madeOn: ddmm(at) + " " + hhmm(at),
        chain: []
      },
      says: "Composed for " + to + ". It is not delivered: it is yours to carry."
    };
  }

  /* A hand-off: the person who passed it on, and when. The body is never touched. */
  function handOff(message, input, now) {
    var carrier = clean(input && input.carrier);
    if (!carrier) return { ok: false, field: "carrier", reason: "a hand-off needs a name: the chain records who carried it" };
    var at = now || Date.now();
    var m = clone(message);
    if (hash(m.body) !== m.bodyHash) {
      return { ok: false, field: "body", reason: "the message body has changed since it was composed. It is refused rather than carried on under a chain that no longer describes it." };
    }
    if (m.chain.some(function (h) { return h.carrier.toLowerCase() === carrier.toLowerCase(); })) {
      return {
        ok: true, message: m, duplicate: true,
        says: carrier + " is already in the chain, so no second hop was added. A person who carries it twice carried it once."
      };
    }
    m.chain.push({ carrier: carrier, at: at, on: ddmm(at) + " " + hhmm(at) });
    return {
      ok: true, message: m, hop: m.chain[m.chain.length - 1],
      says: "Carried by " + carrier + " on " + ddmm(at) + " " + hhmm(at) + ". That records the hand-off; it does not promise it arrived."
    };
  }

  /* What a receiver sees: the body, unchanged, and the chain in order. */
  function received(message) {
    var m = clone(message);
    var intact = hash(m.body) === m.bodyHash;
    return {
      ok: true, to: m.to, from: m.from, body: m.body, hops: m.chain.length, chain: m.chain, intact: intact,
      says: (m.chain.length ? "Carried " + m.chain.length + " time(s): " + m.chain.map(function (h) { return h.carrier; }).join(" \u2192 ") + ". " : "Not carried yet. ") +
        (intact ? "The body is unchanged." : "The body does NOT match what was composed.") +
        " This is a record of hand-offs, not a delivery receipt."
    };
  }

  function serialize(message) {
    var m = clone(message);
    return JSON.stringify({ version: VERSION, format: "carrier-message-1", message: m }, null, 2);
  }

  /* Import on another device. Re-importing on a device that already has it does not add a second hop for
   * the same person — the chain is a record, not a counter. */
  function parseMessage(text) {
    var raw = String(text == null ? "" : text);
    if (!raw.trim()) return { ok: false, empty: true, reason: "there is no message in this file", raw: raw };
    var data;
    try { data = JSON.parse(raw); }
    catch (e) { return { ok: false, unreadable: true, reason: "This file cannot be read. It was not replaced with an empty message; keep the file.", raw: raw }; }
    if (!data || !data.message || typeof data.message.body !== "string" || !Array.isArray(data.message.chain)) {
      return { ok: false, unreadable: true, reason: "This file holds no message. Nothing was started over it; keep the file.", raw: raw };
    }
    var m = clone(data.message);
    if (hash(m.body) !== m.bodyHash) {
      return { ok: false, tampered: true, reason: "The body in this file does not match the hash recorded when it was composed. It is refused rather than shown as the same message.", raw: raw };
    }
    return { ok: true, message: m, raw: raw };
  }

  function clone(m) {
    var x = m || { chain: [] };
    return {
      id: x.id || "", to: x.to || "", from: x.from || "", body: String(x.body || ""), bodyHash: x.bodyHash || "",
      madeAt: x.madeAt || 0, madeOn: x.madeOn || "",
      chain: (x.chain || []).map(function (h) { return { carrier: h.carrier, at: h.at || 0, on: h.on || "" }; })
    };
  }

  function exportFile(what, payload, meta, writer) {
    meta = meta || {};
    if (typeof writer !== "function") return { ok: false, reason: "the file was not written: no writer is available in this browser" };
    var name, body, mime = "application/json";
    if (what === "message") { name = "carrier-" + (payload.message && payload.message.to ? clean(payload.message.to).toLowerCase().replace(/[^a-z0-9]+/g, "-") : "message") + ".json"; body = serialize(payload.message); }
    else if (what === "raw") { name = "carrier-unreadable.txt"; body = String(payload.raw || ""); mime = "text/plain;charset=utf-8"; }
    else return { ok: false, reason: "nothing was written: unknown export \u201c" + what + "\u201d" };
    try {
      var wrote = writer(name, body, mime);
      if (wrote === false) return { ok: false, filename: name, reason: "the file was not written: the browser refused the save" };
      return { ok: true, filename: name, bytes: body.length };
    } catch (e) {
      var why = e && e.name === "QuotaExceededError" ? "storage is full" : (e && e.message ? e.message : "storage is unavailable");
      return { ok: false, filename: name, reason: "the file was not written: " + why };
    }
  }

  return { version: VERSION, hash: hash, compose: compose, handOff: handOff, received: received,
    serialize: serialize, parseMessage: parseMessage, exportFile: exportFile };
});
