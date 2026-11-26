# Rose Professional Cleaning

Customer accounts and dashboard setup: [docs/CUSTOMER-SETUP.md](docs/CUSTOMER-SETUP.md). Use connected mode for real registration, persistent cleaning requests and owner contact forwarding. See [docs/CPANEL.md](docs/CPANEL.md) for the Node.js deployment package.

Production runs on Krystal at [rosecleaning.uk](https://rosecleaning.uk), with GitHub Actions deployment from `main`. See the [current production status](docs/PRODUCTION-STATUS.md) and [deployment/rollback runbook](docs/DEPLOYMENT.md) before operating the live environment. Production signup, verification, login, recovery, request persistence, cancellation and real email delivery were verified on 26 November 2026 using owner-authorised synthetic data. See [CI/CD and previews](docs/CI-CD.md), [environment variables](docs/ENVIRONMENT.md) and [troubleshooting](docs/TROUBLESHOOTING.md).

A Next.js App Router application for Rose’s public website, customer cleaning requests and initial staff operations. TypeScript, React, Tailwind CSS, Supabase Postgres/Auth, a pluggable email adapter, Vitest and Playwright. Runs on a Node.js server.

**A submission is a request until Rose confirms it. No payments are collected.** There are no marketplace accounts, cleaner sign-ups, recurring booking generation, subscriptions or payment integrations.

## Connected customer setup

Start with [CUSTOMER-SETUP.md](docs/CUSTOMER-SETUP.md) for real Supabase accounts, the dashboard, cleaning requests, Contact Us forwarding and verification commands.

## Separate fictional demo preview

Use Node.js 22 LTS and npm. Install from the lockfile:

```sh
npm ci
npm run dev:demo
```

Open http://localhost:3000. If another application uses that port:

```sh
NEXT_PUBLIC_SITE_URL=http://localhost:3005 npm run dev:demo -- --port 3005
```

To preview an optimised build locally:

```sh
npm run build
npm run start:demo
```

Development and production builds use Next.js's Webpack option. The shared header is rendered per request so account state and the explicit runtime mode are never baked into an anonymous build.

The **Demo preview** banner offers customer and staff views. Start with the customer view, request a clean, switch to staff, open the request and confirm it. Switch back to the customer view to see the confirmed visit and history.

Demo mode is explicit (`APP_MODE=demo`), never an automatic backend-error fallback. It uses fictional accounts, a separate pricing fixture, demonstration working windows and an isolated server-memory workspace identified by a signed HttpOnly cookie. Data persists across navigation and role switches within that workspace, and disappears on server restart or session expiry (24 hours). Separate browser contexts have separate workspaces. A demo role switch has **no effect in connected mode**. Demo is intended for a single local Node process, not distributed production hosting. No demo email adapter can send real messages.

The visitor booking draft is stored in `sessionStorage` in the current tab, restored after login and removed after successful submission. The “Clear draft” control removes it. Do not put sensitive access codes in notes. Demo forms should use fictional information only.

## Connected setup

For cPanel hosting, run `npm run build:cpanel` to generate the visible
`build/rose-cpanel.zip` server package and `build/rose-public-html.zip` public
website assets. Extract the public assets into `public_html` and keep the server
package in the private Node application directory. See [the cPanel instructions](docs/CPANEL.md)
for setup, environment variables and dependency installation.

1. Copy `.env.example` to `.env.local` and leave `APP_MODE=connected`.
2. Production already uses the Rose Cleaning Supabase project (`tsnbceddjcdtjvijldpf`); do not create a replacement. For a separate disposable local environment, use the Supabase CLI:

   ```sh
   npx supabase start
   npx supabase db reset
   ```

   Docker must be running for the local Supabase stack. `db reset` is for a disposable local development database; do not use it against customer data.

3. Apply every file in `supabase/migrations` in order, then `supabase/seed.sql`. With a linked Supabase project, review the target and use `npx supabase db push`; run the safe seed separately if needed. The seed has four household categories, **no approved prices**, no real customer data, no promotions and unconfigured operations. Its fallback durations are internal initial values needing owner review.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY`. The latter stays server-only. Generate a separate application signing secret:

   ```sh
   openssl rand -hex 32
   ```

   Put the result in `APP_SECRET`. Keep `.env.local` out of Git. Do not print or commit keys.

5. Set `NEXT_PUBLIC_SITE_URL` to the exact browser origin. Mutating API requests check the Origin header against this value. Local alternate ports need a matching value.
6. In Supabase Auth, enable email/password, email verification, appropriate password strength and provider-side auth rate limits. Set Site URL to the same origin and allow `<origin>/auth/callback`. Password recovery redirects through this callback to `/reset-password`. The callback accepts both PKCE `code` exchanges and approved `token_hash` email types. For cross-device email templates, use a token-hash callback such as:

   ```text
   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/dashboard
   ```

   Use `type=recovery&next=/reset-password` for recovery. Retain the `next` destination for booking drafts when customising templates. Test your actual templates before launch. For a local Supabase stack, inspect verification and recovery messages in Inbucket at http://localhost:54324. Never test delivery using real customer addresses.

7. Register an operator account, verify its email and promote it through the trusted Supabase SQL editor:

   ```sql
   insert into public.staff_members(user_id)
   select id from auth.users where email = 'REPLACE_WITH_OPERATOR_EMAIL'
   on conflict do nothing;
   ```

   Confirm the exact account before running it. Staff membership cannot be set through registration metadata, profile updates or public RPCs.

8. Restart Next.js. Missing required configuration leads to `/setup`; backend failures remain errors, never sample data.

## Public routes

| Route                                                   | Purpose                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| `/`                                                     | Official Rose brand, photographic homepage and cleaning reveal    |
| `/about`                                                | Known business and service approach                              |
| `/services`                                             | Fourteen services grouped into five categories                    |
| `/contact`                                              | Validated, stored enquiry                                        |
| `/office-quote`                                         | Validated, stored office quote request                           |
| `/book`                                                 | Shared progressive cleaning request flow                         |
| `/terms`, `/privacy`, `/cancellation`                   | Explicit legal drafts requiring completion                       |
| `/signup`, `/login`                                     | Email/password account creation and sign-in; optional magic link |
| `/forgot-password`, `/reset-password`, `/auth/callback` | Recovery, verification and callback handling                     |
| `/setup`                                                | Actionable configuration instructions                            |

## Account and operations routes

| Route                      | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `/dashboard`               | Pending requests, confirmed visits and closed requests                    |
| `/dashboard/book`          | Same request component and validation as `/book`                          |
| `/dashboard/bookings`      | Customer request history                                                  |
| `/dashboard/bookings/[id]` | Quote, property, status history, proposals and cancellation               |
| `/dashboard/settings`      | Profile, addresses, data export and deletion request                      |
| `/staff`                   | New requests and confirmed visits                                         |
| `/staff/bookings`          | Date/status/service filters                                               |
| `/staff/bookings/[id]`     | Review, confirm, reject, propose, complete, internal notes and assignment |
| `/staff/calendar`          | Fortnight calendar of requests and confirmed reservations                 |
| `/staff/catalogue`         | Editable services/extras and append-only pricing drafts/approvals         |
| `/staff/settings`          | Working days/windows, capacity, internal cleaners and data requests       |
| `/staff/outbox`            | Enquiries, email previews and provider submission status                  |

Private pages and API routes authenticate on the server. Supabase RLS also restricts reads. Customers can only read their own bookings, history, profiles, addresses and data requests. Public catalogue reads do not expose pricing drafts, customer records or internal notes.

## Booking and pricing behaviour

The public presentation catalogue is in `lib/service-catalogue.ts`: names, concise descriptions, photographic references, alt text, categories and request destinations. Existing household service IDs and historical booking relationships are unchanged. Additional poster services use the existing contact/office quote forms with the selected service stored in the enquiry message. They introduce no prices, schemas or bookable packages. The existing one-off cleaning journey remains linked from the services page. Connected prices and options continue to come from the operational database catalogue.

- Services and extras are catalogue rows. `pricing_versions.config` holds calculation rules; connected-mode values come from the database. Demo values exist only in `lib/catalogue.ts`’s clearly labelled fixture.
- Rates use integer pence. Base minutes + bedroom minutes + bathroom minutes are priced at the configured hourly rate, rounded up to the next penny and subject to a configured minimum. Extras add their configured price and duration. Explicit adjustment lines form part of the complete total. No VAT status or promotion is inferred.
- Missing or unapproved connected rates produce **Price to be confirmed**, not £0. The staff panel can save drafts without activating them.
- The estimate API calculates on the server and signs the draft and quote. Submission validates the schema, recalculates, checks the signature and pricing version, then stores the itemised snapshot. Extra request fields, including a client-supplied total, are rejected. A changed estimate returns HTTP 409 with the new quote and clears the review checkbox.
- Idempotency keys prevent repeated submissions from creating duplicate records. Database status changes lock the record and use its revision to prevent duplicate events or notifications from repeated clicks.
- Pending requests do not reserve capacity. Confirmation and customer acceptance recheck working days, lead time, horizon, blackout dates and capacity in a database transaction. A shared advisory transaction lock serialises overlapping confirmations and operational setting changes.
- Reservations conservatively cover earliest arrival through latest arrival **plus** snapshotted service duration, in Europe/London. Capacity is measured in configured team units. Internal cleaner assignment is manual; it does not create a cleaner login.
- An alternative to a confirmed visit retains the original reservation and agreed quote until the customer accepts or cancels. Acceptance atomically checks and moves the reservation. A price-to-be-confirmed request requires a tailored approved offer and customer acceptance before confirmation. An operationally unconfigured calendar cannot confirm visits.
- Editing operational settings while upcoming reservations exist is blocked to avoid silently changing their meaning. Existing quote snapshots remain intact when catalogue/pricing changes.
- Approved booking information can be inserted into `policy_versions` by a trusted operator. The current approved version appears at review and its ID and acknowledgement timestamp are saved. No draft legal terms are represented as accepted policies.

## Notifications

`lib/server/email.ts` defines a small adapter contract, a preview adapter and a Resend implementation. Database mutations enqueue separate request-received, confirmation, proposal, change/cancellation and enquiry messages in the same transaction as the relevant record. Unique event keys prevent duplicates.

Booking notifications default to **preview**. Contact forwarding instead records a failed processing state when sending is disabled or credentials are missing, while retaining the message. Messages and processing details are visible only to staff at `/staff/outbox`. To enable real email, configure all of:

```text
EMAIL_PROVIDER=resend
EMAIL_SEND_ENABLED=true
RESEND_API_KEY=<server-only key>
EMAIL_FROM=<owner-approved address on a verified sending domain>
CONTACT_TO_EMAIL=rose.cleaning.uk@icloud.com
```

Do not enable this for development against real customer records. No business sender email has been invented.

Each message is claimed atomically before sending, with the event key sent as Resend’s idempotency key. `submitted` means the provider accepted the API request; it does **not** claim delivery. `preview` means not sent. Timeouts become `uncertain`; stale `sending` claims become `uncertain` on the next dispatch after five minutes. Inspect the provider before any manual retry, particularly after its 24-hour idempotency window. Automatic retries of uncertain messages are deliberately omitted to avoid duplicate customer emails. A failed notification never changes a saved request into a failed booking response.

Staff can process queued records in the outbox. An external scheduler may POST to `/api/notifications/dispatch` with `Authorization: Bearer <CRON_SECRET>` when explicitly configured. No scheduled job is created by this repository. Development previews are never automatically converted into real sends.

## Account data workflows

The authenticated `/api/account/export` route downloads the customer’s profile, addresses, bookings and visible history as JSON. It excludes internal notes.

Deletion is an explicit, persistent **request for review**. The UI accurately reports that records have not been deleted. Staff can mark it `in_review`. Until the owner provides retention rules, there is no automatic deletion or invented retention period. To fulfil a request, an authorised operator must verify identity, resolve active visits, determine any required retention, export or redact retained records according to the approved policy, remove eligible dependent records, delete the Auth user with the Supabase Admin API, and communicate what was removed or retained. The interface does not offer a misleading “fully deleted” action. Record fulfilment only after that procedure is actually completed.

## Checks and browser verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright uses an explicitly identified local demo backend and a fresh isolated browser context. It tests the public journey through a customer request and staff confirmation, proposals, permissions, duplicated submissions, manipulated totals, saved pricing versions, profile/address persistence, deletion requests, enquiries, responsive overflow and primary pages. It automatically uses installed Google Chrome on macOS; otherwise install Playwright's Chromium as above. It does not represent a successful hosted Supabase/Auth or live Resend integration test.

For repeatable screenshots and basic browser/focus checks, start a demo server on port 3005 and run `node scripts/visual-check.mjs`. Screenshots are written to the ignored `.local/qa` folder. The script refuses to create fixtures unless the visible demo banner is present.

Database tests require a local PostgreSQL server with permission to create a disposable test database. For Homebrew PostgreSQL 16, an isolated test cluster can be started as follows:

```sh
mkdir -p .local
/opt/homebrew/opt/postgresql@16/bin/initdb -D .local/pgdata -A trust --no-locale
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D .local/pgdata -l .local/postgres.log -o '-p 55438 -h 127.0.0.1' start
npm run test:db
```

On other systems use the equivalent PostgreSQL binaries, or set `TEST_DATABASE_URL` to a local test server’s maintenance database. `scripts/test-db.sh` creates and drops its own database. `tests/db/bootstrap.sql` supplies only the minimal Supabase Auth roles/UID harness for standalone SQL testing; **never apply this test harness to a real Supabase project**. Tests exercise actual RLS and transactional concurrency in PostgreSQL, not a mocked capacity button.

Stop the isolated cluster when finished:

```sh
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D .local/pgdata stop
```

See `docs/VERIFICATION.md` for the checks actually run in this handoff and integration limits.

## Vercel deployment structure

No site has been published, pushed or deployed as part of this build.

1. Import the reviewed Git repository into Vercel using its Next.js preset and Node 22.
2. Set `APP_MODE=connected`, the exact site origin, Supabase credentials and a production `APP_SECRET` in the Vercel environment. Keep service credentials server-only. Preview deployments must use their own matching origin and a separate non-production Supabase project if they write data.
3. Apply and review migrations against the intended Supabase project. Add the production callback origin in Supabase Auth, configure the real email templates/provider and test verification/recovery with controlled accounts.
4. Obtain the missing owner approvals, legal documents, operational data and assets listed in `docs/OWNER-INPUTS.md` before customer launch.
5. Run all checks, then build using `npm run build`. The app uses Node route handlers and server components; it is not a static export. No Vercel-specific paid service is required by the source.
6. Configure email only after the sender/domain is approved. Check the staff outbox and provider logs using controlled addresses.

No non-essential tracking is included. Security headers restrict framing, browser capabilities and cross-origin resources. The CSP permits Next.js inline bootstrapping; production excludes `unsafe-eval`. Review a nonce-based stricter policy if the final hosting setup calls for it. Public forms have server validation, a honeypot, request size limits, same-origin checks and database-backed throttling. Auth also needs Supabase’s provider-side protections. Deploy behind a trusted proxy that controls forwarded IP headers (Vercel supplies its own forwarded header).

## Source map

- `app/`: server-rendered public pages, protected customer/staff routes, auth callback and API router.
- `components/`: shared brand, layouts, request journey, calendar, account and staff controls.
- `lib/brand.ts`, `lib/service-catalogue.ts`: shared official identity/contact details and public service presentation.
- `lib/pricing.ts`, `lib/scheduling.ts`, `lib/validation.ts`: shared business calculations and validation.
- `lib/server/`: server-only authentication, signing, data access, isolated demo state and email adapter.
- `supabase/`: schema, permissions, transactional operations, safe seed and local configuration.
- `tests/`, `scripts/`: unit, browser and actual database verification.
- `docs/`: owner decisions, asset inventory and verification record.

## Official brand and photography

See [the cinematic redesign record](docs/CINEMATIC-REDESIGN.md) for the section map, motion behaviour and local screenshot workflow. The [earlier design update record](docs/DESIGN-UPDATE.md) documents the official logo and photographic catalogue update.

The complete approved `img/Logo.jpeg` is retained intact alongside an archival public copy. Shared branding uses `public/brand/Logo-transparent.png`, which preserves the original colour pixels with transparency outside the circular badge; browser icons are faithful derivatives. The exact existing design tokens in `app/globals.css` are unchanged. Cinematic presentation lives in `app/cinematic.css`, with a full-screen photographic hero, interactive service collections and a short desktop process story. GSAP ScrollTrigger is loaded on demand for motion-enabled visitors. Native scrolling is retained, with no React state updates per frame. Reduced-motion users see static, readable content and the clean final image. Mobile has no pinned sequence. Use `node scripts/cinematic-check.mjs` against the local demo preview on port 3005 for genuine desktop/mobile screenshots.

New photographs are served locally, with sources and licences in `docs/PHOTOGRAPHY.md`. `docs/ASSETS.md` records the logo derivatives and remaining missing imagery. The supplied poster's transcribed service/contact details were used; the poster image and actual Rose Removals van photograph were not present. No poster promotions were activated.

Displayed contact details now use `rosecleaning.uk`, `info@rosecleaning.uk`, both supplied phones and Instagram. The earlier domain was `www.roseprofessionalcleaning.co.uk`. This design update does not change DNS, hosting, Supabase callbacks or `NEXT_PUBLIC_SITE_URL`; configure those separately when authorised.
