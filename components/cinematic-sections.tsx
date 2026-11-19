import Image from "next/image";
import Link from "next/link";
import { Approach } from "./public";

export function CinematicHero() {
  return (
    <section className="cinematic-hero hero" aria-labelledby="home-title">
      <div className="cinematic-hero-image">
        <Image
          src="/images/photography/hero-home.webp"
          alt="A light-filled living room with a cream sofa, wooden floor and large windows"
          fill
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      <div className="hero-shade" />
      <div className="cinematic-hero-content">
        <p className="overline">
          Rose Professional Cleaning <span>London</span>
        </p>
        <h1 id="home-title">
          <span className="line-window">
            <span data-hero-line>Clean spaces.</span>
          </span>
          <span className="line-window">
            <em data-hero-line>Better every day.</em>
          </span>
        </h1>
        <div className="hero-lower">
          <div>
            <p>
              For the home you live in.
              <br />
              The spaces you work in. The life in between.
            </p>
            <div className="actions">
              <Link href="/book" className="btn">
                Request a clean
              </Link>
              <Link href="/services" className="hero-services-link">
                View services
              </Link>
            </div>
          </div>
          <a className="scroll-cue" href="#rose-intro">
            <span className="scroll-rule" aria-hidden="true" />
            <span>Discover Rose</span>
            <span className="scroll-arrow" aria-hidden="true">
              ↓
            </span>
          </a>
        </div>
      </div>
      <span className="hero-edition" aria-hidden="true">
        Professional cleaning. Personal care.
      </span>
    </section>
  );
}

export function RoseIntroduction() {
  return (
    <section className="editorial-intro container" id="rose-intro">
      <div className="section-index" data-reveal>
        <span>01 / THE ROSE WAY</span>
        <span>Care, considered.</span>
      </div>
      <div className="intro-statement" data-reveal>
        <h2>
          A little less to do.
          <br />
          <em>A little more room for life.</em>
        </h2>
        <div>
          <p>
            A fresh home. A welcoming workplace. Rose brings thoughtful cleaning
            to the spaces that matter to you.
          </p>
          <p>
            You book with Rose. We manage the team, the service and the details.
          </p>
          <Link href="/about" className="text-link">
            Get to know Rose
          </Link>
        </div>
      </div>
    </section>
  );
}

const processSteps = [
  {
    title: "Choose your clean.",
    text: "Find the service that fits your space. Share your property details and the things you’d like us to focus on.",
    image: "regular.webp",
    alt: "A woman wiping a kitchen cabinet with a blue cloth",
  },
  {
    title: "Make it your own.",
    text: "Request your preferred date and arrival window. Review the details and estimate before sending your request.",
    image: "one-off.webp",
    alt: "A person mopping a wooden floor beside a yellow bucket",
  },
  {
    title: "Leave the details to Rose.",
    text: "We review the scope, time and price with you. Your visit is confirmed only when Rose confirms it; any alternative is yours to accept.",
    image: "end-of-tenancy.webp",
    alt: "A bright, empty apartment with a clean tiled floor",
  },
];
export function CinematicProcess() {
  return (
    <section
      className="process-section container"
      aria-labelledby="process-title"
    >
      <div className="section-index">
        <span>03 / SIMPLY ARRANGED</span>
        <a href="#after-process" className="text-link process-skip">
          Skip to about Rose
        </a>
      </div>
      <div className="process-heading" data-reveal>
        <h2 id="process-title">
          From a first hello
          <br />
          <em>to a fresh start.</em>
        </h2>
        <p>
          Three simple steps.
          <br />
          Clear details, agreed together.
        </p>
      </div>
      <div className="process-story">
        <div className="process-visual" aria-hidden="true">
          {processSteps.map((step, i) => (
            <div className="process-photo" key={step.image}>
              <Image
                src={`/images/photography/${step.image}`}
                alt=""
                fill
                sizes="(max-width: 800px) 100vw, 52vw"
                style={{ objectPosition: i === 0 ? "50% 45%" : "50% 60%" }}
              />
            </div>
          ))}
          <div className="process-image-caption">
            Your space. Your priorities. Our care.
          </div>
        </div>
        <div className="process-steps">
          {processSteps.map((step, i) => (
            <article className="process-step" key={step.title}>
              <span className="process-number">0{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {i === 2 && (
                <Link href="/book" className="text-link">
                  Request a clean
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RoseApproach() {
  return (
    <section className="rose-approach" id="after-process">
      <div className="container">
        <div className="section-index">
          <span>04 / PERSONAL CARE</span>
          <span>Managed by Rose</span>
        </div>
        <div className="approach-editorial">
          <div className="approach-photo" data-mask>
            <Image
              src="/images/photography/windows.webp"
              alt="A gloved hand carefully cleaning a window with a green sponge"
              fill
              sizes="(max-width: 800px) 90vw, 40vw"
              style={{ objectPosition: "50% 35%" }}
            />
          </div>
          <div className="approach-copy" data-reveal>
            <h2>
              It’s personal.
              <br />
              <em>It’s your space.</em>
            </h2>
            <p>
              Professional cleaning starts with understanding what matters to
              you. With Rose, you have one company to speak with from your first
              enquiry to your confirmed visit.
            </p>
            <Approach />
            <Link href="/about" className="text-link">
              More about Rose
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
