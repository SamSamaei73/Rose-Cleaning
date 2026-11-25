# Rose infrastructure audit — 25 November 2026

Status: deployment automation is prepared and locally tested. The existing site
is live, but this work has not yet been deployed. GitHub write access is now
working and the prepared branch is published. Missing production backend
configuration and SSH activation still prevent a verified full release. Krystal
compatibility and host identity are confirmed; Linux CI validation is underway.

## Verified infrastructure

| Area | Observation |
| --- | --- |
| Project | Existing Rose repository; separate from the Medstride workspace |
| Repository | Public `SamSamaei73/Rose-Cleaning`, production branch `main` |
| Starting commit | `95355a83ad7b9e23039d9c34a0f0f93043eca2a3` |
| Existing automation | No GitHub Actions runs or workflows at audit start; main unprotected |
| Application | Next.js 16.4.6 App Router, React 19.3.1, TypeScript 6, Tailwind 4, GSAP |
| Backend | Next route handlers, external Supabase Auth/PostgreSQL, optional Resend email |
| Runtime | Node >=22.13; no Python, Docker or local PostgreSQL needed on Krystal |
| Hosting | Existing Krystal Ruby shared hosting, London, cPanel 134.0.77 |
| Server | `s98.lon.krystal.io`, website IPv4 `185.194.90.35` |
| Node app | Running Node 22.23.5, production mode, app root `rose-app`, startup `app.js` |
| Capacity shown | 25 GB disk, 4 GB physical memory limit, 50 entry processes, 100 process limit |
| Hosting features | Node/Python/Ruby selectors, Git Version Control, cron, SSH key management, backups |
| SSH | Disabled in the existing service at audit time; no authorized deployment key |
| Live frontend | `https://rosecleaning.uk` loads; latest local customer/About changes unpublished |
| Live backend | Login displays missing-backend configuration; required Supabase settings absent |
| TLS | AutoSSL certificate for apex and www expires 20 February 2027; Chrome HTTPS loads |
| HTTPS enforcement | cPanel Force HTTPS Redirect is on; Chrome loads the valid HTTPS site |
| Canonical host | Configured Apache 301 www-to-apex redirect; verified in Chrome with path and query preserved |

The cPanel Node environment contains connected mode, the production site URL,
preview email provider and sending disabled. Production Supabase URL/public key,
service-role key and APP_SECRET are absent. Local Rose environment values target
a loopback Supabase test stack; those are not production credentials. Credentials
from other projects must not be reused.

## DNS and email

Public DNS was verified with `dig`, separately from the cPanel zone editor:

| Record | Public result |
| --- | --- |
| NS | `ns1.kloudns.co.uk` through `ns4.kloudns.co.uk` |
| Apex A | `185.194.90.35` |
| www CNAME | `rosecleaning.uk` |
| MX 10 | `mx.zoho.uk` |
| MX 20 | `mx2.zoho.uk` |
| MX 50 | `mx3.zoho.uk` |
| Apex TXT | Zoho verification present |
| `_dmarc` TXT | No answer returned at audit time |

The cPanel zone shows different Krystal mail records and is not the public
authoritative zone. Do not copy that zone over the active Zoho mail records.
Authoritative DNS management in the Krystal client portal requires password
re-verification. No DNS, mail routing or nameservers were changed.

AutoSSL reports failures for auxiliary mail/control-panel names lacking public
addresses. This does not invalidate the working apex/www certificate. The
correct treatment of those auxiliary names is included in the support request;
no speculative DNS fixes were applied. The cPanel HTTPS switch was verified on.
The saved Apache configuration now also contains explicit HTTPS enforcement and
a separate canonical host rule. Chrome navigation from HTTPS www to apex and
from HTTP www to HTTPS apex succeeded, preserving paths and query strings.
An independent response-header check was unavailable because terminal HTTP
access was rejected by automatic approval review.

The cPanel redirect form initially combined the www condition with an existing
HTTP-only condition. That was corrected in the File Manager editor while
preserving the Passenger/PHP blocks. The previous file was downloaded locally
before correction. No application bundle, DNS or email configuration was changed.

## Validation completed locally

- 29 application unit tests and 8 deployment/rollback tests passed. The two
  additional SSH tests verify strict ED25519 use and rejection of malformed,
  different or additional host keys before any network connection.
- TypeScript, lint and deployment shell syntax passed.
- Disposable PostgreSQL tests passed for migrations, RLS, ownership, permissions,
  idempotency, version checks, transitions and competing booking confirmations.
- Browser suite: 14 of 18 passed initially. The four failures were resolved by
  restoring selected-service feedback, preserving heading style and updating
  stale About/dashboard assertions; all four passed on the targeted rerun.
- Next production standalone build passed without warnings after replacing a
  cache-only dependency symlink with local dependency files.
- Staged changes were checked for local secret values/private key blocks; none
  were found. Local secrets and deployment keys remain ignored.
- Existing production homepage: 17 inspected images loaded, no application
  console errors observed, 390px layout had no horizontal overflow, and the
  mobile menu opened. Production login remains disabled by missing configuration.

