/*
 * Contact form + SMS consent recorder.
 * - Both SMS checkboxes are optional and unchecked by default; the form submits without them.
 * - Each consent choice is recorded separately (granted / not_granted) with an ISO timestamp,
 *   the exact label wording shown on screen, the consent version, and a SHA-256 of the wording.
 * - Payload keys are flat so they map 1:1 to HighLevel custom fields.
 */
(function () {
  "use strict";
  var cfg = window.APP_CONFIG || {};
  var form = document.getElementById("contact-form");
  if (!form) return;
  var statusEl = document.getElementById("form-status");
  var btn = document.getElementById("submit-btn");
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());

  // Safety net: guarantee boxes start unchecked even if a browser restores form state.
  ["sms_informational", "sms_marketing"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.checked = false; el.required = false; el.removeAttribute("required"); }
  });

  function clean(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function labelText(id) { var el = document.getElementById(id); return el ? clean(el.textContent) : ""; }

  function sha256(text) {
    if (!window.crypto || !crypto.subtle || !window.TextEncoder) return Promise.resolve("");
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    }).catch(function () { return ""; });
  }

  function normalizePhone(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d.length === 11 && d.charAt(0) === "1") d = d.slice(1);
    return d.length === 10 ? "+1" + d : null;
  }

  function setErr(id, show) {
    var input = document.getElementById(id);
    var err = document.getElementById(id + "-err");
    if (input) input.setAttribute("aria-invalid", show ? "true" : "false");
    if (err) err.classList.toggle("show", !!show);
  }

  function showStatus(kind, msg) {
    statusEl.className = "status " + kind;
    statusEl.textContent = msg;
  }

  function validate() {
    var ok = true;
    var name = clean(form.name.value);
    var email = clean(form.email.value);
    var phone = normalizePhone(form.phone.value);
    setErr("name", !name); if (!name) ok = false;
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    setErr("email", !emailOk); if (!emailOk) ok = false;
    setErr("phone", !phone); if (!phone) ok = false;
    return ok ? { name: name, email: email, phone: phone } : null;
  }

  function send(url, payload) {
    // 1) Normal JSON POST. 2) If the browser blocks it for CORS, fall back to a
    //    form-encoded "simple" request (no preflight). HighLevel inbound webhooks accept both.
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return true;
    }).catch(function (e) {
      if (e && /HTTP \d+/.test(e.message)) throw e;
      return fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload).toString()
      }).then(function () { return true; });
    });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    statusEl.className = "status";
    if (form.company_website && form.company_website.value) return; // bot

    var v = validate();
    if (!v) { showStatus("bad", "Please fix the highlighted fields."); return; }

    if (!cfg.webhookUrl) {
      showStatus("bad", "This form isn't connected yet. Please call (407) 923-5544 or email angelpantoja@epique.me.");
      if (window.console) console.warn("APP_CONFIG.webhookUrl is empty — set it in assets/config.js");
      return;
    }

    var now = new Date();
    var ts = now.toISOString();
    var infoChecked = document.getElementById("sms_informational").checked;
    var mktChecked = document.getElementById("sms_marketing").checked;
    var infoText = labelText("sms_informational_label");
    var mktText = labelText("sms_marketing_label");
    var linksText = clean(document.querySelector(".legal-links").textContent);
    var parts = v.name.split(" ");

    btn.disabled = true; btn.textContent = "Sending…";

    Promise.all([sha256(infoText), sha256(mktText)]).then(function (h) {
      var payload = {
        // Contact
        full_name: v.name,
        first_name: parts[0],
        last_name: parts.slice(1).join(" "),
        email: v.email,
        phone: v.phone,
        message: clean(form.message.value),
        // Informational SMS consent (recorded independently)
        sms_informational_consent: infoChecked ? "granted" : "not_granted",
        sms_informational_consent_at: infoChecked ? ts : "",
        sms_informational_consent_text: infoText,
        sms_informational_consent_text_sha256: h[0],
        // Marketing SMS consent (recorded independently)
        sms_marketing_consent: mktChecked ? "granted" : "not_granted",
        sms_marketing_consent_at: mktChecked ? ts : "",
        sms_marketing_consent_text: mktText,
        sms_marketing_consent_text_sha256: h[1],
        // Context shown with the boxes
        sms_disclosure_links_text: linksText,
        consent_version: cfg.consentVersion || "",
        privacy_policy_url: new URL(cfg.privacyPolicyUrl || "privacy-policy.html", location.href).href,
        terms_url: new URL(cfg.termsUrl || "terms.html", location.href).href,
        // Evidence
        form_submitted_at: ts,
        form_submitted_at_local: now.toString(),
        timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ""),
        page_url: location.href,
        user_agent: navigator.userAgent,
        source: "Angel Pantoja SMS landing page"
      };
      return send(cfg.webhookUrl, payload);
    }).then(function () {
      form.reset();
      showStatus("ok", "Thanks! Your message was sent. Angel will be in touch soon." +
        ((infoChecked || mktChecked) ? " You'll receive a confirmation text; reply STOP at any time to opt out." : ""));
    }).catch(function () {
      showStatus("bad", "Sorry, something went wrong. Please call (407) 923-5544 or email angelpantoja@epique.me.");
    }).then(function () {
      btn.disabled = false; btn.textContent = "Send Message";
    });
  });
})();
