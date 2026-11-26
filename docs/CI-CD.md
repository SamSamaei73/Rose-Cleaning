# CI/CD and preview workflow

Production: https://rosecleaning.uk. Repository: [SamSamaei73/Rose-Cleaning](https://github.com/SamSamaei73/Rose-Cleaning).

1. Open Rose in VS Code and create a feature branch from current `main`.
2. Make changes, commit and push the branch.
3. Open a pull request. GitHub runs `validate`; fix failures before merging.
4. Merge the reviewed change into `main`.
5. GitHub automatically validates, builds, deploys through verified SSH, and tests the live release.
6. The updated website is available at rosecleaning.uk. Its `/api/health` revision must equal the merge commit.

No manual package upload or server dependency installation is needed for routine updates. Branch protection requires a PR and a passing, up-to-date `validate` check, including for administrators; it does not require a second reviewer for this single-owner repository.

## Validation and deployment

[Validate and deploy Rose](https://github.com/SamSamaei73/Rose-Cleaning/actions/workflows/deploy.yml) uses Ubuntu 24.04 and Node 22. It runs `npm ci`, route type generation, TypeScript, ESLint, 29 application tests, eight deployment/security tests, disposable PostgreSQL migration/RLS/concurrency checks and the existing 18 demo browser journeys. It then builds and packages the Linux standalone app.

Only a successful main-branch validation can deploy. PRs and experimental branches never deploy to production. Actions have `contents: read`; checkout does not retain credentials. Actions are pinned to commit SHAs. The production environment and `rose-production` concurrency group serialize deployment and rollback. The deployment key is available only to the production job; server/database/email secrets are excluded from build artifacts.

The server verifies checksums, archive contents, release identity, runtime configuration, loopback startup and public HTTPS health/readiness. Failed activation restores the previous release. After activation, 17 non-mutating production Chrome/Chromium journeys verify release identity, domains, navigation, images, forms, mobile layouts, error states and access boundaries. A failed browser check marks the workflow failed; inspect the report and use [Roll back Rose](https://github.com/SamSamaei73/Rose-Cleaning/actions/workflows/rollback.yml) if required.

Artifacts: the Linux release is retained for 14 days; browser reports/screenshots for seven days. The server keeps immutable releases and its deployment log until deliberate, reviewed pruning. Secrets are never included in artifacts.

## Preview process

Every PR produces a browser preview artifact with the HTML report and screenshots from the isolated demo application. Download `browser-preview-<run>-<attempt>` from its Actions run and open `playwright-report/index.html` locally.

For an interactive preview, check out that PR locally, use Node 22, run `npm ci` and `npm run dev:demo`, then open http://localhost:3000. Demo data stays in the local process; demo email cannot send. This is the supported preview process on the current plan.

A publicly hosted PR preview is **not enabled**. A second Passenger app under the same cPanel account would have filesystem access to production credentials, so it is not a security boundary for experimental code. No additional hosting or Supabase branch was purchased. Keep previews local or in disposable CI until an independently isolated environment is deliberately approved.

## Controlled live account verification

`npm run test:production` has 18 production-safe journeys. Without credentials it skips the one controlled account test; CI deliberately runs the other 17. With explicitly authorised synthetic credentials, set `ROSE_TEST_EMAIL` and `ROSE_TEST_PASSWORD` through a private environment, plus `ROSE_EXPECTED_SHA` for the exact live commit. The synthetic address must contain `+rose-qa-`. Never put these values in a command transcript, GitHub artifact, source file or real customer account.

The account journey signs in, checks HttpOnly/Secure/SameSite cookies, reads its own export, verifies staff denial and mobile profile layout, then signs out. It creates no records or emails. Registration, email links, requests and contact delivery are separately controlled tests with a private fixture manifest and exact-ID cleanup. Never redirect the demo or `test:connected` suite to production: those tests change settings and assume disposable local data.
