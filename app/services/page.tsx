import Link from "next/link";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { Cta } from "@/components/public";
export const metadata = {
  title: "Our cleaning services",
  description:
    "Explore Rose's home, office, specialist, outdoor and vehicle cleaning services in London. Request a clean or ask Rose for a quote.",
};
export default function Services() {
  return (
    <div className="cinematic service-index-page">
      <div className="container">
        <div className="editorial-page-heading" data-reveal>
          <span className="overline">The Rose collection</span>
          <h1>
            Care for every
            <br />
            <em>kind of space.</em>
          </h1>
          <div className="heading-bottom">
            <p>
              For your everyday surroundings.
              <br />
              And the details that make a difference.
            </p>
            <span>Explore our cleaning services</span>
          </div>
        </div>
        <ServiceCatalogue />
        <div className="catalogue-notes">
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
        <details className="catalogue-scope">
          <summary>What is included, and how are prices agreed?</summary>
          <p>
            Tell Rose about your property, priorities and preferred time. Final
            service options and prices require approval. Services without
            configured prices use a quote request. Garden cleaning covers
            cleaning and tidying outdoor areas, not landscaping. No online
            payment is collected.
          </p>
        </details>
      </div>
      <Cta />
    </div>
  );
}
