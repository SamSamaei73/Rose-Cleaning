# Rose production status — 25 November 2026

The customer application and automatic deployment pipeline are live at
[rosecleaning.uk](https://rosecleaning.uk). Resend sending and Supabase Auth SMTP
are configured. Live email delivery and the complete production customer journey
remain unverified. A passing readiness check proves the current schema can be
reached; it does not prove customer sign-in or email delivery.

## Infrastructure and activation

The existing Krystal Ruby shared-hosting account remains in use. Its Passenger
application runs Node 22.23.5 at `/home/roseclea/rose-app`, with startup file
`app.js`. No hosting upgrade, replacement infrastructure or paid service was
purchased. Inbound mail continues to use the three existing Zoho MX records.

[PR #1](https://github.com/SamSamaei73/Rose-Cleaning/pull/1) merged the customer
workflows, supplied About content and deployment automation into `main` as
`9f11da0c4acec093c4251394c815d722d2646787`.

[GitHub Actions run 45638451621](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45638451621)
completed validation and deployment successfully on both attempts:

| Attempt | Verified release |
| --- | --- |
| 1 | `9f11da0c4acec093c4251394c815d722d2646787-45638451621-1` |
| 2 | `9f11da0c4acec093c4251394c815d722d2646787-45638451621-2` |

The `main` branch protection rule is active. It requires a pull request, an
up-to-date passing GitHub Actions `validate` check and no administrator bypass.
The owner completed GitHub's access confirmation and the saved rule was verified
in repository settings. Reviewer approval is not required for this single-owner
workflow; failing validation still blocks merging and deployment.

Each release was built on Linux, uploaded with a checksum, preflighted on the
server, activated through the deployment-owned symlink and verified through
public HTTPS health/readiness endpoints. The server retains the legacy backup,
immutable release directories and deployment log outside the public web root.

The live rollback exercise also passed. Workflow run
[45645212541](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45645212541)
restored attempt 1 from attempt 2, and run
[45645603689](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45645603689)
restored attempt 2. Public health confirmed the selected release after each
switch. Final state records attempt 2 as current and attempt 1 as previous,
verified at 15:29:15 UTC. A fresh public smoke check passed after restoration.
Both releases contain the same reviewed source commit; this verifies release
switching and Passenger restart, not database rollback. The Apache configuration
checksum and private runtime-file permissions were unchanged.

SSH is enabled and the dedicated key is authorized with `restrict`. Its private
key is stored in the encrypted GitHub Actions secret. The server ED25519 identity
is pinned to the fingerprint independently confirmed in Krystal support ticket
72384945. Strict host checks remain enabled. See the original
[infrastructure audit](INFRASTRUCTURE-AUDIT.md) for support correspondence and the
confirmed Passenger, symlink, SFTP, tar and loopback capabilities.

## Supabase and secrets

The owner approved production initialization on 25 November. The five reviewed
migrations and safe service seed were applied to the new Rose Cleaning project,
`tsnbceddjcdtjvijldpf`. Verification recorded 15 application tables with RLS,
15 services, protected browser mutation privileges, and the required server RPC.
No customer or booking fixtures were seeded.

The Auth Site URL and three callback destinations use `https://rosecleaning.uk`.
Email confirmation is enabled and the minimum password length is 12 characters.
The Auth settings endpoint confirms email sign-in and signup are enabled.
The production project still had zero users during this follow-up.

Krystal's owner-only `rose-deploy/shared/production.env` contains connected mode,
the application secret and the production Supabase configuration, with mode
`0600`. The server secret is not in GitHub variables, source or release artifacts.
Only the public Supabase URL and publishable key are supplied to browser builds.

## Verification

| Check | Result |
| --- | --- |
| Clean Linux dependency installation | Passed; npm reported zero vulnerabilities |
| TypeScript and ESLint | Passed |
| Application tests | 29 passed |
| Deployment/security/rollback tests | 8 passed in CI; 8 also passed in an isolated directory on Krystal |
| PostgreSQL migrations, RLS and concurrency | Passed against disposable test databases |
| Chromium journeys, including responsive coverage | 18 passed |
| Standalone production build and package | Passed |
| Live GitHub Actions rollback and restoration | Passed in both directions between the two verified releases |
| Live `/api/health` | HTTP 200, matching production commit and release |
| Live `/api/ready` | HTTP 200, `ready` |
| Public route smoke check | Seven routes passed |
| Public homepage asset requests | All 22 distinct image/script/style URLs passed |
| HTTP and www redirects | 301 redirects reach HTTPS apex; path and query preserved |
| Anonymous dashboard | Redirects to login; Chrome follows the streamed Next.js redirect |
| Desktop Chrome inspection | Homepage, supplied About copy and connected login form verified; see the console limitation below |
| Successful production customer sign-in/request | Not yet verified; no controlled production account exists |
| Email acceptance and delivery | Not yet verified; runtime sending and Auth SMTP are enabled |
| Resend sending domain | Verified at 15:58 UTC; DKIM and both sending CNAME records passed |
| Encrypted SMTP authentication | Passed against `smtp.resend.com:465`, status 235; certificate verification enabled; no message sent |
| Email runtime activation | Loopback preflight, public health/readiness and the seven-route/22-asset smoke check passed after restart |

During the final tab reattachment, Chrome logged one asynchronous message-channel
error. The message is typical of browser-extension messaging, but its originating
extension was not identified. The production console is not claimed to be fully
silent; the page, assets, health and automated Chromium checks passed.

The current browser viewport override did not change Chrome's measured width.
Fresh mobile visual inspection on the actual domain is therefore not claimed.
The Linux responsive browser suite passed, and the initial-host audit separately
recorded a successful 390px mobile inspection before this customer release.

Local verification evidence is in ignored `.local/deployment/`, including
`public-verification-20261125.json`, desktop captures and the initialization plan.
Production evidence lives in `rose-deploy/deployments.jsonl` and `state.json`.

## Email activation and remaining verification

- Krystal password re-verification completed after the previous verification URL
  returned HTTP 404. Reopening DNS Records through the domain dashboard restored
  the verification flow.
- The authoritative zone now contains the requested `resend._domainkey` TXT,
  `rsend` CNAME to `rsend-euw1.forge.rmta.net`, and `send` CNAME to
  `send.forge.rmta.net`, each with TTL 3600. Krystal's nameserver returned all
  three exact records. Resend reported the domain and all three records verified
  at 15:58 UTC. The original website records and all three Zoho MX records remain
  intact; Resend receiving is disabled. Before/after zone snapshots and the
  verification screenshot are saved in ignored `.local/deployment/`.
- The owner approved the restricted email key. The created key is named
  `Rose production transactional email` and has sending access restricted to
  `rosecleaning.uk`. Its value is stored only in private configuration, not in
  Git or the deployment artifact.
- Supabase custom SMTP is saved and was verified after a page reload: host
  `smtp.resend.com`, port 465, username `resend`, sender name `Rose Cleaning`,
  sender address `info@rosecleaning.uk`, with the stored password hidden. The
  key authenticated successfully over certificate-verified TLS with status 235.
  This proves SMTP authentication, not Supabase message acceptance or delivery.
- At 16:56:23 UTC, Krystal runtime configuration was activated with
  `EMAIL_PROVIDER=resend`, `EMAIL_SEND_ENABLED=true`, the approved key and
  `EMAIL_FROM="Rose Cleaning <info@rosecleaning.uk>"`. The existing enquiry
  recipient remains `rose.cleaning.uk@icloud.com`. Before activation there were
  zero queued, sending or uncertain notifications. A private configuration
  backup was retained, the change used the deployment lock and an atomic file
  replacement, and permissions remain 0600. Loopback preflight and public
  health/readiness passed; Passenger was restarted and the public smoke checks
  passed again. No source release or customer data changed.
- Complete controlled signup, verification, login, recovery, dashboard, request
  and contact-forwarding checks. Approval has been requested for one clearly
  labelled TEST account, one unassigned TEST request and one TEST contact
  message, with emails only to the business iCloud address. These records have
  not been created. Do not run the local connected-test suite against production
  or delete production data unapproved. Verify provider acceptance, recipient
  delivery and the authenticated customer journey separately.
- Owner-approved prices, coverage, operating capacity, policies and source
  imagery remain the separate product inputs in [OWNER-INPUTS.md](OWNER-INPUTS.md).

## Future updates

Work on a feature branch from current `main`, run the relevant checks and open a
pull request. After validation succeeds, merging to `main` builds and deploys
automatically. Compare the live health revision with the merge commit and verify
the changed journey. Use **Roll back Rose** with an exact previously verified
release ID when recovery is needed. The complete commands, secret names, release
layout and recovery procedures are in [DEPLOYMENT.md](DEPLOYMENT.md).
