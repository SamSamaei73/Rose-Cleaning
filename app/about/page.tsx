import Image from "next/image";
import Link from "next/link";
import { Approach, Cta, Removals } from "@/components/public";
import { CinematicMotion } from "@/components/cinematic-motion";
import { RoseScene, RoseAperture } from "@/components/rose-scene";
export const metadata = { title: "About Rose" };
export default function About() {
  return (
    <CinematicMotion className="about-page">
      <RoseScene about />
      <RoseAperture about />
      <div className="container">
        <section
          className="about-spread rose-company"
          id="our-approach"
          aria-labelledby="about-company"
        >
          <div className="about-spread-photo" data-mask>
            <Image
              src="/images/photography/windows.webp"
              alt="A gloved hand cleaning a window with a green sponge"
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
      <section className="about-principles rose-principles">
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
