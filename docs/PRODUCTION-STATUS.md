# Rose production status — 25 November 2026

The customer application and automatic deployment pipeline are live at
[rosecleaning.uk](https://rosecleaning.uk). Email sending and a complete production
customer journey remain unfinished. A passing readiness check proves the current
schema can be reached; it does not prove customer sign-in or email delivery.

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
| Desktop Chrome inspection | Homepage, supplied About copy and connected login form verified; no application console errors observed |
| Successful production customer sign-in/request | Not yet verified; no controlled production account exists |
| Email acceptance and delivery | Not verified; sending remains disabled |

The current browser viewport override did not change Chrome's measured width.
Fresh mobile visual inspection on the actual domain is therefore not claimed.
The Linux responsive browser suite passed, and the initial-host audit separately
recorded a successful 390px mobile inspection before this customer release.

Local verification evidence is in ignored `.local/deployment/`, including
`public-verification-20261125.json`, desktop captures and the initialization plan.
Production evidence lives in `rose-deploy/deployments.jsonl` and `state.json`.

## Remaining access and email work

- Krystal's authoritative DNS editor requests password re-verification. The
  browser handoff is prepared. No additional DNS or email-routing changes were
  made during this follow-up.
- Resend is signed in and its `rosecleaning.uk` domain setup is awaiting DNS
  verification. Its requested DKIM and sending CNAME records are absent from
  public DNS. Receiving is disabled. Preserve Zoho MX and all existing records
  when adding the reviewed sending records.
- The runtime still has `EMAIL_PROVIDER=preview` and `EMAIL_SEND_ENABLED=false`;
  no Resend API key or verified sender is configured. Finish domain verification,
  obtain the required approval for a scoped sending key, configure the server
  and Supabase Auth SMTP, then verify acceptance and delivery separately.
- Complete controlled signup, verification, login, recovery, dashboard, request
  and contact-forwarding checks after the account/email setup is available.
  Obtain the owner's approval for production test records; do not run the local
  connected-test suite against production or delete production data unapproved.
- Owner-approved prices, coverage, operating capacity, policies and source
  imagery remain the separate product inputs in [OWNER-INPUTS.md](OWNER-INPUTS.md).

## Future updates

Work on a feature branch from current `main`, run the relevant checks and open a
pull request. After validation succeeds, merging to `main` builds and deploys
automatically. Compare the live health revision with the merge commit and verify
the changed journey. Use **Roll back Rose** with an exact previously verified
release ID when recovery is needed. The complete commands, secret names, release
layout and recovery procedures are in [DEPLOYMENT.md](DEPLOYMENT.md).
