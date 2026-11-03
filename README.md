# Angel Pantoja | Epique Realty — SMS Opt-In Landing Page

Static site (no build step) for A2P 10DLC campaign registration in HighLevel (LeadConnector).

```
index.html            Landing page + contact form + 2 optional SMS consent boxes
privacy-policy.html   Privacy Policy (SMS no-share clause in §3)
terms.html            Terms & Conditions; SMS Terms at terms.html#sms
assets/config.js      Webhook URL + consent version  <-- edit this
assets/form.js        Validation + separate consent recording
assets/styles.css     Brand styles from angelpantojahomes.com
assets/logo.webp      ADD THIS: Angel's logo (falls back to the Lofty CDN copy)
COMPLIANCE-CHECKLIST.md  Requirements audit + campaign copy-paste fields
```

## Deploy (GitHub Pages, free)

1. Create a **public** repo (e.g. `angel-pantoja-sms`) and push this folder to `main`.
2. Repo **Settings → Pages → Source: Deploy from branch → `main` / root**. Wait ~1 minute.
3. URL will be `https://<github-user>.github.io/angel-pantoja-sms/`.
4. Recommended: add a custom subdomain Angel controls (e.g. `text.angelpantojahomes.com`)
   via **Settings → Pages → Custom domain** + a CNAME DNS record, and tick **Enforce HTTPS**.

## Connect the form to HighLevel

1. In Angel's sub-account: **Automation → Workflows → New → Trigger: Inbound Webhook**. Copy the URL.
2. Paste it into `assets/config.js` → `webhookUrl`, commit, push.
3. Submit a test from the live page, then in the trigger click **Fetch sample request**.
4. Create contact custom fields and map them with **Create/Update Contact**:
   `sms_informational_consent`, `sms_informational_consent_at`, `sms_informational_consent_text`,
   `sms_marketing_consent`, `sms_marketing_consent_at`, `sms_marketing_consent_text`,
   `consent_version`, `form_submitted_at`, `page_url`, `user_agent`.
5. Add tags by branch: `sms-info-optin` if informational = granted; `sms-marketing-optin` if marketing = granted.
   If **neither** is granted, set the contact's SMS DND on (no texts).
6. Only enroll contacts tagged `sms-marketing-optin` in marketing/drip SMS. Informational-only contacts get
   transactional texts only.

## When you change wording

Any edit to consent labels, disclosures, Privacy Policy, or Terms → bump `consentVersion` in `config.js`
and update the campaign's Message Flow text in HighLevel to match.
