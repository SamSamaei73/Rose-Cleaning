import Image from "next/image";
import Link from "next/link";
import { PhotoFrame } from "./photo-frame";

/** Illustrative service imagery; source records are in docs/PHOTOGRAPHY.md. */
export function RoseScene({ requestHref }: { requestHref: string }) {
  return (
    <section
      className="cinematic-hero hero rose-scene"
      aria-labelledby="home-title"
    >
      <div className="scene-orbit" aria-hidden="true" />
      <div className="cinematic-hero-image scene-collage" aria-hidden="true">
        {[
          ["regular", "scene-photo-one"],
          ["kitchen", "scene-photo-two"],
          ["windows", "scene-photo-three"],
          ["hero-home", "scene-photo-four"],
        ].map(([image, position], i) => (
          <PhotoFrame
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
          </PhotoFrame>
        ))}
      </div>
      <div className="cinematic-hero-content">
        <h1 id="home-title">
          <span className="line-window">
            <span data-hero-line>Clean spaces</span>
          </span>
          <span className="line-window">
            <em data-hero-line>Better every day</em>
          </span>
        </h1>
        <div className="hero-lower">
          <p>Professional cleaning for homes and workplaces across London.</p>
          <div className="actions">
            <Link href={requestHref} className="btn">
              Request Cleaning
            </Link>
            <Link href="/services" className="btn secondary hero-services-link">
              View Services
            </Link>
          </div>
        </div>
        <a
          className="scene-scroll"
          href="#rose-intro"
          aria-label="Discover Rose"
        >
          <span aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
