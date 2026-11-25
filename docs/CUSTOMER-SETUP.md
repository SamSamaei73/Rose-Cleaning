# Customer accounts, requests and Contact Us

The customer application runs as a Next.js **Node.js server**. A static `public_html` upload alone cannot run authentication or database operations. Keep the existing cPanel Node application configuration described in [CPANEL.md](CPANEL.md).

## Connected configuration

Copy `.env.example` to `.env.local` for development, or set the same variables in the cPanel Node application's environment. Never commit `.env.local` or a service-role key.

| Variable | Value |
| --- | --- |
| `APP_MODE` | `connected` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; `https://rosecleaning.uk` in production |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (legacy anon key also supported) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key |
| `APP_SECRET` | Generate with `openssl rand -hex 32` |
| `CONTACT_TO_EMAIL` | **`rose.cleaning.uk@icloud.com`** |
| `EMAIL_PROVIDER` | `resend` to enable real transactional forwarding |
| `EMAIL_SEND_ENABLED` | `true` to enable sending |
| `RESEND_API_KEY` | A Resend API key authorised to send from your verified domain |
| `EMAIL_FROM` | A sender verified in Resend, for example `Rose <contact@your-verified-domain>` |
| `CRON_SECRET` | Separate random secret for the optional queue dispatcher |

The iCloud inbox is the **recipient**, not a verified Resend sender. Customer contact emails become `Reply-To`; the browser cannot set `To` or `From`. `NEXT_PUBLIC_CONTACT_EMAIL` only controls the public site's displayed contact address and is independent of forwarding.

Supabase sends signup verification and recovery emails to the **customer's registered email**. Configure Supabase Auth SMTP separately using an approved sending domain/provider. `CONTACT_TO_EMAIL` is never used by the authentication code. Configure a 12-character minimum password and enable email confirmations.

## Migrations and services

Apply all `supabase/migrations/*.sql` in filename order using Supabase migrations or the SQL editor. Existing installations must apply the new migrations; do **not** reset a production database.

- `0004_request_status.sql` adds `pending_confirmation`. Commit this migration before applying `0005` because PostgreSQL cannot use a new enum value in its creating transaction.
- `0005_customer_foundation.sql` backfills missing profiles without duplicating or overwriting existing profiles, routes profile/address writes through validated server operations, adds the preference-only request RPC to the existing `bookings` table, extends existing transitions/events, adds the remaining public catalogue services, and extends the existing contact submission/notification queue.

Run `supabase/seed.sql` for a new database. It contains service and operational defaults only, never sample customers, bookings or rates. Specialist services have no assumed duration. Existing service edits are preserved by `ON CONFLICT DO NOTHING`.

Every exposed table has RLS. Browser clients have no direct mutation permissions for bookings, profiles, addresses, contact messages, roles or notification jobs. Server operations derive the customer ID from the verified Supabase session. Profiles have a primary key referencing `auth.users`; the signup trigger creates each profile transactionally.

## Auth URLs and templates

Set Supabase Auth **Site URL** to the application's exact origin. The app redirects `www.rosecleaning.uk` to `rosecleaning.uk` so auth cookies, callback URLs and form origins stay aligned. Add these redirect URLs for each environment you use:

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=/dashboard
http://localhost:3000/auth/callback?next=/reset-password
https://rosecleaning.uk/auth/callback
https://rosecleaning.uk/auth/callback?next=/dashboard
https://rosecleaning.uk/auth/callback?next=/reset-password
```

The default Supabase confirmation URL works with the PKCE callback in the browser that requested the link. To support opening emails in another browser/device, use token-hash templates:

```html
<!-- Confirm signup -->
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/dashboard">Verify your email</a>
<!-- Reset password -->
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset your password</a>
```

For development, keep the local Auth Site URL set to the local origin. Do not mix local and production origins in a single environment's templates. The callback validates destinations and accepts only the supported Supabase token types.

Signup, resend and recovery use server rate limits, including a 60-second per-email cooldown and five email requests per hour per client. Supabase's own delivery limits also apply. Configure the reverse proxy to overwrite forwarded IP headers instead of accepting client-supplied values. Logout does not share the login rate limit. There are no browser-storage authentication flags.

## Customer routes

- `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/auth/callback`
- `/dashboard` — real counts, recent requests, useful empty state, profile link, upcoming confirmed reservation only when one exists
- `/dashboard/requests/new` — service, address, date/time preferences, property details and optional notes
- `/dashboard/requests` and `/dashboard/requests/[id]` — requests and history
- `/dashboard/profile` — basic profile and saved addresses

Existing `/dashboard/book`, `/dashboard/bookings` and `/dashboard/settings` links remain supported. The public website and separate explicit demo remain available; connected mode never falls back to fictional data. The new request form uses the existing bookings/history tables and always starts at `pending_confirmation`. No availability or price is promised by submitting the form.

## Contact processing and retry

Submitting a contact form saves its message and owner-forwarding job in one transaction. The browser receives a submission reference and a truthful processing state:

- `queued`: saved, awaiting processing.
- `sending`: a dispatcher owns the job.
- `submitted`: accepted by Resend, with provider ID and acceptance timestamp; **delivery is not confirmed**.
- `failed`: sending disabled, missing credentials, or a definite provider rejection. The saved message remains available.
- `uncertain`: timeout, provider server error, malformed acceptance, or an interrupted processing claim. Check the provider before retrying.

The application does not currently consume delivery webhooks; final delivery/bounce information is available in the provider dashboard. It never labels acceptance as delivery. Plain-text email keeps customer markup literal.

The existing staff outbox at `/staff/outbox` lists saved enquiries, references, recipient, Reply-To, attempts, errors and provider IDs. Existing staff can use **Retry failed email** after correcting configuration. Staff membership must be provisioned by the owner through trusted database administration, never user metadata. The dispatch endpoint also recovers stale claims into `uncertain` after five minutes.

An optional scheduler can POST `/api/notifications/dispatch` with `Authorization: Bearer <CRON_SECRET>`. No customer session is required for this secret-protected scheduler path. Never place the secret in a query string. The provider idempotency key is stable for every retry. Do not manually requeue uncertain/submitted jobs until provider logs establish whether they were accepted; provider deduplication windows are finite.

## Local verification

Use Supabase CLI 3 (`npx --yes supabase@3.2.0 start`) with a working Docker-compatible daemon. The checked-in configuration uses API port 54331 (to avoid common local conflicts), PostgreSQL 17 and `local_smtp` (Mailpit) for captured test emails. Local SMTP frequency is relaxed for controlled tests; application limits still apply.

For a smaller test stack:

```sh
npx --yes supabase@3.2.0 start --exclude realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
```

Local credentials are shown by `supabase status`; copy them into `.env.local`, not into source control or shared logs. Captured verification/recovery emails are available at `http://127.0.0.1:54324`. Set `EMAIL_SEND_ENABLED=false` while exercising contact failures so no external message is sent.

