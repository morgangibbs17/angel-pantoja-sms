/*
 * Site configuration — edit here, not in form.js.
 *
 * webhookUrl: the HighLevel (LeadConnector) Inbound Webhook URL from the workflow
 *   "Angel Pantoja – Website Contact + SMS Consent" (Automation > Workflows > Trigger:
 *   Inbound Webhook). Looks like:
 *   https://services.leadconnectorhq.com/hooks/XXXXXXXX/webhook-trigger/YYYYYYYY
 *   This is a public trigger URL (not a secret API key), so it is safe in client code.
 *   Leave empty until the workflow exists — the form will tell visitors it is not
 *   connected rather than pretending to submit.
 *
 * consentVersion: bump this whenever ANY wording in the SMS consent labels,
 *   disclosures, Privacy Policy, or Terms changes. It is stored with every submission
 *   so you can prove which wording a contact saw.
 */
window.APP_CONFIG = {
  webhookUrl: "https://services.leadconnectorhq.com/hooks/YbvMcuhDSxqulQFxzn2v/webhook-trigger/b45b7cc2-a2b3-4320-b325-f473ef3c8d76",
  consentVersion: "2026-11-03.v1",
  privacyPolicyUrl: "privacy-policy.html",
  termsUrl: "terms.html"
};
