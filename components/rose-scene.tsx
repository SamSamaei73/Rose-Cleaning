import Image from "next/image";
import Link from "next/link";

/** Existing licensed photographs; these are illustrative, not Rose staff portraits. */
export function RoseScene({ about = false }: { about?: boolean }) {
  return (
    <section
      className="cinematic-hero hero rose-scene"
      aria-labelledby={about ? "about-title" : "home-title"}
    >
      <div className="scene-orbit" aria-hidden="true" />
      <div className="cinematic-hero-image scene-collage" aria-hidden="true">
        {[
          ["regular", "scene-photo-one"],
          ["kitchen", "scene-photo-two"],
          ["windows", "scene-photo-three"],
          ["hero-home", "scene-photo-four"],
        ].map(([image, position], i) => (
          <div
            className={`scene-photo ${position}`}
            key={image}
            data-float={i % 2 ? "18" : "-18"}
          >
            <Image
              src={`/images/photography/${image}.webp`}
              alt=""
              fill
              sizes="(max-width: 640px) 38vw, 20vw"
              loading={i < 2 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
      <div className="cinematic-hero-content">
        <h1 id={about ? "about-title" : "home-title"}>
          <span className="line-window">
            <span data-hero-line>
              {about ? "A little care" : "Clean spaces"}
            </span>
          </span>
          <span className="line-window">
            <em data-hero-line>
              {about ? "A big difference" : "Better every day"}
            </em>
          </span>
        </h1>
        <div className="hero-lower">
          <p>
            {about
              ? "Your space, thoughtfully cared for by Rose."
              : "Professional cleaning for homes and workplaces across London."}
          </p>
          <div className="actions">
            <Link href="/book" className="btn">
              Request a clean
            </Link>
            <Link
              href={about ? "#our-approach" : "/services"}
              className="hero-services-link"
            >
              {about ? "Our approach" : "View services"}
            </Link>
          </div>
        </div>
        <a
          className="scene-scroll"
          href={about ? "#rose-story" : "#rose-intro"}
          aria-label={about ? "Discover our approach" : "Discover Rose"}
        >
          <span aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

export function RoseAperture({ about = false }: { about?: boolean }) {
  return (
    <section
      className="rose-aperture"
      id={about ? "rose-story" : "rose-intro"}
      aria-label="A fresh perspective on your space"
    >
      <div className="aperture-frame" data-aperture>
        <Image
          src={`/images/photography/${about ? "regular" : "hero-home"}.webp`}
          alt={
            about
              ? "A kitchen cabinet being carefully cleaned with a cloth"
              : "A light-filled living room with wooden floors and a cream sofa"
          }
          fill
          sizes="100vw"
          style={{ objectPosition: about ? "50% 40%" : "50% 56%" }}
        />
      </div>
    </section>
  );
}
