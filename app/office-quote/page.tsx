import { Building2, Check } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { PageHeading } from "@/components/public";
import { isDemo } from "@/lib/server/config";
export const metadata = { title: "Office cleaning quote" };
export default function OfficeQuote() {
  return (
    <div className="container">
      <PageHeading
        eyebrow="Care beyond the home"
        title="A workspace that feels ready."
      >
        Tell us about your office. We’ll review your needs and discuss a
        suitable cleaning arrangement.
      </PageHeading>
      <div className="contact-layout">
        <div className="stack">
          <span className="service-icon">
            <Building2 size={27} />
          </span>
          <h2 style={{ fontSize: 29 }}>
            The right clean starts
            <br />
            with the right details.
          </h2>
          <p>
            Office cleaning is quoted individually. Please share the size and
            layout of your space, how often you’d like it cleaned and any
            particular priorities.
          </p>
          {[
            "Premises and postcode",
            "Areas that need attention",
            "Preferred days and time of day",
            "Access and parking considerations",
          ].map((v) => (
            <p key={v} style={{ display: "flex", gap: 10, fontSize: 13 }}>
              <Check size={18} color="var(--rose)" />
              {v}
            </p>
          ))}
          <div className="notice">
            This is a quote request. The service and price need to be agreed
            with Rose before a visit is confirmed.
          </div>
        </div>
        <ContactForm office demo={isDemo()} />
      </div>
    </div>
  );
}
