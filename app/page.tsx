import Image from "next/image";
import Link from "next/link";
import { Approach, Cta, Process, Removals } from "@/components/public";
import { ServiceCards } from "@/components/service-cards";
import { CleaningReveal } from "@/components/cleaning-reveal";
import { serviceCatalogue } from "@/lib/service-catalogue";
const faqs = [
  [
    "Is my request confirmed straight away?",
    "Rose reviews your property, preferred time and price before confirming. Any alternative is shown for you to accept.",
  ],
  [
    "How much will my clean cost?",
    "Final prices are subject to approval. Request a clean or a quote and Rose will agree the full cost with you. Any demo estimate is clearly labelled.",
  ],
  [
    "Where do you work?",
    "Rose serves London. Include your postcode so we can check your location; exact service areas are still being confirmed.",
  ],
  [
    "Is an account free?",
    "Yes. Registration is free; cleaning services are paid. No payment is collected through this website at this stage.",
  ],
];
export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="container hero">
          <div className="hero-copy">
            <span className="eyebrow">Rose Professional Cleaning · London</span>
            <h1>
              The care your
              <br />
              space <em>deserves.</em>
            </h1>
            <p className="lead">
              A fresher home. A more welcoming workplace. <br />
              Professional cleaning, thoughtfully managed by Rose.
            </p>
            <div className="actions">
              <Link href="/book" className="btn">
                Request a clean
              </Link>
              <Link href="/services" className="btn secondary">
                View services
              </Link>
            </div>
            <p className="hero-foot">Your space. Your priorities. Our care.</p>
          </div>
          <div className="hero-visual">
            <Image
              src="/images/photography/hero-home.webp"
              alt="A sunlit living room with a comfortable sofa and natural materials"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 640px) 100vw, 55vw"
            />
            <span className="hero-photo-caption">
              A little more room for life.
            </span>
          </div>
        </div>
        <div className="container hero-assurance">
          <span>Managed by Rose</span>
          <span>Homes, workplaces & more</span>
          <span>Details agreed before your clean</span>
        </div>
      </section>
      <section className="container section featured-services" id="services">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Find your fresh start</span>
            <h2>A clean for every chapter.</h2>
          </div>
          <Link href="/services" className="text-link">
            View all services
          </Link>
        </div>
        <ServiceCards
          services={serviceCatalogue.filter((service) => service.featured)}
        />
        <p className="services-foot">
          Looking after more than your home? Explore{" "}
          <Link href="/services">
            workplace, specialist, outdoor and vehicle cleaning.
          </Link>
        </p>
      </section>
      <CleaningReveal />
      <Process />
      <section className="container section about-intro">
        <div>
          <span className="eyebrow">The Rose approach</span>
          <h2>
            Personal care.
            <br />
            <em>Professional standards.</em>
          </h2>
          <p>
            Book with one company, speak with one team. Rose manages the people
            and the details behind your clean.
          </p>
          <Link href="/about" className="text-link">
            About Rose
          </Link>
        </div>
        <Approach />
      </section>
      <Removals />
      <section className="container section faq-grid">
        <div>
          <span className="eyebrow">A little clarity</span>
          <h2>Good to know.</h2>
          <p>Before we get started.</p>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <Cta />
    </>
  );
}
