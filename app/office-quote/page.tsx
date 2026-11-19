import Image from "next/image";
import { ContactForm } from "@/components/contact-form";
import { PageHeading } from "@/components/public";
import { isDemo } from "@/lib/server/config";
export const metadata = { title: "Office cleaning quote" };
export default function OfficeQuote() {
  return (
    <div className="cinematic enquiry-page">
      <div className="container">
        <PageHeading title="A workspace that feels ready" />
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
            <p>
              Office cleaning is quoted individually. Share your space, the
              frequency you have in mind and the areas that need attention.
            </p>
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
