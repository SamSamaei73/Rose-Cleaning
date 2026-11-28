import Link from "@/components/app-link";
import { PageHeading } from "./public";
export function LegalDraft({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="container">
      <PageHeading eyebrow="Draft for owner review" title={title}>
        {description}
      </PageHeading>
      <div className="prose">
        <div className="notice">
          <strong>Draft — not approved legal terms.</strong>
          <br />
          This page requires completion by the owner and a solicitor before the
          service launches to customers.
        </div>
        <h2>Information still to be completed</h2>
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h2>What this website currently does</h2>
        <p>
          A cleaning submission is a request until Rose confirms it.
          Registration is free; cleaning services are paid services. No payments
          are collected through this website at this stage.
        </p>
        <p>
          Account and enquiry details support the request and service process.
          No non-essential analytics or advertising tracking is installed.
          Authentication and demonstration sessions use essential cookies.
        </p>
        <p>
          Please avoid entering door codes, key-safe codes or sensitive access
          information in general notes.
        </p>
        <Link href="/contact" className="btn secondary small action-link">
          Contact Rose about this draft
        </Link>
      </div>
    </div>
  );
}
