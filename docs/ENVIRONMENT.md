# Environment reference

Production uses the existing Supabase project `tsnbceddjcdtjvijldpf` at https://tsnbceddjcdtjvijldpf.supabase.co. Never create a replacement project or use another project's credentials to repair this deployment.

| Name | Location | Purpose |
| --- | --- | --- |
| `KRYSTAL_SSH_PRIVATE_KEY` | Encrypted GitHub Actions secret | Dedicated restricted deploy key |
| `KRYSTAL_SSH_KNOWN_HOSTS` | GitHub Actions variable | Verified ED25519 public host identity |
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub variable and private server runtime | Public project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | GitHub variable and private server runtime | Public browser key |
| `APP_MODE` | Server runtime and cPanel selector | `connected` in production |
| `NEXT_PUBLIC_SITE_URL` | Build, server runtime and selector | `https://rosecleaning.uk` |
| `SUPABASE_SERVICE_ROLE_KEY` | Private server runtime only | Privileged server database operations |
| `APP_SECRET` | Private server runtime only | Independent random application signing secret, 32+ characters |
| `EMAIL_PROVIDER` | Server runtime and selector | `resend` in production |
| `EMAIL_SEND_ENABLED` | Server runtime and selector | `true` after verified setup |
| `RESEND_API_KEY` | Private server runtime only | Domain-restricted sending key |
| `EMAIL_FROM` | Private server runtime | `Rose Cleaning <info@rosecleaning.uk>` |
| `CONTACT_TO_EMAIL` | Private server runtime | Existing business enquiry mailbox |
| `CRON_SECRET` | Optional private server runtime | Only needed for an explicitly configured notification scheduler |
| `ROSE_RELEASE_SHA`, `ROSE_RELEASE_ID` | Actions/build metadata | Exact source and immutable release identity |
| `ROSE_EXPECTED_SHA` | Production test environment | Assert the live revision matches the intended release |
| `ROSE_TEST_EMAIL`, `ROSE_TEST_PASSWORD` | Temporary private test environment only | Controlled synthetic account journey; never persistent CI/customer credentials |

The workflow intentionally does not need separate `KRYSTAL_SSH_HOST`, `USER`, `PORT`, `SUPABASE_URL` or `SUPABASE_ANON_KEY` secrets. The reviewed script fixes `s98.lon.krystal.io`, `roseclea`, port 722; public Supabase variables use the application's actual names above. Do not create duplicate secrets.

Runtime file: `/home/roseclea/rose-deploy/shared/production.env`, mode 0600, directory 0700. cPanel's inherited settings override this file. Keep non-secret selector switches synchronized; retain private keys only in the private runtime/secret stores. Restart through the supported Node selector after selector changes and verify the actual application behavior.

Supabase Auth has its own SMTP settings: `smtp.resend.com`, TLS port 465, username `resend`, the restricted sending key as password, and the same verified sender. This is separate from the application's Resend HTTP adapter. Auth Site URL is the HTTPS apex; allowed redirects are `/auth/callback`, `/auth/callback?next=/dashboard`, and `/auth/callback?next=/reset-password`. Email confirmation is on and passwords require at least 12 characters.

Only `NEXT_PUBLIC_*` values intended for browsers may be embedded in the frontend. Never use the service-role key as a publishable key. `.env*`, `.local/`, keys, account fixtures and local verification evidence remain ignored by Git.
