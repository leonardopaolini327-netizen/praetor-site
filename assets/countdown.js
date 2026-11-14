/* Praetor Trading — launch countdown + waitlist form sent without leaving the page. */
(function () {
  "use strict";
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  document.querySelectorAll(".countdown[data-launch]").forEach(function (box) {
    var launch = new Date(box.getAttribute("data-launch")).getTime();
    function q(k) { return box.querySelector('[data-cd="' + k + '"]'); }
    function tick() {
      var left = Math.max(0, launch - Date.now());
      if (left === 0) {
        box.querySelector(".cd-units").hidden = true;
        box.querySelector(".cd-note").textContent = "Praetor is live.";
        return;
      }
      var s = Math.floor(left / 1000);
      q("d").textContent = Math.floor(s / 86400);
      q("h").textContent = pad(Math.floor(s % 86400 / 3600));
      q("m").textContent = pad(Math.floor(s % 3600 / 60));
      q("s").textContent = pad(s % 60);
      setTimeout(tick, 1000);
    }
    tick();
  });

  var form = document.getElementById("waitlist-form");
  if (form && window.fetch && window.FormData) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      var msg = form.querySelector(".form-msg");
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(form.action, { method: "POST", mode: "no-cors", body: new FormData(form) })
        .then(function () {
          form.querySelectorAll("label, .form-row, button").forEach(function (n) { n.hidden = true; });
          msg.className = "form-msg ok";
          msg.textContent = "Almost done! Check your inbox and click the link to confirm.";
          msg.hidden = false;
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = "Join the waitlist";
          msg.className = "form-msg err";
          msg.textContent = "Something went wrong. Please try again, or write to support@praetortrading.finance.";
          msg.hidden = false;
        });
    });
  }
})();
