/* app — the Carrier page. SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · (c) 2026 Dr Sohil Momin
 * Wiring only: the chain, the hash and the import rules live in carrier-core.js. */
(function () {
  "use strict";
  var C = window.CarrierCore;
  var $ = function (id) { return document.getElementById(id); };
  var K = "carrier:message";
  var state = { message: null };

  var els = {
    status: $("status"), to: $("to"), from: $("from"), body: $("body"), composeBtn: $("composeBtn"), composeSays: $("composeSays"),
    msgCard: $("msgCard"), msgHead: $("msgHead"), msgBody: $("msgBody"), chainList: $("chainList"),
    carrier: $("carrier"), hopBtn: $("hopBtn"), exportBtn: $("exportBtn"), importFile: $("importFile"), ioNote: $("ioNote")
  };

  function setStatus(k, m) { els.status.className = "status show " + k; els.status.textContent = m; }
  function node(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }

  function persist() {
    if (!state.message) return true;
    try { window.localStorage.setItem(K, C.serialize(state.message)); return true; }
    catch (e) { setStatus("bad", "NOT SAVED: " + (e && e.name === "QuotaExceededError" ? "storage is full" : "storage is unavailable") + ". The message on screen is unchanged."); return false; }
  }

  function render() {
    var m = state.message;
    els.msgCard.hidden = !m;
    if (!m) return;
    var r = C.received(m);
    els.msgHead.textContent = "To " + m.to + ", from " + m.from;
    els.msgBody.textContent = m.body;
    els.chainList.textContent = "";
    if (!r.hops) els.chainList.appendChild(node("li", null, "Not carried yet."));
    r.chain.forEach(function (h, i) {
      var li = node("li", null, (i + 1) + ". " + h.carrier);
      li.appendChild(node("span", "meta", "handed on " + h.on));
      els.chainList.appendChild(li);
    });
    if (!r.intact) setStatus("bad", r.says);
  }

  function compose() {
    var out = C.compose({ to: els.to.value, from: els.from.value, body: els.body.value }, Date.now());
    if (!out.ok) { setStatus("bad", out.reason); return; }
    state.message = out.message;
    var saved = persist();
    render();
    els.composeSays.textContent = out.says;
    if (saved) setStatus("ok", out.says);
  }

  function hop() {
    if (!state.message) { setStatus("bad", "Compose or import a message first."); return; }
    var out = C.handOff(state.message, { carrier: els.carrier.value }, Date.now());
    if (!out.ok) { setStatus("bad", out.reason); return; }
    state.message = out.message;
    var saved = persist();
    els.carrier.value = "";
    render();
    if (saved) setStatus(out.duplicate ? "warn" : "ok", out.says);
  }

  function doExport() {
    if (!state.message) { setStatus("bad", "There is no message to carry."); return; }
    var out = C.exportFile("message", { message: state.message }, {}, function (name, text, mime) {
      if (!window.Export || typeof window.Export.save !== "function") throw new Error("the export kit did not load");
      window.Export.save(name, text, mime); return true;
    });
    if (out.ok) { els.ioNote.textContent = "Wrote " + out.filename + " \u2014 carry that file across yourself."; setStatus("ok", "Exported."); }
    else setStatus("bad", out.reason + ".");
  }

  function doImport(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = C.parseMessage(String(reader.result || ""));
      if (!parsed.ok) { setStatus("bad", parsed.reason); return; }
      state.message = parsed.message;
      var saved = persist();
      render();
      var r = C.received(state.message);
      if (saved) setStatus("ok", "Imported. " + r.says);
    };
    reader.onerror = function () { setStatus("bad", "The file could not be read."); };
    reader.readAsText(file);
  }

  els.composeBtn.addEventListener("click", compose);
  els.hopBtn.addEventListener("click", hop);
  els.exportBtn.addEventListener("click", doExport);
  els.importFile.addEventListener("change", function () { if (els.importFile.files[0]) doImport(els.importFile.files[0]); });

  var raw = null;
  try { raw = window.localStorage.getItem(K); } catch (e) { raw = null; }
  if (raw) {
    var parsed = C.parseMessage(raw);
    if (parsed.ok) state.message = parsed.message;
    else setStatus("bad", parsed.reason);
  }
  render();
  if (window.Loom && window.Loom.pwa) window.Loom.pwa.register("sw.js");
})();
