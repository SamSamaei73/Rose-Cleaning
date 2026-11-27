import Image from "next/image";
import Link from "@/components/app-link";
import { brand } from "@/lib/brand";
export { ServiceCards } from "./service-cards";
export function Cta({ requestHref }: { requestHref: string }) {
  return (
    <section className="closing-section">
      <div className="container cta">
        <div data-reveal>
          <h2>
            Ready for
            <br />
            <em>a fresh start?</em>
          </h2>
        </div>
        <div className="actions">
          <Link className="btn" href={requestHref}>
            Request
          </Link>
        </div>
      </div>
    </section>
  );
}
export function Removals() {
  return (
    <section className="removals cinematic-removals">
      <div className="container removals-inner">
        <div>
          <h2>Moving home? Meet Rose Removals</h2>
          <p>Ask about cleaning and moving with our sister business.</p>
          <Link href="/contact?subject=Moving%20home" className="btn secondary small action-link">
            Talk about your move
          </Link>
        </div>
        {brand.removalsVan ? (
          <Image
            src={brand.removalsVan}
            alt="The white Rose Removals van, belonging to our sister business"
            width={650}
            height={420}
            sizes="(max-width:640px) 100vw, 40vw"
          />
        ) : (
          <div className="removals-note">
            <span>Rose Removals</span>
            <small>Original Rose Removals van photograph to follow.</small>
          </div>
        )}
      </div>
    </section>
  );
}
export function Approach() {
  return (
    <div className="faq-list approach-list">
      {[
        [
          "One company, from start to finish",
          "You book with Rose. We manage our staff and the delivery of your service.",
        ],
        [
          "A clean shaped around your space",
          "Tell us your priorities. We’ll agree the scope and complete price before confirming.",
        ],
        [
          "Clear updates, all in one place",
          "Keep track of your request, review alternatives and see confirmed visits in your account.",
        ],
      ].map(([title, text], i) => (
        <details key={title} open={i === 0}>
          <summary>{title}</summary>
          <p>{text}</p>
        </details>
      ))}
    </div>
  );
}
export function Process() {
  return (
    <section className="soft-section">
      <div className="container section">
        <div className="section-heading">
          <div>
            <h2>Your clean, in three steps</h2>
          </div>
        </div>
        <div className="steps">
          {[
            ["Choose your service", "Find the right clean for your space."],
            [
              "Tell us the details",
              "Share your priorities and preferred time.",
            ],
            [
              "Receive confirmation",
              "Rose agrees the service, time and price with you.",
            ],
          ].map(([title, text], i) => (
            <div key={title}>
              <span className="step-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading" data-reveal>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
