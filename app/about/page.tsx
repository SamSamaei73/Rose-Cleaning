import Link from "next/link";
import Image from "next/image";
import { PhotoFrame } from "@/components/photo-frame";
import { serviceCategories } from "@/lib/service-catalogue";

export const metadata = { title: "About Rose" };

export default function About() {
  return (
    <div className="about-static container">
      <header className="about-static-heading">
        <h1>About Rose</h1>
        <p>Professional cleaning for homes and workplaces across London.</p>
      </header>
      <section className="about-static-intro" aria-labelledby="about-managed">
        <PhotoFrame className="about-portrait">
          <Image
            src="/images/photography/regular.webp"
            alt="A kitchen cabinet being carefully cleaned with a cloth"
            fill
            sizes="(max-width: 700px) 90vw, 45vw"
            style={{ objectPosition: "50% 40%" }}
          />
        </PhotoFrame>
        <div>
          <h2 id="about-managed">Your clean, coordinated by Rose</h2>
          <p>
            You book with Rose Professional Cleaning. We manage our cleaning
            staff and coordinate your service, from reviewing your request to
            arranging your visit.
          </p>
          <p>
            Share your space and priorities. We agree the scope, time and
            complete price with you before confirming.
          </p>
          <Link href="/contact" className="btn">
            Contact Rose
          </Link>
        </div>
      </section>
      <section
        className="about-static-details"
        aria-label="Our approach and services"
      >
        <article>
          <h2>Clear communication</h2>
          <p>
            Follow your request and confirmed visits in your account. If Rose
            proposes a different time or price, you can review it before
            accepting.
          </p>
        </article>
        <article>
          <h2>Care for different spaces</h2>
          <p>
            From regular home cleaning and one-off refreshes to deep cleans, end
            of tenancy and office enquiries, we help you find the right service.
          </p>
          <ul className="about-service-types">
            {serviceCategories.map((category) => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
          <Link href="/services" className="btn secondary">
            View Services
          </Link>
        </article>
      </section>
      <p className="about-service-area">
        We serve London. Exact service areas are being finalised, so please
        include your postcode when you get in touch.
      </p>
    </div>
  );
}
