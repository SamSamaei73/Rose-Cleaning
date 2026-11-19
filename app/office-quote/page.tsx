import Image from "next/image";
import { ContactForm } from "@/components/contact-form";
import { PageHeading } from "@/components/public";
import { isDemo } from "@/lib/server/config";
export const metadata = { title: "Office cleaning quote" };
export default function OfficeQuote() {
  return (
    <div className="cinematic enquiry-page">
      <div className="container">
        <PageHeading
          eyebrow="Care beyond the home"
          title="A workspace that feels ready."
        >
          Tell us about your office. We’ll review your needs and discuss a
          suitable cleaning arrangement.
        </PageHeading>
        <div className="contact-layout">
          <aside
            className="contact-editorial"
            aria-label="About your office quote"
          >
            <div className="contact-photo">
              <Image
                src="/images/photography/office.webp"
                alt="A bright office with desks, chairs and floor-to-ceiling windows"
                fill
                sizes="(max-width: 640px) 100vw, 40vw"
              />
            </div>
            <h2>
              The right clean starts
              <br />
              <em>with the right details.</em>
            </h2>
            <p>
              Office cleaning is quoted individually. Share your space, the
              frequency you have in mind and the areas that need attention.
            </p>
            <ul className="office-prompts">
              <li>Premises and postcode</li>
              <li>Areas that need attention</li>
              <li>Preferred days and time of day</li>
              <li>Access and parking considerations</li>
            </ul>
            <div className="notice">
              This is a quote request. The service and price need to be agreed
              with Rose before a visit is confirmed.
            </div>
          </aside>
          <ContactForm office demo={isDemo()} serviceId="office-cleaning" />
        </div>
      </div>
    </div>
  );
}
