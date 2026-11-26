# Rose production deployment

This runbook describes the repository's GitHub Actions deployment to the existing
Krystal Node application. The pipeline is live: the first production run deployed
commit `9f11da0c4acec093c4251394c815d722d2646787` on 25 November 2026.
See [PRODUCTION-STATUS.md](PRODUCTION-STATUS.md) for current verification and
verification evidence, and [INFRASTRUCTURE-AUDIT.md](INFRASTRUCTURE-AUDIT.md)
for the original audit and support findings.

## Pipeline

`VS Code → feature branch → pull request → main → GitHub Actions → Krystal → https://rosecleaning.uk`

`.github/workflows/deploy.yml` validates pull requests and pushes to `main` using
Node 22 on Ubuntu 24.04. It installs the lockfile, checks TypeScript and lint,
runs application and deployment tests, tests migrations/RLS in disposable
PostgreSQL, runs Chromium journeys, and builds a Linux x64 standalone release.
Deployments depend on every validation step succeeding. Public production
Supabase settings must be present for main-branch builds. Pull requests cannot
deploy and do not receive the SSH key.

The release is identified by `<commit SHA>-<GitHub run ID>-<attempt>`.
`package-release.mjs` includes only runtime files, public assets, and release
metadata. Mac dependencies and local environment files are excluded. Artifacts
have SHA-256 checksums and expire from GitHub after 14 days. Dependencies must be
installed with `npm ci`; changing the lockfile deliberately changes the build.
Official GitHub actions are pinned to inspected commit SHAs.

## One-time activation prerequisites

The SSH key, host pin, production environment, Supabase schema/Auth URLs and
GitHub deployment configuration below have been provisioned. Main now requires a
pull request and an up-to-date passing `validate` check, including for admins.
SMTP and application delivery have been verified; see the status report.
Keep this checklist for recovery or provisioning another authorized environment.

1. Confirm the existing production Supabase project and apply all reviewed
   migrations in order, with a database backup first. Do not reset a production
   database. Production fixtures require explicit owner authorisation, synthetic
   data and a scoped cleanup manifest; the local connected test script must
   never target production. Follow
   [CUSTOMER-SETUP.md](CUSTOMER-SETUP.md) for Auth URLs, verification/recovery,
   owner access and email provider configuration.
2. Enable SSH on the existing Krystal service and authorize the dedicated deploy
   public key, with the owner's approval. Use `restrict` on its
   `authorized_keys` entry where supported (no interactive PTY, forwarding or
   agent forwarding). The deploy key still has the cPanel account's filesystem
   access; protect the repository and revoke the key when no longer needed.
3. Store the independently verified OpenSSH known-hosts line below. Krystal
   support supplied the ED25519 fingerprint in ticket 72384945 on 25 November
   2026; the key presented on port 722 was scanned separately and matched it.
   The deploy script checks that fingerprint and permits only ED25519. A future
   host-key rotation needs independent verification before updating the pin.
4. Provision `/home/roseclea/rose-deploy/shared/production.env` outside the web
   root, with directory mode `0700` and file mode `0600`. It must contain the
   real connected-mode configuration listed below. Keep cPanel variables
   consistent: inherited environment variables take precedence over env files.
5. Add the repository configuration below, then run and inspect the first
   deployment. Krystal confirmed Passenger restart, same-account release
   symlinks, tar extraction and loopback preflight support in ticket 72384945;
   these operations have been verified with this application on the host.
6. Verify the public health/readiness endpoints, actual site in Chrome,
   navigation, assets, mobile layouts, login and a controlled customer request.
   Verify email provider acceptance and delivery separately. A passing build or
   database readiness check does not prove email delivery or customer login.

GitHub repository settings:

| Name | Storage | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Actions variable | Production Supabase URL, embedded at build time |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Actions variable | Public browser key; never use the service-role key here |
| `KRYSTAL_SSH_KNOWN_HOSTS` | Actions variable | Independently verified host key, including port 722 |
| `KRYSTAL_SSH_PRIVATE_KEY` | Encrypted Actions secret | Dedicated deployment authentication |

Verified public host identity (not the deployment authentication key):

```text
[s98.lon.krystal.io]:722 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHjj0JbKDtOw/fPHeEuYOYEOtkuVB03+XuC3ViHek+Ph
SHA256:waIsiPHfDkWW+sghHq4tE7U0evykwR19x96jYEM/pAg
```

Set `KRYSTAL_SSH_KNOWN_HOSTS` to only the first line. Host verification remains
strict; never accept an unverified scan or disable the checks. Krystal supports
unattended key-based SSH/SFTP on port 722 but cannot restrict access by source IP.

The workflow uses the `production` GitHub environment and serializes deployment
and rollback jobs in `rose-production`. Configure main-branch protection to
require the `validate` job once the first run exists. Do not grant untrusted
contributors access to workflow changes or production secrets.

Server-only runtime configuration (values are deliberately absent):

