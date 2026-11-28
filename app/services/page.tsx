import Link from "@/components/app-link";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { Cta } from "@/components/public";
import { getSession } from "@/lib/server/auth";
import { customerEntryHref } from "@/lib/navigation";
export const metadata = {
  title: "Our cleaning services",
  description:
    "Explore Rose's home, office, specialist, outdoor and vehicle cleaning services in London. Sign in to request a service from your dashboard.",
};
export default async function Services() {
  const signedIn = Boolean(await getSession());
  return (
    <div className="cinematic service-index-page">
      <div className="container">
        <div className="editorial-page-heading" data-reveal>
          <h1>
            Care for every
            <br />
            <em>kind of space</em>
          </h1>
        </div>
        <ServiceCatalogue signedIn={signedIn} />
        <div className="catalogue-notes">
          <p>
            Every request is reviewed by Rose. Scope, availability and price are
            agreed before confirmation.
          </p>
          <p>
            Need a one-off home clean?{" "}
            <Link
              className="btn secondary small action-link"
              href={customerEntryHref(signedIn, "one-off")}
              aria-label="Request: One-off cleaning"
            >
              Request
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
      <Cta requestHref={customerEntryHref(signedIn)} />
    </div>
  );
}
