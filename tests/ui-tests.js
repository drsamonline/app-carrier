#!/usr/bin/env node
/* ui-tests — the Carrier page in a real DOM (jsdom). SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin */
"use strict";
var fs = require("fs"), path = require("path"), { JSDOM } = require("jsdom");
var ROOT = path.join(__dirname, ".."), PLAY = path.join(ROOT, "docs", "play");
var passed = 0, failed = [];
function ok(n, c, d) { if (c) { passed++; return; } failed.push(n + (d ? " — " + d : "")); }
function eq(n, a, b) { ok(n, a === b, "expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
function build(seed) {
  var dom = new JSDOM(fs.readFileSync(path.join(PLAY, "index.html"), "utf8"), { url: "https://example.test/play/index.html", runScripts: "outside-only", pretendToBeVisual: true });
  var w = dom.window;
  if (seed) Object.keys(seed).forEach(function (k) { w.localStorage.setItem(k, seed[k]); });
  w.URL.createObjectURL = function () { return "blob:x"; }; w.URL.revokeObjectURL = function () {};
  w.HTMLAnchorElement.prototype.click = function () {};
  ["web-kit.js", "export-kit.js", "carrier-core.js", "app.js"].forEach(function (f) { w.eval(fs.readFileSync(path.join(PLAY, f), "utf8")); });
  return dom;
}
var dom = build(null), w = dom.window, d = w.document, $ = function (id) { return d.getElementById(id); };
ok("the engine loaded", !!w.CarrierCore);
ok("the channel gap is stated", /no Bluetooth, no cable API and no QR camera/.test(d.body.textContent));
eq("the message card is hidden at first", $("msgCard").hidden, true);

$("to").value = "Aaji"; $("from").value = "Sohil"; $("body").value = "The tank is fixed.";
$("composeBtn").click();
ok("the message is composed", /Composed for Aaji/.test($("status").textContent), $("status").textContent);
ok("and says it is not delivered", /not delivered/.test($("status").textContent));
eq("the card appears", $("msgCard").hidden, false);
ok("the body is shown unchanged", $("msgBody").textContent === "The tank is fixed.", $("msgBody").textContent);

$("carrier").value = "Ravi"; $("hopBtn").click();
ok("a hand-off is recorded", /Carried by Ravi/.test($("status").textContent), $("status").textContent);
ok("and does not promise arrival", /does not promise it arrived/.test($("status").textContent));
eq("one hop in the chain", d.querySelectorAll("#chainList li").length, 1);

$("carrier").value = "Ravi"; $("hopBtn").click();
ok("the same carrier adds no second hop", /no second hop was added/.test($("status").textContent), $("status").textContent);
eq("still one hop", d.querySelectorAll("#chainList li").length, 1);

$("carrier").value = "Meena"; $("hopBtn").click();
eq("a second carrier makes two", d.querySelectorAll("#chainList li").length, 2);
ok("in order", /Ravi[\s\S]*Meena/.test($("chainList").textContent), $("chainList").textContent);
ok("the body is still unchanged", $("msgBody").textContent === "The tank is fixed.");

$("exportBtn").click();
ok("the message exports to a file named for the recipient", /Wrote carrier-aaji\.json/.test($("ioNote").textContent), $("ioNote").textContent);
var saved = w.localStorage.getItem("carrier:message");
var dom2 = build({ "carrier:message": saved });
var d2 = dom2.window.document;
ok("the reload keeps the body", d2.getElementById("msgBody").textContent === "The tank is fixed.");
eq("and both hops", d2.querySelectorAll("#chainList li").length, 2);

var dom3 = build({ "carrier:message": JSON.stringify({ message: { body: "x", bodyHash: "deadbeef", chain: [] } }) });
var d3 = dom3.window.document;
ok("a tampered saved message is refused", /does not match the hash/.test(d3.getElementById("status").textContent), d3.getElementById("status").textContent);

var dom4 = build(null), w4 = dom4.window, d4 = dom4.window.document;
Object.defineProperty(w4, "localStorage", { configurable: true, get: function () {
  return { getItem: function () { return null; }, setItem: function () { var e = new Error("q"); e.name = "QuotaExceededError"; throw e; }, removeItem: function () {}, clear: function () {} }; } });
d4.getElementById("to").value = "A"; d4.getElementById("body").value = "x"; d4.getElementById("composeBtn").click();
ok("a failed save says NOT SAVED", /NOT SAVED:/.test(d4.getElementById("status").textContent), d4.getElementById("status").textContent);

var total = passed + failed.length;
if (!total) { console.error("ui-tests: 0 assertions ran."); process.exit(1); }
if (failed.length) { console.error("ui-tests: " + passed + "/" + total + " passed, " + failed.length + " FAILED"); failed.forEach(function (f) { console.error("  FAIL " + f); }); process.exit(1); }
console.log("ui-tests: " + passed + "/" + total + " assertions passed");
