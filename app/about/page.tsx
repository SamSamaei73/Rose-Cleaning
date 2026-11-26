import Link from "next/link";
import Image from "next/image";
import { PhotoFrame } from "@/components/photo-frame";

export const metadata = { title: "About Rose" };

export default function About() {
  return (
    <div className="about-static container">
      <header className="about-static-heading">
        <h1>Elevating the Art of Cleaning</h1>
        <p>
          At Rose Cleaning, we believe a truly clean space is more than spotless
          — it is a feeling of comfort, elegance and wellbeing.
        </p>
      </header>
      <section className="about-static-intro" aria-labelledby="about-managed">
        <PhotoFrame className="about-portrait">
          <Image
            src="/images/photography/regular-whatsapp.webp"
            alt="A kitchen cabinet being carefully cleaned with a cloth"
            fill
            sizes="(max-width: 700px) 90vw, 45vw"
            style={{ objectPosition: "50% 40%" }}
          />
        </PhotoFrame>
        <div>
          <h2 id="about-managed">Tailored to your space</h2>
          <p>
            We provide a refined range of professional cleaning services tailored
            to homes, offices and commercial spaces. From regular domestic
            cleaning and deep cleaning to end-of-tenancy, move-in and move-out
            services, our experienced team is committed to delivering exceptional
            results with care and attention to every detail.
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
          <h2>Our services</h2>
          <p>
            Our services include Office &amp; Commercial Cleaning, After-Builders
            Cleaning, Oven Cleaning, Carpet Cleaning, Window Cleaning, Kitchen
            &amp; Bathroom Deep Cleaning, Balcony Cleaning, Bin Cleaning, Garden
            Cleaning and Mobile Car Cleaning.
          </p>
        </article>
        <article>
          <h2>Exceptional care, every time</h2>
          <p>
            Whether you require a one-off transformation or reliable ongoing
            care, Rose Cleaning delivers a discreet, professional and
            consistently high standard of service — leaving every space
            beautifully clean, fresh and ready to enjoy.
          </p>
          <Link href="/services" className="btn secondary">
            View Services
          </Link>
        </article>
      </section>
      <p className="about-service-area">
        Your space deserves nothing less than exceptional.
      </p>
    </div>
  );
}