```dotenv
APP_MODE=connected
NEXT_PUBLIC_SITE_URL=https://rosecleaning.uk
NEXT_PUBLIC_SUPABASE_URL=<same production URL as the build>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<same public key as the build>
SUPABASE_SERVICE_ROLE_KEY=<production server key>
APP_SECRET=<independent random secret, at least 32 characters>
EMAIL_PROVIDER=resend
EMAIL_SEND_ENABLED=true
RESEND_API_KEY=<production email API key>
EMAIL_FROM=<verified sender>
CONTACT_TO_EMAIL=<confirmed enquiry recipient>
```

Keep sending disabled until the sender and recipient are verified. Never commit
these values, upload them to `public_html`, paste them into support tickets, or
include them in release artifacts. Supabase Auth email also needs its own SMTP
configuration; the application's Resend settings do not configure Auth SMTP.

## Release activation and rollback

The existing Passenger application root remains `/home/roseclea/rose-app`; its
startup file remains `app.js`. Apache's `.htaccess` and ACME `.well-known` paths
are preserved. Versioned releases live under `rose-deploy/releases`; the
deployment-owned `rose-app/current` symlink selects the running release.

`deploy-via-ssh.sh` uses strict host verification on SSH port 722, uploads the
checksummed release, and invokes `deploy-release.mjs` in the existing Node
virtual environment. The server rejects path traversal, environment files,
symlinks in archives, oversized archives, mismatched identities and non-Linux
artifacts. It starts a loopback preflight server before changing the live app.

Activation acquires a filesystem lock, backs up the original startup file and
web root, publishes assets while retaining old hashed chunks, atomically
switches the symlink, and touches Passenger's `tmp/restart.txt`. It verifies
`/api/health` against the exact release and commit and requires `/api/ready` to
confirm connected configuration and database connectivity. These checks use
HTTPS with certificate verification. This minimizes the switch interval but
does not promise zero downtime on shared Passenger hosting.

Failed activation restores the previous release and its public assets and
verifies the restoration. The first activation can restore the legacy startup
file and web-root backup. The script never deletes application databases, mail,
DNS records, old releases or unrelated web-root files. Repeated releases grow
disk usage; prune only reviewed old deployment-owned artifacts after confirming
the active and rollback releases. No automatic destructive cleanup is enabled.

For an intentional rollback, run **Roll back Rose** in GitHub Actions on `main`
and enter an exact previously verified release ID from the deployment log.
Rollback verifies the target and restores the prior selection if verification
fails. Application rollback does not reverse database migrations; use backward
compatible migrations and an independently reviewed recovery plan.

Logs and recovery evidence:

- GitHub Actions logs and deployment summary: validation, release and commit.
- `rose-deploy/deployments.jsonl`: activation, success and rollback events.
- `rose-deploy/state.json`: last verified current and previous release IDs.
- `rose-deploy/legacy`: original startup file and public-root backup.
- `rose-app/stderr.log`: Passenger runtime diagnostics, subject to hosting setup.

If `deploy.lock` remains after a terminated job, inspect Actions and server
processes and verify the active symlink/site before removing only that stale
lock. Do not start a competing release to work around it.

## Future updates from VS Code

1. Pull `main`, create a feature branch, edit the existing application and keep
   credentials in ignored local files.
2. Run `npm ci`, `npm test`, `npm run lint`, `npx next typegen`,
   `npm run typecheck`, `npm run test:e2e` and `npm run build`. Database changes
   also require `npm run test:db` with a disposable PostgreSQL target.
3. Commit and push the feature branch, open a pull request, and resolve failures
   in the required `validate` job before merging.
4. A merge/push to `main` builds and deploys
   automatically. Inspect the deployment summary and the actual production
   site; `/api/health` must report that main commit. Verify the changed user
   journey in Chrome after every release.
5. Use the rollback workflow if the release is faulty. Report failures honestly;
   do not equate an uploaded artifact with a verified live release.

For local validation on the iCloud-backed workspace, use an ignored cache
snapshot rather than moving the project or replacing the user's source files.
The validation performed during the infrastructure audit used Node 22.23.2 and
a Git-tree snapshot under `~/.cache/rose-deployment-validation-2026-11-25`.

## Production browser gate and email configuration

The deploy job now runs the read-only production browser suite against the exact
`github.sha`, then uploads its report and screenshots. A failed browser gate makes
the workflow fail; use the rollback workflow if the release needs reverting. The
activation script itself automatically restores the previous release when its
preflight, health or readiness checks fail. These are separate failure paths.

Passenger's inherited variables take precedence over `production.env`. On
26 November the selector still had `EMAIL_PROVIDER=preview` and
`EMAIL_SEND_ENABLED=false`, despite the runtime file being correct. The existing
selector settings were backed up, changed to `resend` and `true`, and restarted
with the supported CloudLinux selector command. Request and cancellation emails
then reached the owner's mailbox. Keep the selector and file consistent after
configuration changes; a health check alone does not test outbound email.

See [CI-CD.md](CI-CD.md) for previews and the live test command,
[ENVIRONMENT.md](ENVIRONMENT.md) for configuration ownership,
[ROLLBACK.md](ROLLBACK.md) for recovery and backup boundaries, and
[TROUBLESHOOTING.md](TROUBLESHOOTING.md) for diagnosis.