The standalone server also started locally: `/api/health`, `/about` and the logo
returned HTTP 200. `/api/ready` correctly returned HTTP 503 with no production
credentials, confirming that activation will fail closed before replacing the
live application.

These checks do not prove a Linux artifact or the unpublished release works on
the real Passenger host. GitHub validation and first production activation
remain separate completion conditions. Terminal `git push` was rejected by
automatic approval review, so publication used the GitHub connector after its
repository grant was corrected. Branch `codex/krystal-deployment-20261125` is now
published and [draft PR #1](https://github.com/SamSamaei73/Rose-Cleaning/pull/1)
is open. GitHub publication commit `1befa189ae5ea5ae06837e5596b45de4f236ebe6`
has exactly the same Git tree as local commit
`60a38ca8a2d67474942af5156e61e82c1169805f`; the existing local history is preserved.

The [first Linux run](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45604254788)
correctly blocked deployment at `npm ci`: the previous lockfile had been resolved
with the local user's global `legacy-peer-deps=true`, while CI uses normal peer
resolution. The lockfile was regenerated with the runner's npm 10.9.9 and normal
peer resolution, preserving dependency versions while correcting `picomatch`
placement. Repository `.npmrc` now explicitly selects `legacy-peer-deps=false`
without changing the user's global npm settings. Linux validation must pass on
the repaired commit before activation.

## Support and access

Krystal support ticket **72384945** was submitted through the authenticated
portal: “Rose CI/CD: SSH host key, Passenger restart and DNS authority”. Replies
were submitted with the public Zoho MX findings and an SSH follow-up at 01:52.
Support replied at 10:42 on 25 November 2026. View the ticket in the authenticated
[Krystal support portal](https://krystal.io/client/supporttickets.php).

The request asks about unattended GitHub Actions SSH/SFTP on port 722, verified
SSH host keys, Passenger restart via `tmp/restart.txt`, same-account release
symlinks, CageFS/tar/loopback preflight support, authoritative DNS and auxiliary
AutoSSL failures. It expressly requests no paid upgrades or DNS/email changes.

Krystal confirmed unattended key-based SSH/SFTP on port 722, Passenger restart
via `tmp/restart.txt`, same-account symlinks, tar extraction and short-lived
loopback checks under CageFS. Source-IP restrictions are unavailable. Application
operation still requires our own verification; no replacement hosting is needed
based on these stated capabilities. Authoritative DNS is managed through the
client area's domain management, not the cPanel zone. The proposed optional
auxiliary A records were not added; apex/www SSL and Zoho MX were preserved.

Support independently supplied the server ED25519 fingerprint
`SHA256:waIsiPHfDkWW+sghHq4tE7U0evykwR19x96jYEM/pAg`. A separate port-722
key scan matched it exactly. The verified known-hosts entry is saved locally in
the ignored deployment directory and documented in the runbook. The deployment
script pins this fingerprint and algorithm with strict host checking enabled.

GitHub initially returned HTTP 403 because the Codex Connector was installed only
on a different account. After the user completed GitHub verification and approved
the installation, **SamSamaei73/Rose-Cleaning only** was granted code, Actions and
workflows write access. Publication through the connector succeeded. Supabase is
signed in as the expected GitHub user, but its organizations dashboard shows no
organizations or projects. A focused search of the connected Gmail account also
found no matching Supabase project/invitation messages. The intended production
project has not yet been identified.

Official hosting references:

- [Krystal SSH access](https://help.krystal.io/cpanel-advanced-topics/how-do-i-get-ssh-secure-shell-access)
- [Krystal Node.js setup](https://help.krystal.io/nodejs/node-js-app-setup-guide)
- [Krystal Node.js support scope](https://help.krystal.io/nodejs/node-js-apps)

A dedicated deployment key was generated locally in an ignored directory. Its
public-key fingerprint is `SHA256:kj7oUMTCF0e1MVTERpHFF+8Rf1buXt8Umz/ELWRgyMM`.
It has not been authorized on Krystal or saved in GitHub. Enabling this new
access awaits the requested action-time confirmation. No private key is in
source control, documentation or a support message.

## Completion conditions

- Obtain approval to enable SSH and authorize the deployment key, then verify
  access. Host identity and existing plan capabilities are confirmed; no upgrade
  has been purchased.
- Identify or obtain access to the intended Rose production Supabase project;
  configure its reviewed schema, Auth and runtime keys without exposing secrets.
- Configure and verify outbound email using the existing chosen provider and
  preserve Zoho inbound mail. Do not claim message delivery from a saved form.
- Finish Linux CI, provision runtime configuration and encrypted deploy secret,
  activate the pipeline and require successful validation for main.
- Verify the deployed commit, HTTPS, canonical redirects, assets, responsive
  layouts, browser errors, accounts and backend requests on the actual domain.
- Confirm rollback on the real Passenger host. Local rollback tests are not a
  substitute for this first-host verification.

See [DEPLOYMENT.md](DEPLOYMENT.md) for workflow files, required repository
configuration, release layout, logs, rollback and future VS Code updates.
