import Link from "next/link";
import { Cta, Removals } from "@/components/public";
import { CinematicMotion } from "@/components/cinematic-motion";
import {
  CinematicProcess,
  RoseApproach,
  RoseIntroduction,
} from "@/components/cinematic-sections";
import { ServiceCatalogue } from "@/components/service-catalogue";
import { CleaningReveal } from "@/components/cleaning-reveal";
import { RoseScene, RoseAperture } from "@/components/rose-scene";
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
    <CinematicMotion className="cinema-home">
      <RoseScene />
      <RoseAperture />
      <RoseIntroduction />
      <section className="service-collection container" id="services">
        <div className="collection-heading" data-reveal>
          <h2>
            Different spaces
            <br />
            <em>The same care</em>
          </h2>
        </div>
        <ServiceCatalogue featured />
      </section>
      <CleaningReveal />
      <CinematicProcess />
      <RoseApproach />
      <Removals />
      <section className="container cinematic-faq" aria-labelledby="faq-title">
        <div data-reveal>
          <h2 id="faq-title">Good to know</h2>
          <Link href="/contact" className="text-link">
            Talk to the team
          </Link>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <Cta />
    </CinematicMotion>
  );
}
