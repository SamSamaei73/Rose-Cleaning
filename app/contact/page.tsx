import { Phone, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { PageHeading } from "@/components/public";
import { brand } from "@/lib/brand";
import { isDemo } from "@/lib/server/config";
export const metadata = { title: "Get in touch" };
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  return (
    <div className="container">
      <PageHeading
        eyebrow="Let’s talk"
        title="A fresh start begins with hello."
      >
        A question about your home, your request or a move? Speak with the Rose
        team.
      </PageHeading>
      <div className="contact-layout">
        <div className="stack">
          <div className="card stack">
            <span className="service-icon" style={{ margin: 0 }}>
              <Phone size={23} />
            </span>
            <h2 style={{ fontSize: 25 }}>Give Rose a call.</h2>
            <a
              className="text-link"
              style={{ fontSize: 22 }}
              href={brand.phoneHref}
            >
              {brand.phone}
            </a>
            <p className="small">
              For cleaning enquiries and questions about Rose Removals.
            </p>
            {brand.hours && <p>{brand.hours}</p>}
            {brand.email && (
              <a className="text-link" href={`mailto:${brand.email}`}>
                {brand.email}
              </a>
            )}
          </div>
          <div className="card stack">
            <MapPin color="var(--rose)" />
            <h3>Made for London homes.</h3>
            <p>
              Exact service areas are being confirmed. Include your postcode so
              we can review your location.
            </p>
            {brand.address && <p>{brand.address}</p>}
          </div>
        </div>
        <ContactForm demo={isDemo()} subject={subject?.slice(0, 200) || ""} />
      </div>
    </div>
  );
}
