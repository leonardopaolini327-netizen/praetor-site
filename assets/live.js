/* Praetor Trading — fills the page with the latest figures from data/stats.json.
   The numbers in the HTML are a fallback, shown if this file can't load. */
(function () {
  "use strict";
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function d(iso) { return new Date(iso); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hm(iso) { var t = d(iso); return pad(t.getUTCHours()) + ":" + pad(t.getUTCMinutes()); }
  function dayMonth(iso) { var t = d(iso); return t.getUTCDate() + " " + MONTHS[t.getUTCMonth()]; }
  function full(iso) { var t = d(iso); return dayMonth(iso) + " " + t.getUTCFullYear(); }
  function price(n) { return n == null ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function r(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(2) + "R"; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function set(key, text) { document.querySelectorAll('[data-k="' + key + '"]').forEach(function (n) { n.textContent = text; }); }
  function tone(key, value) {
    document.querySelectorAll('[data-k="' + key + '"]').forEach(function (n) {
      n.classList.remove("gain", "loss");
      if (value > 0) n.classList.add("gain"); else if (value < 0) n.classList.add("loss");
    });
  }
  function wl(key, won, lost) {
    document.querySelectorAll('[data-k="' + key + '"]').forEach(function (n) {
      n.textContent = "";
      n.append(String(won) + " ", el("span", "gain", "W"), " · " + lost + " ", el("span", "loss", "L"));
    });
  }

  var VOTE = { B: ["B", "c gain"], S: ["S", "c loss"], H: ["H", "c"], "-": ["—", "c nc"], x: ["×", "c nc"] };

  function render(s) {
    if (!s || !s.as_of) return;
    set("price", price(s.price));
    set("last", dayMonth(s.as_of) + ", " + hm(s.as_of) + " UTC");
    set("asof", full(s.as_of) + ", " + hm(s.as_of) + " UTC");
    set("since", full(s.since));
    set("analyses", String(s.analyses));
    set("nosignal", s.no_signal_pct == null ? "—" : s.no_signal_pct + "%");
    set("signals", String(s.signals));
    set("closed", String(s.closed));
    wl("wl", s.won, s.lost);
    set("wl2", s.won + " / " + s.lost);
    set("net", r(s.net_r)); tone("net", s.net_r);
    set("avg", s.avg_r == null ? "—" : r(s.avg_r));
    set("judge", s.closed >= 30
      ? "Based on " + s.closed + " closed trades."
      : "Fewer than 30 closed trades: far too early to judge performance.");

    var mb = document.getElementById("matrix-body");
    if (mb && s.matrix && s.matrix.length) {
      mb.textContent = "";
      var first = s.matrix[0].time, last = s.matrix[s.matrix.length - 1].time;
      set("matrixcap", s.market + " · " + s.timeframe + " · " + dayMonth(first) + " – " + dayMonth(last) + " · times in UTC");
      s.matrix.slice().reverse().forEach(function (row) {
        var tr = el("tr", row.signal ? "signal" : "");
        tr.append(el("td", "", dayMonth(row.time) + ", " + hm(row.time)), el("td", "num", price(row.price)));
        row.votes.forEach(function (v) { var m = VOTE[v] || VOTE["-"]; tr.append(el("td", m[1], m[0])); });
        tr.append(el("td", row.signal ? "" : "faint", row.outcome));
        mb.append(tr);
      });
    }

    var pb = document.getElementById("perf-body");
    if (pb && s.trades) {
      pb.textContent = "";
      if (!s.trades.length) {
        var empty = el("tr"); var td = el("td", "faint", "No closed trades yet."); td.colSpan = 9; empty.append(td); pb.append(empty);
      }
      var maxR = Math.max(2, Math.max.apply(null, s.trades.map(function (t) { return Math.abs(t.r); })));
      s.trades.forEach(function (t) {
        var tr = el("tr");
        var side = el("td", t.side === "Buy" ? "gain" : "loss"); side.append(el("b", "", t.side));
        var outcome = (t.result === "VINTO" ? "Target hit" : "Stop hit") + " · " +
          (dayMonth(t.closed) === dayMonth(t.opened) ? hm(t.closed) : dayMonth(t.closed) + ", " + hm(t.closed));
        var bar = el("div", "rbar"), track = el("i"), fill = el("span"), gap = el("span");
        gap.style.width = "50%";
        fill.style.width = (Math.abs(t.r) / maxR * 50).toFixed(1) + "%";
        fill.style.background = t.r >= 0 ? "var(--gain)" : "var(--loss)";
        if (t.r >= 0) { track.append(gap, fill); } else { track.style.justifyContent = "flex-end"; track.append(fill, gap); }
        bar.append(track, el("b", t.r >= 0 ? "gain" : "loss", r(t.r)));
        var res = el("td"); res.append(bar);
        tr.append(
          el("td", "", dayMonth(t.opened) + ", " + hm(t.opened)), el("td", "", t.market), side,
          el("td", "", t.votes + "/5"), el("td", "num", price(t.entry)), el("td", "num", price(t.stop)),
          el("td", "num", price(t.target)), el("td", "muted", outcome), res
        );
        pb.append(tr);
      });
    }
  }

  fetch("data/stats.json", { cache: "no-store" })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(render)
    .catch(function () { /* keep the fallback numbers */ });
})();
