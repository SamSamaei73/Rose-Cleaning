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
          <h1>
            A little care
            <br />
            <em>A big difference</em>
          </h1>
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
            <h2 id="about-company">
              Your clean
              <br />
              <em>Our responsibility</em>
            </h2>
            <p>
              You book with Rose. We manage our staff and agree your service,
              time and price before confirming.
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
            <h2>
              Thoughtful care
              <br />
              <em>Clear communication</em>
            </h2>
          </div>
          <Approach />
        </div>
      </section>
      <Removals />
      <Cta />
    </CinematicMotion>
  );
}
