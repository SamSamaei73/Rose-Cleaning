# Owner inputs before launch

- **Logo supplied:** the official `img/Logo.jpeg` is now used throughout the site and for derived browser/app icons. No further logo selection is required.
- **Cleaning services:** approve names, descriptions, included/excluded tasks, extras, property limits and how regular arrangements are handled. No automatic recurrence is implemented.
- **Prices:** complete hourly/base/minimum rates, quantity rules, extras, mandatory charges, any approved discounts and tax treatment. Prior promotions and poster discounts have not been activated.
- **Service area:** confirm exact London postcodes/areas and any location restrictions or travel-charge rules. Current postcode validation checks UK format only, not geographic coverage; Rose reviews coverage before confirming.
- **Operations:** approve working days, arrival windows, lead time, unavailable dates, booking horizon, service durations, team units and capacity. Decide when and how named cleaners are assigned.
- **Contact and legal identity:** both supplied phones, `info@rosecleaning.uk`, `rosecleaning.uk` and `@rose.professional.cleaning` are displayed from `lib/brand.ts`. Confirm legal entity, office address if public, opening hours and email sending-domain configuration. The new displayed domain differs from the earlier `www.roseprofessionalcleaning.co.uk`; DNS, deployment origins and authentication callbacks have not been changed.
- **Policies:** solicitor-reviewed terms, privacy notice, cancellation/change policy, retention rules, required consent wording and policy versioning. All legal pages are labelled drafts. No cancellation fees, VAT assertions or retention periods are invented.
- **Assets:** supply the actual services poster for comparison with the supplied transcription, approved Rose photographs where available, a wheelie-bin-washing photograph and the original white Rose Removals van image (or poster suitable for a faithful crop). The official logo is supplied; licensed stock service photography is now recorded in `docs/PHOTOGRAPHY.md`.
- **Sister business:** approve the short Rose Removals description and any separate contact or destination link. The site does not portray its van as a cleaning fleet.
- **Connected services:** provide Supabase configuration, verified staff account, controlled test accounts, Resend credentials when approved, verified sending domain and approved sender identity. Run connected end-to-end authentication and notification tests before launch.

The current build has no payments, deposits, refunds, paid invoices, subscriptions, cleaner accounts, public reviews, AI or marketplace features.
