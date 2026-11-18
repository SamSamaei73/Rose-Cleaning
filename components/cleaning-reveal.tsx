"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

/** One ordinary section: no pinning, scroll interception or React frame updates. */
export function CleaningReveal() {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = frame.current;
    if (
      !element ||
      !("IntersectionObserver" in window) ||
      !CSS.supports("clip-path", "inset(0 0 0 50%)")
    )
      return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 640px)");
    let raf = 0;
    let visible = false;
    const update = () => {
      raf = 0;
      if (reduced.matches) {
        element.removeAttribute("data-animate");
        return;
      }
      const box = element.getBoundingClientRect();
      const travel = window.innerHeight * (mobile.matches ? 0.62 : 0.72);
      const progress = Math.max(
        0,
        Math.min(1, (window.innerHeight * 0.92 - box.top) / travel),
      );
      element.style.setProperty("--wipe", `${(progress * 100).toFixed(2)}%`);
      element.dataset.animate = "true";
      element.dataset.finished = String(progress >= 1);
    };
    const schedule = () => {
      if (visible && !raf) raf = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    observer.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", update);
    update();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", update);
    };
  }, []);
  return (
    <section
      className="cleaning-moment container section"
      aria-labelledby="cleaning-moment-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">A fresh perspective</span>
          <h2 id="cleaning-moment-title">Let your space shine.</h2>
        </div>
        <p>
          A clean surface. A clearer view.
          <br />
          Small details make a difference.
        </p>
      </div>
      <div className="wipe-frame" ref={frame}>
        <Image
          src="/images/photography/kitchen.webp"
          alt="A clean kitchen, revealed as a light haze clears"
          fill
          sizes="(max-width: 640px) 100vw, 1200px"
        />
        <div className="wipe-haze" aria-hidden="true" />
        <div className="wipe-edge" aria-hidden="true" />
        <span className="wipe-caption">A fresh outlook, with Rose</span>
      </div>
      <p className="photo-note">
        Illustrative stock photography. This reveal is a visual effect, not a
        customer before-and-after.
      </p>
    </section>
  );
}
