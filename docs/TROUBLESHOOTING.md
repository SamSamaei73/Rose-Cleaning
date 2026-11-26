# Production troubleshooting

| Symptom | First checks and recovery |
| --- | --- |
| No deployment after a push | Feature branches run PR validation only. Merge the passing PR into protected `main`; inspect the `Validate and deploy Rose` workflow. |
| Validation fails | Read the first failed step and its artifact. Use Node 22 and `npm ci`; `.npmrc` deliberately uses normal peer dependency resolution. Do not deploy the failed artifact. |
| SSH fails | Confirm the dedicated Actions key, `roseclea@s98.lon.krystal.io:722`, restricted authorized-key entry and exact pinned ED25519 identity. Never disable strict host checking. Follow up through Krystal ticket 72384945 for a provider-side change. |
| Host key changes | Stop deployment and obtain independent confirmation from Krystal before changing the known-hosts variable. A new scan alone is insufficient. |
| Health shows an old commit | Inspect the release symlink, `state.json`, Actions upload/activation result and Passenger restart. Check the exact SHA, not just HTTP 200. |
| Readiness fails | Verify connected mode, matching production Supabase URL/public key/server key and schema availability. Keep secrets out of logs. The deployment should restore the previous release. |
| Mail stays in preview despite the runtime file | Inspect cPanel Node selector overrides. Inherited `EMAIL_PROVIDER` and `EMAIL_SEND_ENABLED` take precedence. Both selector and runtime must use `resend`/`true`; restart and test one authorised synthetic notification. |
| Supabase Auth mail fails | Check its separate SMTP configuration and verified sender. Application email settings do not configure Auth SMTP. Check provider acceptance and actual receipt separately. |
| Contact reports saved but not forwarded | Use the submission reference in the staff inbox/outbox. Inspect notification status and provider ID. Failed/uncertain sends must not be retried blindly; check the provider to avoid duplicates. |
| Email link is expired | Request a fresh link and use the browser where the PKCE flow began. Confirm the HTTPS site/callback allowlist. Never copy authentication links into reports. |
| Main-branch browser gate fails after activation | Inspect `production-verification-<run>-<attempt>`. Reproduce the failing journey and use the exact-release rollback workflow when appropriate. |
| Deployment lock remains | Check active Actions/server processes first. Remove only a proven stale deployment-owned lock; never run competing deployments. |
| Local typechecking appears stuck | The workspace is iCloud-backed. Use a separate Git-tree cache snapshot with the same lockfile and Node 22; preserve source and local changes. Linux CI is the release gate. |

Logs: GitHub Actions, `rose-deploy/deployments.jsonl`, `rose-deploy/state.json`, and `rose-app/stderr.log`. Do not paste full runtime environments, cookies, private email links, credentials or customer records into support tickets. HTTP errors intentionally return safe messages instead of database/provider details.

Preserve the existing Apache HTTPS/apex redirect, ACME paths and Zoho MX records when diagnosing unrelated issues. The authoritative zone is in the Krystal client portal, not the cPanel mail zone.