```sh
npm run dev
npm run typecheck
npm run lint
npm test
TEST_DATABASE_URL=postgresql://127.0.0.1:55439/postgres npm run test:db
```

The database test script creates and drops only its own disposable database. It covers real PostgreSQL RLS, two-customer isolation, protected RPC grants, request duplicates, history, unconfigured availability, contact recipient/Reply-To, queue claims and existing booking operations. Unit tests exercise validation and the provider adapter with mocked network responses; they do not establish external email delivery.

The focused connected test script requires a running local app and local Supabase; it refuses a non-local backend. Run `npm run test:connected` after configuration. Test accounts use `.test` email addresses and captured local mail only. Do not run the connected test suite against production.

Build the deployable server package with `npm run build:cpanel`. Use the production `NEXT_PUBLIC_*` values when building a deployment, rather than the local test values. Set production server environment variables and apply migrations before restarting the cPanel Node application. A build passing without credentials does not establish that external Supabase or Resend is connected.


## Verification recorded on 22 November 2026

- Production build and TypeScript checks passed; ESLint passed; all 27 unit tests passed.
- Real PostgreSQL tests passed for migrations, RLS, customer isolation, protected fields/RPC grants, duplicate requests, contact persistence/recipient/Reply-To, queue claims and the existing booking operations.
- The connected HTTP integration suite passed against real local Supabase Auth/PostgREST, including registration, captured verification emails, resend cooldown, password recovery/reset, login/logout, restored sessions, protected pages, refresh persistence, profile/address changes, concurrent duplicate submissions and ownership/role/status tampering rejection. It also passed against the production build.
- Missing email configuration produced a saved contact message and a traceable failed forwarding job addressed to `rose.cleaning.uk@icloud.com`, with the customer as Reply-To. Provider acceptance/rejection/timeout behaviour was tested using a mocked Resend transport. No live Resend message or iCloud delivery was verified.
- Browser bundles were checked for the service-role key and APP_SECRET; neither was present. The canonical host redirect and callback no-store/no-referrer headers were verified. Exclude callback query strings from hosting access logs as well; Next development logging already excludes this route.
- The login page was opened and visually inspected. Dashboard and mobile visual inspection remains pending because computer control could no longer access the Chrome window. Responsive dashboard styles are implemented, but this visual check is not claimed as passed.

The local production preview is running at `http://localhost:3000`. Controlled test credentials are saved privately in `.local/customer-stage/preview-account.json` (never committed). The preview runs from `/Users/samsamaei/.cache/rose-customer-stage-2026-11-22/preview` to avoid intermittent iCloud filesystem delays in the workspace. Implementation files are saved in the Rose project. Local Supabase runs in the isolated Colima profile `rose-test`; this does not configure the production site.

Production still requires the actual Supabase project keys, migrated database, Auth URL/confirmation/SMTP settings, production APP_SECRET, Resend key and verified EMAIL_FROM, with sending explicitly enabled. Use the production public environment values when building the cPanel deployment.
