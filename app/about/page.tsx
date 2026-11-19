import Image from "next/image";
import Link from "next/link";
import { Approach, Cta, Removals } from "@/components/public";
import { CinematicMotion } from "@/components/cinematic-motion";
export const metadata = { title: "About Rose" };
export default function About() {
  return (
    <CinematicMotion className="about-page">
      <div className="container">
        <div className="editorial-page-heading" data-reveal>
          <span className="overline">Hello, we’re Rose</span>
          <h1>
            A little care.
            <br />
            <em>A big difference.</em>
          </h1>
          <div className="heading-bottom">
            <p>
              Professional cleaning. Personal care.
              <br />
              For homes, workplaces and life in London.
            </p>
            <span>Our story starts with your space</span>
          </div>
        </div>
        <section className="about-spread" aria-labelledby="about-company">
          <div className="about-spread-photo" data-mask>
            <Image
              src="/images/photography/regular.webp"
              alt="A woman carefully wiping a wooden kitchen cabinet with a cloth"
              fill
              sizes="(max-width: 640px) 100vw, 55vw"
              style={{ objectPosition: "50% 40%" }}
            />
          </div>
          <div className="about-spread-copy" data-reveal>
            <span className="overline">Managed by Rose</span>
            <h2 id="about-company">
              Your clean.
              <br />
              <em>Our responsibility.</em>
            </h2>
            <p>
              Rose Professional Cleaning brings cleaning services together under
              one name. You book with Rose. We manage our staff and the delivery
              of your service.
            </p>
            <p>
              From the regular routine to a deeper clean or a move, we start by
              understanding your space. Share your priorities and preferred
              time; we’ll agree the scope and price before confirming.
            </p>
            <p>
              We serve London. Exact service areas are being finalised, so
              include your postcode when you get in touch.
            </p>
            <Link href="/services" className="text-link">
              Explore our services
            </Link>
          </div>
        </section>
      </div>
      <section className="about-principles">
        <div className="container about-principles-inner">
          <div data-reveal>
            <span className="overline">The Rose approach</span>
            <h2>
              Thoughtful care.
              <br />
              <em>Clear communication.</em>
            </h2>
            <p>
              One company to speak with, from your first enquiry to your
              confirmed visit.
            </p>
          </div>
          <Approach />
        </div>
      </section>
      <Removals />
      <Cta />
    </CinematicMotion>
  );
}
