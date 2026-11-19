import Image from "next/image";
import { ContactForm } from "@/components/contact-form";
import { PageHeading } from "@/components/public";
import { brand } from "@/lib/brand";
import { isDemo } from "@/lib/server/config";
import { findPublicService } from "@/lib/service-catalogue";
export const metadata = { title: "Get in touch" };
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; service?: string }>;
}) {
  const { subject, service: serviceId } = await searchParams;
  const service = findPublicService(serviceId);
  return (
    <div className="cinematic enquiry-page">
      <div className="container">
        <PageHeading
          eyebrow="Let’s talk"
          title={
            service
              ? "Let’s talk about your clean."
              : "A fresh start begins here."
          }
        >
          {service
            ? `Ask Rose about ${service.name.toLowerCase()}. Price and scope will be confirmed with you.`
            : "A question or a quote? Speak with the Rose team."}
        </PageHeading>
        <div className="contact-layout">
          <aside className="contact-editorial" aria-label="Contact Rose">
            <div className="contact-photo">
              <Image
                src="/images/photography/hero-home.webp"
                alt="A calm, light-filled living room with a cream sofa"
                fill
                sizes="(max-width: 640px) 100vw, 40vw"
                loading="eager"
              />
            </div>
            <h2>
              A conversation
              <br />
              <em>is a good start.</em>
            </h2>
            <div className="contact-details">
              <a href={brand.phoneHref}>{brand.phone}</a>
              <a href={brand.secondaryPhoneHref}>{brand.secondaryPhone}</a>
              {brand.email && (
                <a href={`mailto:${brand.email}`}>{brand.email}</a>
              )}
              <a href={brand.instagramHref}>{brand.instagram}</a>
              <a href={brand.website}>{brand.websiteLabel}</a>
            </div>
            {brand.hours && <p>{brand.hours}</p>}
            <div className="contact-area">
              <h3>Here for London.</h3>
              <p>
                Include your postcode so we can review your location. Exact
                service areas are being confirmed.
              </p>
              {brand.address && <p>{brand.address}</p>}
              <p>For cleaning enquiries and questions about Rose Removals.</p>
            </div>
          </aside>
          <ContactForm
            demo={isDemo()}
            subject={subject?.slice(0, 200) || ""}
            serviceId={service?.id}
          />
        </div>
      </div>
    </div>
  );
}
