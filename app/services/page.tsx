import Link from "next/link";
import { Cta, PageHeading } from "@/components/public";
import { ServiceCatalogue } from "@/components/service-catalogue";
export const metadata = {
  title: "Our cleaning services",
  description:
    "Explore Rose's home, office, specialist, outdoor and vehicle cleaning services in London. Request a clean or get a quote.",
};
export default function Services() {
  return (
    <>
      <div className="container services-page">
        <PageHeading
          eyebrow="Care for every space"
          title="Find your kind of clean."
        >
          From your daily surroundings to the details that need extra attention.
        </PageHeading>
        <ServiceCatalogue />
        <div className="catalogue-foot">
          <p>
            Every request is reviewed by Rose. Scope, availability and price are
            agreed before confirmation.
          </p>
          <p>
            Need a one-off home clean?{" "}
            <Link className="text-link" href="/book?service=one-off">
              Request a one-off clean
            </Link>
          </p>
        </div>
        <details className="service-guidance">
          <summary>What is included, and how are prices agreed?</summary>
          <p>
            Tell us about your space and priorities. Final options and prices
            still require approval; newly listed services are quoted
            individually. Garden services cover cleaning and tidying, not
            landscaping. Any demo estimate is clearly labelled.
          </p>
        </details>
      </div>
      <Cta />
    </>
  );
}
