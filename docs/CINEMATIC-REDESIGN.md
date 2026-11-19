# Cinematic redesign

## Scope and source audit

This is a presentation update to the existing Next.js App Router application. Existing Supabase authentication, RLS, server API handlers, catalogue IDs, estimates, scheduling, notifications and request status transitions remain unchanged. No migrations or new rates were introduced.

The audit covered all public routes, authentication screens, customer and staff layouts, shared request forms, server integrations, operational catalogue, image inventory and existing tests. Fourteen advertised services remain in `lib/service-catalogue.ts`; the operational household services, including one-off cleaning, retain their existing IDs and booking relationships.

The existing transparent derivative of the approved `img/Logo.jpeg` is retained, together with all current favicons. The exact `:root` and Tailwind theme values in `app/globals.css` are unchanged. All new presentation rules use those tokens; `app/cinematic.css` introduces no new hex colour values.

## Reference and interpretation

The reference was [the Delta Cafés product-page inspiration](https://www.awwwards.com/inspiration/product-page-delta-cafes-the-home-of-coffee). Its [23-second reference recording](https://assets.awwwards.com/awards/element/2026/09/6aba997a556d3677262596.mp4) was inspected. The recording shows scene changes, substantial shifts of scale, persistent navigation, large imagery and an asymmetric preparation sequence. Live behaviour and its mobile implementation could not be inspected reliably, so no claim is made to replicate its exact timings or implementation.

Rose adapts that editorial rhythm to real cleaning imagery and its own existing identity. No coffee content, colours, imagery or products are copied. No unsupported reviews, statistics, qualifications or operational guarantees were added.

## Section map

| Existing section/route | New treatment | Preserved purpose |
| --- | --- | --- |
| Shared header | Transparent homepage overlay, fine navigation rules, active-route markers | Official logo, phone, account, booking and accessible mobile menu |
| Homepage hero | Full-viewport existing living-room photograph, oversized type, gentle scroll zoom | Clear cleaning identity and request/service actions |
| Company introduction | Asymmetric editorial statement with short company description | Rose manages its own staff and service |
| Featured services | Three selectable editorial rows beside one large changing photograph | Existing service IDs and request destinations |
| Complete `/services` catalogue | Five category selectors, expandable service descriptions and photographic presentation | All 14 services, office/enquiry destinations, one-off booking link |
| Cleaning reveal | One photograph with a masked haze and a restrained copper edge | An illustrative effect, explicitly not customer before-and-after evidence |
| Request process | Three readable steps beside a short desktop-only pinned image sequence | Choose a service, share details/preferred time, await Rose’s confirmation |
| Company approach | Large masked photograph and concise expandable explanations | Actual communication and service approach |
| Rose Removals | Quiet editorial section and existing honest image placeholder | Sister-business relationship, no invented cleaning fleet |
| FAQ | Two-column editorial heading and native accordions | Pricing, request status, area and free-account information |
| Final action and footer | Large closing statement and typographic signature | Request, quote, official logo, all contact/legal/account links |
| `/about` | Editorial introduction, photographic spread and service principles | Known company information only |
| `/contact`, `/office-quote` | Photo/contact column next to a calm form surface | Existing validation, service preselection and persistent submission handlers |
| Auth/customer/staff pages | Refined shared navigation, spacing, headings, buttons and active sidebar states | Existing authentication, account and operations interfaces |

All photographs are existing local licensed WebP assets; sources remain in `PHOTOGRAPHY.md`. No video assets were supplied, so the cinematic hero uses photography and has no autoplay media dependency.

## Implementation

- `components/cinematic-motion.tsx` dynamically imports GSAP 3.15.1 and ScrollTrigger on Home/About only for visitors who allow motion. Catalogue and enquiry pages use CSS interactions without importing the animation runtime. Effects are scoped to the mounted page and reverted on navigation, viewport changes and preference changes.
- Native scrolling is retained. There is no Lenis, wheel interception, WebGL or React state update on every scroll frame.
- Hero movement is a transform; image masks and the wipe follow scroll progress. Below-fold text reveals run once. Essential controls sit outside decorative effects.
- Pinning is restricted to screens at least 1000px wide and 650px high. The process photograph pins only for the height of the three normal-flow steps, with no artificial extra scrolling space. A visible link skips the story.
- Phones have no pinned sequence and the wipe uses a simple translucent layer without backdrop blur. Reduced-motion visitors see the clean static image and unanimated, readable content. Preference changes dismantle active triggers.
- Content is visible before animation initialises. Failed enhancement-script downloads leave static content intact once Next.js's inline streaming bootstrap has assembled the response. The existing App Router loading boundary and interactive forms still require JavaScript; this is not a new full no-JavaScript application mode. Images retain stable aspect ratios and responsive Next.js delivery. The hero gets eager/high-priority loading; the above-fold contact image is eager without high priority.
- Forms are not animated. Staff/customer actions still use the original handlers and role checks.

## Local review

```sh
npm ci
NEXT_PUBLIC_SITE_URL=http://localhost:3005 npm run dev:demo -- --port 3005
```

Open `http://localhost:3005`. To capture real Chrome/Chromium screenshots and check responsive overflow, keyboard entry, mobile Escape behaviour, icon loading and reduced motion:

```sh
node scripts/cinematic-check.mjs
```

Captures and the machine-readable report are written to ignored `.local/cinematic-qa/`. The script requires the visible demo indicator. It does not send messages or create real accounts.

The focused browser tests in `tests/e2e/cinematic.spec.ts` verify catalogue destinations, an enquiry from a selected service, scroll progression, pin cleanup, navigation, preference changes and readable content when downloaded enhancement scripts fail. The existing browser suite still covers the customer request/staff confirmation journey and important business protections. Its image check now scrolls lazy-loaded images into view before asserting successful loading, rather than expecting below-fold assets to load immediately.

## Verification record

Verified on 19 November 2026:

- `npm run lint`: passed.
- `npm run typecheck`: passed, as did the production build's TypeScript check.
- `npm test`: 21 tests passed across the three existing unit suites.
- `npm run build`: passed with all existing public, account, staff and API routes present.
- `npm run test:e2e`: all 10 tests passed against the production build and explicit isolated demo backend. This includes the three new presentation/fallback checks and all seven existing journey/protection tests.
- Exact theme/root colour-token strings and transparent-logo SHA-256 compared against the starting version: unchanged. The new stylesheet introduces no new hex colours.
- Real Chrome captures at 1440×1000, 820×1180 and 375×812 were inspected. Keyboard skip/focus, mobile-menu Escape, reduced-motion teardown, responsive overflow, logo/favicon endpoints and browser errors were checked by the capture script.

The initial development run encountered macOS iCloud offloading source/cache files mid-run, including generated type files. Final build/browser verification therefore ran from `/tmp/rose-cinematic-preview`, a local copy of the same source. A comparison of 140 application, asset, configuration and test files found no mismatches. The working repository remains the source of truth; no deployment or push occurred.

During verification, a new quote-flow test was corrected to use the existing “Send quote request” button. The image check was corrected to wait for normal lazy loading. A literal JavaScript-disabled test exposed the existing Next.js streaming bootstrap dependency; the final test instead verifies the requested animation-download failure fallback without pretending the entire application is JavaScript-free.

Connected Supabase/Auth and live Resend cannot be verified without supplied credentials; browser journeys use the explicitly identified isolated demo backend. Database schema/RLS and server business code were not changed, and the PostgreSQL suite was not rerun for this presentation update. Production configuration, DNS and deployment settings remain unchanged.

## Changed files

- Public layouts: `app/page.tsx`, `app/about/page.tsx`, `app/services/page.tsx`, `app/contact/page.tsx`, `app/office-quote/page.tsx`, `app/layout.tsx`, `app/cinematic.css`.
- Shared presentation: `components/cinematic-motion.tsx`, `components/cinematic-sections.tsx`, `components/cleaning-reveal.tsx`, `components/service-catalogue.tsx`, `components/public.tsx`, `components/chrome.tsx`, `components/header-shell.tsx`, `components/nav-link.tsx`, `components/portal.tsx`.
- Dependency: `package.json` and `package-lock.json` add GSAP only.
- Verification/handoff: `tests/e2e/cinematic.spec.ts`, `tests/e2e/journey.spec.ts`, `scripts/cinematic-check.mjs`, `README.md`, this document.

## Remaining owner inputs

No new business decisions are required by this presentation update. The existing open items remain: approved prices/service details, service areas, operational windows/durations/capacity, approved policies and legal copy, and the original Rose Removals van photograph. No genuine testimonials or video assets were supplied; neither was fabricated. See `OWNER-INPUTS.md` for the complete launch list.

## Focused copy and cleaning-sweep refinement

Follow-up verified on 19 November 2026:

- Removed trailing full stops from authored public, authentication, booking, customer and staff titles. Paragraph punctuation, questions, customer data and catalogue records remain intact.
- Removed decorative overlines, photo captions, repeated service titles and filler copy; adjusted the resulting gaps. Form guidance, estimate qualifications, legal notices, stock attribution and request-confirmation information remain available.
- The existing kitchen reveal now has a small rose-gold SVG squeegee following the clearing edge and a brief finishing sheen. It uses the existing GSAP runtime, stays within the photograph and cannot intercept pointer events. Phones use a simpler sweep; reduced motion, unsupported masks and failed animation downloads leave the clean photograph visible.
- Updated files are the public page copy, shared presentation components, `app/cinematic.css`, title strings in auth/account/booking/error screens, and the two relevant browser test files. The approved logo, colour tokens, dependencies, database and server business logic are unchanged.
- Targeted ESLint and the production build (including TypeScript) passed. All four cinematic browser tests passed, followed by the existing request-draft/sign-in/staff-confirmation journey. The title audit covers public, auth, legal, customer and staff screens; the catalogue test checks all 14 service destinations and a demo enquiry.
- Real Chrome desktop (1440×1000) and mobile (375×812) captures showed no horizontal overflow, title-ending dots, page errors or failed HTTP responses. Sweep, sheen, reduced motion and static fallback were checked. Captures and the report are in ignored `.local/refinement-qa/`.

Preview: `http://localhost:3005`. Verification used the same-source local copy at `/tmp/rose-cinematic-preview` and the explicit isolated demo backend. Connected Supabase authentication and live email were not retested without credentials; no real messages were sent.

## Mobile fixes and Delta About reference

The follow-up reference is [Delta Cafés — About](https://deltacafes.com/en/about). Its live desktop header, photographic introduction, expanding image transition and mobile menu were inspected on 19 November 2026. Rose adapts those treatments using its existing transparent logo, exact colour tokens, copy and licensed cleaning photography; no Delta assets or business content are used.

- The shared header is now a floating capsule with the complete Rose logo centred. The responsive menu uses a native modal dialog, explicit keyboard focus cycling, Escape/close controls and focus restoration. Links retain their existing destinations and account logic.
- Home and About share an editorial photographic introduction. An oval image opens to full width as visitors scroll, followed by the existing service, cleaning-sweep and process sections. Normal scrolling is retained; no new pinning, scrolling library, video or dependency was added. Phones simplify the movement; reduced motion and unavailable animation scripts leave complete static content.
- Fixed the observed 320px signed-in header overflow. Booking forms stack before tablet widths become cramped; fields use 16px text on mobile, calendar controls are taller, and long addresses, status labels, footer links and review rows wrap within their containers.
- Changed application files: `app/rose-experience.css`, `app/layout.tsx`, `app/page.tsx`, `app/about/page.tsx`, `components/rose-scene.tsx`, `components/chrome.tsx`, `components/header-shell.tsx`, `components/mobile-nav.tsx`, `components/cinematic-motion.tsx` and `components/cinematic-sections.tsx`. Verification changes: `tests/e2e/responsive.spec.ts` and `scripts/cinematic-check.mjs`.
- Production build, TypeScript and targeted ESLint passed. Four existing cinematic tests, four responsive tests and three existing journey tests passed. Coverage includes all 14 service destinations, static/reduced-motion fallbacks, modal focus and navigation, mobile request submission, staff confirmation and office enquiries. No database or server business logic changed.
- Chrome captures at desktop, tablet and 320–390px mobile widths passed overflow checks. The capture script verified keyboard entry, Escape, logo/favicon loading and no browser errors or failed responses. Landscape menu behaviour was also tested at 844×390. Screenshots are in ignored `.local/mobile-qa/` and `.local/cinematic-qa/`.

The first focused test run caught the menu focus wrapping issue, which was fixed. The fast request test also encountered the existing stale-estimate safeguard; the test now waits for the latest server estimate before acknowledgement, with the safeguard unchanged. Final checks passed against the production demo build. Local preview remains `http://localhost:3005`; connected Supabase and live email remain unverified without credentials.
