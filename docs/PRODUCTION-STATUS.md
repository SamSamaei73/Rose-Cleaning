# Rose production status — 26 November 2026

Rose runs on the existing Krystal Ruby account at [https://rosecleaning.uk](https://rosecleaning.uk). Main-branch deployment is active. Production registration, email confirmation, login, recovery, profile/address persistence, cleaning requests, cancellation and real email delivery have been verified with owner-authorised synthetic data.

The exact current source and release are reported by [production health](https://rosecleaning.uk/api/health), the latest successful [deployment run](https://github.com/SamSamaei73/Rose-Cleaning/actions/workflows/deploy.yml), and the server deployment log. Readiness is available at [/api/ready](https://rosecleaning.uk/api/ready). A source build or uploaded artifact alone is not a completed deployment.

## Repository and automation

- [PR #1](https://github.com/SamSamaei73/Rose-Cleaning/pull/1) supplied the existing application and deployment automation, merged as `9f11da0c4acec093c4251394c815d722d2646787`.
- Local documentation commit `d18f74a914d4a69c3af8761da6c3bf512153c29e` was published through the authorised connector with the identical Git tree as `be4c077fbb125eed7e1eeeb77ee2fc0764f33dce`. The original local commit remains preserved. No force-push or overwrite was used.
- [Completion PR #2](https://github.com/SamSamaei73/Rose-Cleaning/pull/2) adds HttpOnly authentication cookies, the live browser gate, preview evidence and the final runbooks. It preserves the existing customer interface and schema.
- Main protection requires a pull request, an up-to-date passing GitHub Actions `validate` check and no administrator bypass. A second reviewer's approval is not required. Force-push and branch deletion are disabled.
- [Validation run 45734094222](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45734094222) passed Linux dependency installation, typecheck, lint, 29 application tests, eight deployment tests, disposable database checks, all 18 existing demo browser journeys and the production build.
- Production deployment and rollback use the existing `production` environment, restricted SSH secret, strict host pin and shared concurrency group. The completion workflow also verifies the exact live revision with 17 public browser journeys after every deployment; the controlled account journey is tested separately with disposable credentials.

## Production verification

| Area | Evidence |
| --- | --- |
| Hosting | Krystal Node 22.23.5, existing Passenger root `/home/roseclea/rose-app`, startup `app.js` |
| SSH | Dedicated key matches one `restrict` entry; port 722; independently verified ED25519 pin enforced |
| Runtime secrets | File mode 0600, parent directory 0700; production keys match the intended Supabase project |
| Supabase | `tsnbceddjcdtjvijldpf`; all 15 public tables have RLS; privileged mutation RPCs are unavailable to browser roles |
| Data boundaries | Anonymous private-table reads denied; customer export contains only its own records; staff API denied to customer |
| Storage | No buckets required; current images are static application assets |
| Auth | Real signup/confirmation in Chrome; password login/logout; recovery link callback, password replacement, old-password rejection and recovered login passed |
| Session policy | Shared HttpOnly, Secure-on-HTTPS, SameSite=Lax cookie options for issuance and refresh; controlled live test asserts them |
| Database writes | Synthetic profile, saved address, cleaning request/history and cancellation persisted correctly |
| SMTP | Verified TLS on port 465; authentication status 235; one real test received in the owner's Gmail inbox |
| Auth/transactional delivery | Confirmation, recovery, request receipt and cancellation messages visible in the owner's Gmail inbox; provider reports Delivered |
| Contact forwarding | Synthetic message persisted with reference; provider reports Delivered to the unchanged business iCloud destination; that inbox itself was not opened |
| Domains/assets | HTTPS apex/www redirects, health/readiness, public navigation and all checked assets passed |
| Responsive checks | Live Chrome at 320, 390, 768 and 1440px, mobile navigation/focus, form sizing, reduced motion and script-failure fallback |
| Errors | No application page errors or unexpected same-origin resource failures during the public browser run; 404, expired-link, Origin and access-denial paths verified |
| Rollback | Live Actions release switch and restoration already verified in both directions; see [ROLLBACK.md](ROLLBACK.md) |
| DNS | Zoho MX 10/20/50 unchanged; Resend domain signing verified; no receiving takeover |

## Email issue resolved

The earlier runtime file activation did not override cPanel's inherited `EMAIL_PROVIDER=preview` and `EMAIL_SEND_ENABLED=false`. The live test caught a notification remaining in preview. On 26 November at 01:27 UTC, the existing selector variables were backed up and corrected to `resend`/`true`, then Passenger was restarted through the supported selector. Only the synthetic notification was requeued. Request and cancellation messages arrived at 01:30 UTC; the contact-forwarding provider event also reports delivery. No customer mailing list or real customer address was used.

The restricted sending key remains limited to `rosecleaning.uk`. Supabase Auth uses the same verified sender through its separate SMTP settings. Application notifications use the Resend HTTP adapter and durable outbox. Provider acceptance and delivered/inbox evidence are recorded separately; the UI does not falsely promise delivery.

## Recovery and remaining boundaries

The existing [rollback run](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45645212541) and [restoration run](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45645603689) verified immutable-release selection, Passenger restart and public health. Both releases contained the same application source. This is not a database restore drill. Full Supabase backup/PITR recovery has not been tested; see the explicit backup boundaries in [ROLLBACK.md](ROLLBACK.md). This release applies no migrations or destructive database operations.

PR preview reports and local interactive demo previews are supported. A hosted experimental app under the same cPanel UID would share production filesystem access, so no public hosted preview is claimed. No upgrade, extra service or charge was accepted.

Existing product decisions remain separate from infrastructure: owner/operator onboarding, approved prices, operating capacity, coverage, legal drafts and original imagery. See [OWNER-INPUTS.md](OWNER-INPUTS.md). These were not silently invented or published during deployment work.

Private verification artifacts and the exact-ID synthetic cleanup manifest are in ignored `.local/deployment/final-20261126/`. They include mailbox screenshots, database/security observations, recovery results and server configuration evidence; they are not public GitHub artifacts. Synthetic test data is disposable; customer records must never be removed by a broad cleanup query.

## Next development phase

Use VS Code → feature branch → commit/push → passing PR → merge to main → automatic validation/deployment → live verification. [CI-CD.md](CI-CD.md) describes previews and test boundaries; [DEPLOYMENT.md](DEPLOYMENT.md), [ENVIRONMENT.md](ENVIRONMENT.md), [ROLLBACK.md](ROLLBACK.md) and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) cover operation. Continue with website improvements and product features without rebuilding this infrastructure.
