# Fyield — Abuja services marketplace

Capability deserves visibility.

An Abuja-only, responsive marketplace **launch preview** for nannies, cleaning,
mechanics, hair and beauty, and skilled trades. Uses the supplied original Fyield
logo with navy, terracotta, and warm white for the broader services identity.

## Current release

- Search by skill, provider name, and Abuja neighborhood.
- Filter Maitama, Gwarinpa, Wuse, Garki, and Jabi.
- Explore clearly marked illustrative provider profiles and portfolios.
- Save sample profile IDs locally; remove them from Privacy & your data.
- Provider onboarding and contact screens describe availability without collecting personal data.
- Images are served locally. No third-party scripts, fonts, analytics, or trackers.

**This release does not register providers, verify identities, send messages,
accept bookings, process payments, or collect personal details.** Sample prices
are illustrative. Sample people and work must be replaced before operating the
marketplace. Do not portray samples as verified or real providers.

## Local preview

Requires Python 3, and Node.js for checks. No packages or build step required.

```sh
python3 -m http.server 4173 --directory dist
node --test tests/security.test.mjs
```

## GitHub and Vercel

Use a private GitHub repository until the desired source visibility is agreed.
Commit the project directory; `.openai/`, credentials, and `.vercel/` are ignored.

Import the repository in the authorized Vercel team. Select the **Other** framework
preset, leave build/install commands empty, and use `dist` as the output directory.
The root `vercel.json` declares output configuration and security headers.

After deployment verify search, neighborhood filters, saved favorites, dialogs,
mobile layouts, and HTTP security headers. A deployment cannot be reported as
complete until Vercel confirms readiness and a working URL is returned.

## Before accepting personal details

Implement and review these features as a separate backend release:

1. Authenticated customer/provider accounts with verified email, session expiry,
   secure cookies, rate limiting, and authorization checks on every server route.
2. Database policies separating public service profiles from private contact,
   enquiry, address, and booking records. Customers and providers must only access
   records they own or are explicit participants in. Staff access requires roles.
3. Server-side validation, input limits, abuse reporting, moderation, blocking,
   and request throttling. Never treat client validation as authorization.
4. Private file storage with upload type/size checks, malware handling, metadata
   stripping, short-lived access links, and permission to show customer work.
   Child photos and home addresses must not become public portfolio content.
5. Consent-based, purpose-limited data collection, retention/deletion workflows,
   an accurate privacy notice, and an operational support contact. Obtain an
   appropriate local privacy/legal review before launch.
6. Tests for cross-account access, account recovery, injection, upload abuse,
   data deletion, logging redaction, and restoring backups. Security review and
   monitoring must cover the deployed backend, not only the frontend.

A Content Security Policy is defense in depth, not proof that an application is
safe to collect personal data. The current static preview intentionally has no
server submission endpoints and uses `connect-src 'none'` and `form-action 'none'`.
These policies need deliberate revision when the backend is implemented.

## Asset provenance

`dist/assets/fyield-logo.jpeg` is the logo supplied by the project owner.
The other JPGs are illustrative Unsplash images retained from the initial design;
their filenames preserve the source image IDs. Replace with permissioned provider
portfolios for launch. No testimonial, rating, verification claim, or completed-job
count is inferred from these images.
