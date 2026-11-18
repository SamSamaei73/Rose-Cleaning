# Official-brand design update

Completed 18 November 2026 in the existing Next.js application. Authentication, database schema/policies, booking calculations, availability, notifications and historical service IDs are unchanged.

## Changes

- Official `img/Logo.jpeg`, copied intact into the public directory. Shared header/footer/auth branding and inherited customer/staff layouts use the complete artwork. Faithful small favicon crops, a multi-size ICO, 192px app icon and 180px Apple touch icon are connected through Next metadata.
- Shared copper, rose-gold, burgundy, near-black and warm-white tokens. Dark hero/footer, restrained metallic button highlights, warm form surfaces, readable status treatments and visible keyboard focus.
- Shorter photographic homepage: three featured services, a single-photo scroll wipe, three request steps, company accordions, sister-business section, FAQs and request/quote actions.
- Fourteen services in five categories, including Wheelie Bin Cleaning. Separate relevant stock photographs, concise descriptions and preselected request/quote destinations. The existing one-off service remains available.
- Quote-only services use the existing persistent enquiry flow; the chosen service is saved in the message and shown in the staff inbox. No migration, new price or promotional offer is introduced.
- Simpler login/registration/recovery layouts. Demo mode visibly disables real credential fields and offers the existing fictional account. Connected authentication handlers are unchanged.
- Mobile navigation closes after following a link and supports Escape. This fixes a pre-existing overlay that could cover controls on the destination page.
- Supplied contact details centralised in `lib/brand.ts`. Displayed domain changed from the earlier `www.roseprofessionalcleaning.co.uk` to `rosecleaning.uk`; hosting, DNS and authentication callbacks were not changed.

## Main files

| Area | Files |
| --- | --- |
| Identity and metadata | `lib/brand.ts`, `components/brand.tsx`, `app/layout.tsx`, `app/{favicon.ico,icon.png,apple-icon.png}`, `public/brand/*`, original `img/Logo.jpeg` |
| Theme/navigation | `app/globals.css`, `components/chrome.tsx`, `components/mobile-nav.tsx` |
| Homepage/services | `app/page.tsx`, `app/services/page.tsx`, `components/public.tsx`, `components/cleaning-reveal.tsx`, `components/service-cards.tsx`, `components/service-catalogue.tsx`, `lib/service-catalogue.ts` |
| Quote entry | `app/contact/page.tsx`, `app/office-quote/page.tsx`, `components/contact-form.tsx` |
| Account presentation | `components/auth-form.tsx`, `app/dashboard/page.tsx`, `components/booking-list.tsx`, `components/booking-flow.tsx` (button decoration only) |
| Photography | `public/images/photography/*`, `docs/PHOTOGRAPHY.md` |
| Handoff | `README.md`, `.env.example`, `docs/ASSETS.md`, `docs/OWNER-INPUTS.md`, `docs/VERIFICATION.md`, this record; `.gitignore` excludes local design-tool context |

No packages, pricing fixtures, migrations, API handlers or server integrations changed.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed, no errors/warnings |
| `npm run build` | Passed; production build and route generation |
| Existing Playwright journey (`npm run test:e2e -- --grep 'public request draft survives'`) | Passed: draft preservation, demo sign-in, submission, staff confirmation, customer status/history and account export |
| Focused Chrome design smoke | Passed at 1440px and 375px: all 14 photographs/categories, mobile navigation, auth switching, booking preselection, customer/staff entry/settings, no horizontal page overflow or JavaScript errors |
| New quote destination | Mobile Car Wash preselected, submitted with fictional details, saved with service context in the staff inbox; truthful no-email result |
| Official artwork | Served `/brand/Logo.jpeg` SHA-256 matches the original source bytes |
| Icons | ICO, 16/32/48px PNGs, 192px app icon and 180px Apple icon return 200; a visible Chrome production tab naturally requested `/brand/favicon-32.png` with HTTP 200 |
| Wipe reveal | Observed 44.48% scroll position and complete clean state. Reduced motion and JavaScript-disabled page immediately show the final clean image |
| Keyboard | Skip link receives focus with a visible 3px outline; native buttons/accordions and labelled fields preserved |
| Production smoke | Homepage, services, login, signup and office quote render at 375px without overflow; office service preselection retained |
| `git diff --check` | Passed |

Genuine rendered Chrome screenshots were visually reviewed. Local, ignored review artefacts are in `.local/redesign-qa/`:

- `home-desktop.png`, `home-mobile.png`
- `services-desktop.png`, `services-mobile.png`, `services-outdoor.png`
- `login-desktop.png`, `login-mobile.png`, `signup-mobile.png`
- `cleaning-reveal.png`, `reduced-motion-mobile.png`
- Customer/staff overview, request-entry, quote and settings screenshots

The focused script/results are also there (`check.mjs`, `report.json`). Native computer-use capture of Chrome's tab strip was unavailable (`cgWindowNotFound`); favicon loading was verified from the visible browser's own request and by inspecting the derived image. Page screenshots use real Chrome through Playwright.

Hosted Supabase signup, verification/recovery email and live Resend delivery were **not** retested: external credentials were unavailable. The existing demo backend was explicitly selected. No real messages, payments, deployments or pushes were made. Broad pricing/database suites were not rerun for this design update.

## Preview and remaining inputs

The production preview runs at `http://localhost:3005` in explicit demo mode. Restart it with:

```sh
npm run build
APP_MODE=demo NEXT_PUBLIC_SITE_URL=http://localhost:3005 npm run start -- --port 3005
```

For development use `NEXT_PUBLIC_SITE_URL=http://localhost:3005 npm run dev:demo -- --port 3005` instead.

The actual services poster image and Rose Removals white van photograph were absent. Catalogue details follow the owner's transcription. Current wheelie-bin photography shows bins; an owner photograph of washing would improve that card. Stock sources/licences are in `PHOTOGRAPHY.md`. Final prices, scope/options, operating areas/windows/capacity and policies still need owner approval as listed in `OWNER-INPUTS.md`.
