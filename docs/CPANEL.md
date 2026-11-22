# Deploy Rose to cPanel

Run `npm run build:cpanel` from the source project to create the visible
`build/rose-cpanel.zip` archive and `build/rose-cpanel/` folder. The ZIP contains
the compiled application, public images, browser assets, a production dependency
lockfile and the `app.js` startup file. Local credentials and Mac dependencies
are excluded. Install dependencies on the hosting server.

The build also creates `build/rose-public-html.zip` and `build/public_html/`.
Extract this second ZIP into cPanel's `public_html` directory to serve the images
and `_next/static` browser assets directly from Apache. The server application
remains in `rose-app`, connected to the domain by cPanel's Passenger settings.
Keep the complete `rose-cpanel.zip` archive outside the public web root.

## Hosting settings

This application needs **Setup Node.js App** or **Application Manager** and
Node.js **22.13 or later**. Use the available Node 22 release. Account sessions,
bookings and enquiries require a running server.

1. Upload the ZIP to a dedicated directory outside `public_html`, for example
   `/home/YOUR_CPANEL_USER/rose-app`, and extract it. `app.js` and `package.json`
   must be directly inside `rose-app`.
2. In **Setup Node.js App**, select Node 22, **Production** mode, application
   root `rose-app`, your domain at the root URL `/`, and startup file `app.js`.
3. Add the environment variables below, save, then select **Run NPM Install**.
   This installs Linux dependencies. No build needs to run on cPanel. From a
   terminal in the application's Node environment, use `npm ci --omit=dev`.
4. Restart the application. Back up existing web-root files before replacing or
   moving them; a static `index.html` may take precedence over Passenger routing.
5. Verify HTTPS, `/`, `/services`, images, `/login` and bookings on the actual
   domain. Mount this build at `/`; a subdirectory needs a separate `basePath`.

Hosting controls are described by [cPanel](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)
and [CloudLinux](https://docs.cloudlinux.com/cloudlinuxos/cloudlinux_os_components/#node-js-selector).

## Environment and backend

Set these in the application's cPanel environment settings:

```text
APP_MODE=connected
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
EMAIL_PROVIDER=preview
EMAIL_SEND_ENABLED=false
```

Working accounts, bookings and enquiry storage also require:

```text
NEXT_PUBLIC_SUPABASE_URL=<your project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service-role key>
APP_SECRET=<a random secret of at least 32 characters>
```

Generate the application secret with `openssl rand -hex 32`. Keep secret keys
out of `NEXT_PUBLIC_` variables, public directories and deployment archives.
Apply the source project's reviewed `supabase/migrations` and safe seed, then
configure Supabase's site URL and `/auth/callback` redirect for the live domain.
The source README covers authentication, pricing approval and operations setup.

Without Supabase settings the public pages load, but account and booking
operations are unavailable and enquiry forms cannot save submissions. Deploying
files does not create a database, email account, approved pricing or legal
policies. Keep `APP_MODE=connected`; demo mode stores temporary fictional data
and is intended for local preview only.

This package is built without Supabase credentials. Set server variables in
cPanel and restart. When making a later build with `NEXT_PUBLIC_` values defined,
Next.js can embed them during compilation. Build with the intended production
values and rebuild when those values change. See [Next.js environment guidance](https://nextjs.org/docs/app/guides/self-hosting#environment-variables).

## Updating and rollback

Build and test a fresh archive locally. Back up the deployed application and
web-root configuration outside `public_html`, upload to a separate release
directory, install dependencies, then switch the application root and restart.
Keep cPanel environment settings separate from release files. To roll back,
restore the previous application root and web-root files, then restart Passenger.

Correct domain DNS and SSL before using customer accounts. Local package tests
do not verify hosting, DNS, TLS, Supabase or email delivery.
