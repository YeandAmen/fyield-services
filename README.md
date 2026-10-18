# Fyield — Abuja services marketplace

Capability deserves visibility. Fyield connects Abuja service providers and customers.

## Implemented

- Account registration/sign-in, seven-day server sessions, password changes and sign-out using Better Auth.
- Provider-owned profiles with Abuja neighborhood, service category, experience, starting price, service tags and description.
- Up to six captioned portfolio photos per profile; signed-in uploads, server-side decode/resize/re-encode, metadata stripping and bounded image size.
- Public photo gallery, real customer review totals and averages, no fabricated ratings.
- One review per account/provider. Providers cannot review themselves. Review authors can remove their own reviews.
- Private customer enquiries and provider replies; participants only. Inbox is in My account.
- Provider profile editing/removal and an uploaded-photo library for removing unused photos.
- Sample profiles are clearly labeled. They cannot receive enquiries or reviews.

## Stack

Buildless HTML/CSS/JS in `dist/`; Express 5 on a Vercel Node function at `api/index.js`.
Better Auth uses Neon Postgres via the serverless WebSocket driver. Images use Vercel Blob.
The Vercel project is `fyield-services` in FYIELD (`fyield1`). Source is private on GitHub.
GitHub-to-Vercel automatic deployment still requires granting the Vercel GitHub app repository access.

## Development

```sh
npm ci
# Pull development environment variables through the authenticated Vercel CLI.
# Set a strong BETTER_AUTH_SECRET and BETTER_AUTH_URL=http://localhost:4174 locally.
npm run migrate
npm run dev
npm test
# Against a running server (creates and removes explicitly named QA records):
TEST_BASE_URL=http://localhost:4174 node --env-file=.env.local scripts/test-integration.mjs
```

The initial Marketplace resource connects the same database to production and development.
Use isolated database branches/environments before further schema development with real users.
Never reset the database or run destructive migrations against production.

Required runtime variables: `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ random characters),
`BETTER_AUTH_URL`, `BLOB_READ_WRITE_TOKEN`. Keep all secrets server-side, excluded from Git,
deployment uploads, and distributable archives. The server uses a five-connection pool.

## Permissions and data handling

- Every write verifies its origin, session, ownership and input bounds server-side.
- Database-backed auth rate limits and atomic per-account mutation counters persist across functions.
- Profile photos must belong to the current account before publication.
- Images are public; upload consent explicitly says so. Do not upload sensitive documents or child photos.
- Private emails never appear in public provider/review endpoints. Public display names do.
- Enquiries are visible only to customer and provider; these are not confirmed bookings.
- CSP permits local scripts/API calls and the Blob image host. No advertising or analytics scripts.
- Removing a provider profile cascades its reviews and enquiries. Account/photos remain until separately removed.

## Known launch limitations

Reviews are self-reported by signed-in account holders; bookings, identity, qualifications,
and email ownership are not independently verified. No verification badge is shown.
Email notifications and email-based password recovery are not configured. Users can change
passwords while signed in. Account deletion is not self-service. Booking/payment processing,
moderation tooling, review appeals and account-recovery support need a further release.
A production privacy/legal review and operational support process remain necessary before broad rollout.
This is a functional early release, not a security certification.

## Verification

Unit tests cover profile/review input bounds, HTML escaping, CSP and accidental frontend secrets.
The integration script checks signup/session, required authentication, origin rejection, image
processing and ownership, persisted profiles/gallery, review aggregation, duplicate/self-review
rejection, protected review deletion, private enquiries and provider-only replies. It removes
its exact temporary users, linked records and uploaded test image in a finally block.

## Assets

The original Fyield logo was supplied by the owner. Existing example photos are illustrative
Unsplash images, identified by their filenames. They are never represented as actual portfolio
evidence for example providers. Real provider photos are uploaded with publication consent.

## Email OTP and administrator access

The OTP implementation is staged behind `EMAIL_OTP_ENABLED=true`. Set `RESEND_API_KEY` (sensitive) and `EMAIL_FROM` to a verified Resend sender in Vercel production, then activate and redeploy. Until all three are configured, existing email/password sign-in remains available. OTP uses six digits, expires in five minutes, allows three attempts, stores hashed codes, and rate-limits requests. Once enabled, email OTP replaces password sign-in and account creation; existing users retain their accounts and can use their inbox to sign in. Actual delivery remains unverified until a sending domain/provider is configured.

Set `ADMIN_EMAILS` server-side to a comma-separated allowlist. Admin access additionally requires a verified account email. Never mark an email verified merely to bypass the OTP requirement. After verified sign-in, open **My account → Admin dashboard**. The read-only dashboard shows paginated accounts, provider details, customer reviews, and enquiry totals; it excludes private message content and authentication secrets. There is no public administrator signup or client-controlled role. Account deletion performed for the owner’s test account was an explicit maintenance action, not an administrator UI feature.

Hero portrait: “Elegant Woman in Traditional African Attire Portrait” by pexels by ardarh, https://www.pexels.com/photo/elegant-woman-in-traditional-african-attire-portrait-33378430/ . Downloaded under the Pexels license https://www.pexels.com/license/ on 2026-10-17. Used as illustrative brand imagery, not a provider endorsement.

Current hero: user-provided co-founder portrait with approved background replacement. Original approval is recorded in the project conversation; no stock model is presented as the co-founder.

New-account alerts are prepared through the Better Auth user-creation hook. Once `RESEND_API_KEY`, `EMAIL_FROM`, and `ADMIN_EMAILS` are configured, each new account triggers a generic administrator email directing them to the dashboard. It does not include the new user’s personal details. Delivery failures are logged without blocking signup; alerts are best-effort, without retries. No emails are sent until sender configuration exists.

Current live hero supersedes earlier portraits: user-provided black-and-white photograph (`fyield-portrait-mono.jpg`), copied unchanged. Framing is CSS-only, with the caption below the image.


Administrator entry: `https://fyield-services.vercel.app/#admin`. Signed-out visitors are prompted to sign in; server authorization still requires an allowlisted, verified email. Successful password and email-OTP sign-ins trigger generic admin alerts when the Resend sender is configured. Failed logins and session refreshes do not trigger sign-in alerts. Alerts omit user details and link to the restricted dashboard; delivery remains best-effort.
