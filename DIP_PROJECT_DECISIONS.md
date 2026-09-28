# DIGITAL INDIA PROJECT — CONFIRMED PROJECT DECISIONS

Paste this section at the TOP of the master development prompt.
Where this section conflicts with the master prompt, THIS SECTION WINS.
Everything else in the master prompt applies unchanged.

---

## A. Business identity (use as seed/config, never as hardcoded UI text)

- Trade name: **Digital India Project**
- Constitution: Proprietorship
- Business started: 28/10/2020
- Registered address: 4th Floor, Wing-A 404 Sunflower Building, Nano City, Samarvarni Road, Samarvani, Silvassa, Dadra and Nagar Haveli and Daman and Diu, PIN 396230
- Additional registered trade names: "Digital Seva Kendra", "Karta Files"
- GST: registered (Regular). GSTIN, legal name and business address must be entered through the admin **Settings** table or Cloudflare secrets/config. Do NOT commit the GSTIN or any tax/ID numbers into the repository or seed files.
- Public phone number and public contact email: **placeholders in Settings until the owner confirms**.
- Primary email: `hello@digitalindiaproject.com`
- Support email: `support@digitalindiaproject.com`
- Super admin (first user, created via a secure setup script, never a hardcoded password): `allindiadigitalseva@gmail.com`

## B. Repository and infrastructure

- GitHub repository: `digitalindiaproject/DIP`
- Domain: `digitalindiaproject.com` (+ `www` canonical redirect). Do not touch DNS automatically; document the steps.
- Stack exactly as in the master prompt: React + TypeScript + Vite, Hono on Cloudflare Workers, D1, R2, Zod, Wrangler.
- Bindings: `DB`, `DOCUMENTS_BUCKET`.

## C. Payments — Cashfree

- Implement `CashfreeProvider` behind the `PaymentProvider` interface (createPayment, verifyPayment, handleWebhook, refundPayment).
- Sandbox mode first; production only after the owner supplies approved live credentials as Cloudflare secrets.
- Payment status is set to successful ONLY after server-side order verification and webhook signature verification. Never trust the frontend redirect.
- Store only the provider order/payment IDs and status. No card data, no secrets in logs.
- If Cashfree credentials are not configured, show a clear "payments not configured" state. Do not fake payments.

## D. Languages — English + Hindi

- Set up i18n in Phase 1 (e.g. react-i18next) with a language switcher and persisted choice.
- Load a Devanagari-capable font (e.g. Noto Sans Devanagari) with a proper fallback stack.
- Database: bilingual content fields for admin-managed content (services, form field labels/help text, service documents, FAQs, pages), e.g. `name` + `name_hi`, with English as fallback when Hindi is empty.
- Add `lang` handling to `<html lang>`, canonical/hreflang, and SEO metadata.
- Legal pages: Hindi text is added by the owner; mark as "pending review" until then.
- Email templates and notifications: English first, with the structure ready for Hindi.

## E. Branding

- Logo: **must NOT contain the Ashoka Chakra**, the State Emblem or any government symbol.
- Until the owner supplies the final logo: use a text wordmark placeholder in ONE swappable `Logo` component.
- Palette from the brand: navy (primary), with saffron and green as small accents only. Keep one primary accent, per the design rules.
- No tricolor-heavy or flag-style layouts.

## F. Positioning rules (in addition to master prompt section 2)

- Do NOT present the business as a printing/photocopy business.
- Do NOT use "Digital Seva Kendra" in headlines, hero text or primary marketing copy. It may appear only in legal details, invoices and the footer's registered-name line.
- Do NOT imply government affiliation, approval, authorization or partnership. Show a clear footer/disclaimer line that Digital India Project is an independent private service provider.
- Do NOT display GST/Udyam registration numbers in marketing copy unless the owner explicitly requests it. Invoices must show the GSTIN from Settings.

## G. Email

- Inbound: Cloudflare Email Routing forwards `hello@` and `support@` to the owner's Gmail (documented setup step, not app code).
- Outbound (password reset, application updates): Workers cannot use Gmail SMTP. Build the `EmailProvider` interface with a transactional-provider adapter (Resend, Brevo or Amazon SES, to be chosen by the owner). Until credentials exist, do not send external email; show a configuration state.

## H. Invoices and tax

- GST rate must be configurable per service in `tax_configuration`; do not hardcode a rate.
- Government fees are shown separately from service charges. Whether a government fee is taxable is configurable and must not be assumed.
- Add a note in docs that tax treatment must be confirmed with the owner's accountant.

## I. Working rules for this build

- Follow the phases in the master prompt in order. Stop and verify at each phase gate.
- Report after each phase in the required format (Completed / Files / Database / API / Tests / Issues / Next).
- Never commit secrets, IDs, `.env` files or real customer data.
- Seed data: example services only, clearly labelled as development seed data. No fake customers, payments or statistics.
