import Image from "next/image";
import Link from "next/link";
import { Approach } from "./public";

export function RoseIntroduction() {
  return (
    <section className="editorial-intro container">
      <div className="intro-statement" data-reveal>
        <h2>
          A little less to do
          <br />
          <em>A little more room for life</em>
        </h2>
        <div>
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
    title: "Choose your clean",
    text: "Find the service that fits your space. Share your property details and the things you’d like us to focus on.",
    image: "regular.webp",
    alt: "A woman wiping a kitchen cabinet with a blue cloth",
  },
  {
    title: "Make it your own",
    text: "Request your preferred date and arrival window. Review the details and estimate before sending your request.",
    image: "one-off.webp",
    alt: "A person mopping a wooden floor beside a yellow bucket",
  },
  {
    title: "Leave the details to Rose",
    text: "We review the scope, time and price with you. Your visit is confirmed only when Rose confirms it; any alternative is yours to accept.",
    image: "end-of-tenancy.webp",
    alt: "A bright, empty apartment with a clean tiled floor",
  },
];
export function CinematicProcess({ requestHref }: { requestHref: string }) {
  return (
    <section
      className="process-section container"
      aria-labelledby="process-title"
    >
      <div className="process-navigation">
        <a href="#after-process" className="text-link process-skip">
          Skip to about Rose
        </a>
      </div>
      <div className="process-heading" data-reveal>
        <h2 id="process-title">
          From a first hello
          <br />
          <em>to a fresh start</em>
        </h2>
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
        </div>
        <div className="process-steps">
          {processSteps.map((step, i) => (
            <article className="process-step" key={step.title}>
              <span className="process-number">0{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {i === 2 && (
                <Link href={requestHref} className="text-link">
                  Request Cleaning
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
              It’s personal
              <br />
              <em>It’s your space</em>
            </h2>
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
