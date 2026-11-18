# Verification record

Verified on 18 November 2026, using Node.js 22.23.2, Next.js 16.4.6, Vitest 5.1.1, Playwright 1.65.1, installed Google Chrome and an isolated PostgreSQL 16 server. The final browser suite ran against `next start`, not just the development server.

## Results

| Check                           | Result                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run lint`                  | Passed; no errors or warnings                                                      |
| `npm run typecheck`             | Passed                                                                             |
| `npm test`                      | 21 tests passed across 3 files                                                     |
| `npm run test:db`               | Passed, including two competing database transactions                              |
| `npm run build`                 | Passed; all public, customer, staff and API routes compiled                        |
| `npm run test:e2e`              | 7 browser tests passed against the production demo server                          |
| `node scripts/visual-check.mjs` | Passed: no page exceptions, no calendar/staff overflow, keyboard skip link focused |
| `npm audit --omit=dev`          | 0 reported production dependency vulnerabilities                                   |

The full dependency audit reports 15 high-severity package entries, all stemming from the same development-only `picomatch` ReDoS advisory, [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf). The published latest version checked was 4.0.7, which is included in the advisory; no patched release was available. These packages are used by local lint/test tooling, not the deployed application dependency set. Recheck before upgrades. Vitest and Vite were updated to remove the other fixable test-tooling findings; no critical findings remain in the full audit.

## Behaviour exercised

The browser suite uses explicit demo mode and fresh, isolated browser contexts with fictional details:

1. Visitor chooses postcode, household service, property, extra, date and arrival window; a draft survives the sign-in boundary; submission shows pending confirmation; staff confirms; the customer sees confirmed status and the real event history.
2. API rejects client totals and altered reviewed quotes; retries create one request and one notification per event; another workspace cannot read/change the request; customers cannot confirm requests or edit staff settings; a foreign Origin is rejected. Saving a new demo pricing version changes new estimates while preserving the existing request's quote, and duplicate version names are rejected.
3. A staff proposal leaves the existing arrangement unchanged until customer acceptance. Acceptance applies the new time/quote; cancellation changes status and releases the visit.
4. A public contact enquiry persists in the staff inbox without claiming email delivery.
5. Public pages, mobile navigation and progressive booking controls render without document overflow at 375 px.
6. Profile and address changes persist, export contains the owned records, duplicate deletion requests are prevented, staff review status appears to the customer, and the interface says that records remain.
7. An office quote reaches the staff inbox and all staff routes fit a 375 px viewport.

Unit tests cover integer-pence fixtures, missing/unapproved pricing, extras and adjustments, quote signing and tampering, validation, status permissions, UK dates, daylight-saving boundaries, lead time, working days, capacity and held alternative reservations.

The database harness applies all three migrations and the safe seed to a newly created disposable database. It exercises actual PostgreSQL RLS and privileges for anonymous, customer and staff roles; private notes/outbox isolation; protected staff membership; stale pricing rejection; submission/confirmation idempotency; distinct notification event types; status changes; proposal acceptance; reservation release; named-cleaner conflicts; and a race in which exactly one competing confirmation wins. It drops that database afterwards.

## Visual review

Screenshots were inspected at desktop 1440 px and mobile 375 px: the full homepage, booking calendar, customer request details and staff request details. Long addresses wrap; form controls and actions remain visible; the mobile cost summary does not cover controls. The provisional logo is separate from the original lightweight SVG interior illustration. The absent Rose Removals van remains an explicitly labelled placeholder.

Local screenshots can be regenerated under `.local/qa`. They contain fictional demo data only and are intentionally excluded from Git.

## Connected-mode limits

A second production process was checked with `APP_MODE=connected` and no credentials. Public pages rendered without a demo indicator, protected account/staff pages led to setup guidance, `/book` explained configuration requirements, `/api/demo` returned 404 and an unconfigured estimate request returned 503. There was no silent fallback to sample data.

**No configured Supabase Auth, hosted PostgREST integration, real verification/recovery/magic-link delivery or Resend delivery was tested.** No Supabase/Resend credentials were available and the local Docker daemon needed for the full Supabase stack was unavailable. The PostgreSQL harness is not a substitute for a final connected Auth/browser test. Complete that test with controlled accounts after configuration, including the actual email templates and redirect allow-list.

Account deletion is a persistent request and manual review workflow, not automatic erasure. Retention policy and owner-approved fulfilment rules are still needed. Actual London service coverage, operational windows/capacity, final prices, legal policies and source images remain owner inputs; see [OWNER-INPUTS.md](OWNER-INPUTS.md).

No real customer messages, payments, remote pushes, hosting registration or deployment were performed.
