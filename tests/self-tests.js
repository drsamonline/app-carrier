#!/usr/bin/env node
/* self-tests — Carrier. SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin
 * Done-means: a message exported on A and imported on B shows the same text and records 1 hand-off with its
 * date; carried to C it shows 2, in order, naming each carrier; the body is unchanged at every hop; and
 * re-importing on a device that already has it does not add a second hop for the same person. */
"use strict";
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..");
var C = require(path.join(ROOT, "docs", "play", "carrier-core.js"));
var passed = 0, failed = [], group = "";
function section(n) { group = n; }
function ok(n, c, d) { if (c) { passed++; return; } failed.push(group + " :: " + n + (d ? " — " + d : "")); }
function eq(n, a, b) { ok(n, a === b, "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
function read(f) { return fs.readFileSync(path.join(ROOT, f), "utf8"); }
function strip(s) { return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""); }

var T0 = Date.UTC(2026, 10, 26, 9, 0);
var BODY = "The tank is fixed. Call me when you reach the village.";

section("done means — exported on A, imported on B: same text, one hand-off with its date");
var made = C.compose({ to: "Aaji", from: "Sohil", body: BODY }, T0);
eq("the message is composed", made.ok, true);
var carried = C.handOff(made.message, { carrier: "Ravi" }, T0 + 3600000);
eq("one hand-off is recorded", carried.message.chain.length, 1);
var onB = C.parseMessage(C.serialize(carried.message));
eq("B can read it", onB.ok, true);
eq("with the same text", onB.message.body, BODY);
eq("and one hop", onB.message.chain.length, 1);
eq("naming the carrier", onB.message.chain[0].carrier, "Ravi");
ok("with the date of the hand-off", /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(onB.message.chain[0].on), onB.message.chain[0].on);

section("done means — carried to C it shows two, in order");
var second = C.handOff(carried.message, { carrier: "Meena" }, T0 + 7200000);
eq("two hops", second.message.chain.length, 2);
var onC = C.parseMessage(C.serialize(second.message));
eq("C reads two hops", onC.message.chain.length, 2);
eq("in order", onC.message.chain.map(function (h) { return h.carrier; }).join(" then "), "Ravi then Meena");
ok("and the view names each carrier in order", /Ravi \u2192 Meena/.test(C.received(onC.message).says), C.received(onC.message).says);

section("done means — the body is unchanged at every hop");
eq("the body at B", onB.message.body, BODY);
eq("the body at C", onC.message.body, BODY);
eq("and the hash still matches", C.hash(onC.message.body), onC.message.bodyHash);
eq("the view says so", C.received(onC.message).intact, true);
ok("a hop never edits the body", (function () {
  var m = made.message;
  var before = m.body;
  m = C.handOff(m, { carrier: "X" }, T0).message;
  m = C.handOff(m, { carrier: "Y" }, T0).message;
  return m.body === before;
})());

section("done means — re-importing does not add a second hop for the same person");
var again = C.handOff(second.message, { carrier: "Meena" }, T0 + 9000000);
eq("the hand-off is accepted", again.ok, true);
eq("but no hop is added", again.message.chain.length, 2);
eq("and it is marked a duplicate", again.duplicate, true);
ok("and says why", /carried it once/.test(again.says), again.says);
var caseVariant = C.handOff(second.message, { carrier: "meena" }, T0 + 9000000);
eq("the same person in another case is still the same person", caseVariant.message.chain.length, 2);

section("must-not — it must not promise delivery");
ok("compose says it is not delivered", /not delivered/.test(made.says), made.says);
ok("a hand-off records the pass, not the arrival", /does not promise it arrived/.test(carried.says), carried.says);
ok("the view calls itself a record of hand-offs", /record of hand-offs, not a delivery receipt/.test(C.received(onC.message).says), C.received(onC.message).says);
/* an object KEY, not the word in a sentence: "It is not delivered:" is the promise being refused */
ok("there is no delivered or receipt field in the engine",
  !/(^|[,{]\s*)(delivered|deliveryConfirmed|receipt|deliveredAt)\s*:/im.test(strip(read("docs/play/carrier-core.js"))));

section("the body is hashed, so a changed file is refused rather than trusted");
var tampered = C.parseMessage(JSON.stringify({ message: Object.assign({}, second.message, { body: "Send money instead." }) }));
eq("a tampered body is refused", tampered.ok, false);
eq("it is marked as tampered", tampered.tampered, true);
ok("and says why", /does not match the hash/.test(tampered.reason), tampered.reason);
var editedInMemory = C.handOff(Object.assign({}, second.message, { body: "different" }), { carrier: "Z" }, T0);
eq("a hand-off of an edited body is refused", editedInMemory.ok, false);
eq("with the body named", editedInMemory.field, "body");

section("bad input");
eq("a message with no words is refused", C.compose({ to: "A" }, T0).field, "body");
eq("a message with nobody to carry it to is refused", C.compose({ body: "x" }, T0).field, "to");
eq("a hand-off with no carrier is refused", C.handOff(made.message, {}, T0).field, "carrier");
eq("an empty file is refused", C.parseMessage("").empty, true);
eq("a file with no message is refused", C.parseMessage("{}").unreadable, true);
eq("a broken file is refused", C.parseMessage("{ broken").unreadable, true);

section("no network anywhere");
ok("no fetch, XHR, WebSocket or beacon", !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(strip(read("docs/play/carrier-core.js") + read("docs/play/app.js"))));
ok("the page forbids connections", /connect-src 'none'/.test(read("docs/play/index.html")));
ok("the page says the transport is not built", /no Bluetooth, no cable API and no QR camera/.test(read("docs/play/index.html")));

section("storage");
var thrown = C.exportFile("message", { message: second.message }, {}, function () { var e = new Error("q"); e.name = "QuotaExceededError"; throw e; });
eq("a failed write is reported", thrown.ok, false);
ok("it says the file was not written", /not written/.test(thrown.reason));
ok("the filename is derived from the recipient", /carrier-aaji\.json/.test(C.exportFile("message", { message: second.message }, {}, function () { return true; }).filename));

section("shape — every script the page loads exists beside it");
var page = read("docs/play/index.html");
var srcs = (page.match(/<script[^>]+src="([^"]+)"/g) || []).map(function (t) { return t.replace(/.*src="([^"]+)"/, "$1"); });
srcs.forEach(function (x) { ok("script src resolves: " + x, fs.existsSync(path.join(ROOT, "docs", "play", x.replace(/^\.\//, "")))); });
ok("the landing page exists", fs.existsSync(path.join(ROOT, "docs", "index.html")));
ok("the page manifest exists", fs.existsSync(path.join(ROOT, "PAGES.json")));
ok("the web manifest exists", fs.existsSync(path.join(ROOT, "docs", "play", "manifest.webmanifest")));

var total = passed + failed.length;
if (!total) { console.error("self-tests: 0 assertions ran."); process.exit(1); }
if (failed.length) { console.error("self-tests: " + passed + "/" + total + " passed, " + failed.length + " FAILED"); failed.slice(0, 12).forEach(function (f) { console.error("  FAIL " + f); }); process.exit(1); }
console.log("self-tests: " + passed + "/" + total + " assertions passed");
