"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Progressive enhancement only: content stays visible before animation initialises. */
export function CinematicMotion({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let disposed = false;
    let teardown: (() => void) | undefined;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const initialise = async () => {
      if (preference.matches || teardown || disposed) return;
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (disposed || preference.matches || teardown) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia();
        const context = gsap.context(() => {
          media.add("(prefers-reduced-motion: no-preference)", () => {
            element.dataset.motion = "ready";
            const hero = element.querySelector<HTMLElement>(".cinematic-hero");
            if (hero) {
              gsap.from(hero.querySelectorAll("[data-hero-line]"), {
                yPercent: 105,
                opacity: 0,
                duration: 1.1,
                stagger: 0.13,
                ease: "power3.out",
              });
              gsap.fromTo(
                hero.querySelector(".cinematic-hero-image"),
                { scale: 1.04, yPercent: 0 },
                {
                  scale: 1.14,
                  yPercent: 10,
                  ease: "none",
                  scrollTrigger: {
                    trigger: hero,
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.7,
                  },
                },
              );
            }
            element
              .querySelectorAll<HTMLElement>("[data-reveal]")
              .forEach((target) => {
                // Never hide a section already visible when a restored page mounts.
                if (target.getBoundingClientRect().top < innerHeight * 0.9)
                  return;
                gsap.from(target, {
                  y: 38,
                  opacity: 0,
                  duration: 0.85,
                  ease: "power2.out",
                  scrollTrigger: {
                    trigger: target,
                    start: "top 92%",
                    once: true,
                  },
                });
              });
            element
              .querySelectorAll<HTMLElement>("[data-mask]")
              .forEach((target) => {
                gsap.fromTo(
                  target,
                  { clipPath: "inset(9% 5% 9% 5% round 35% 35% 3% 3%)" },
                  {
                    clipPath: "inset(0% 0% 0% 0% round 0% 0% 0% 0%)",
                    ease: "none",
                    scrollTrigger: {
                      trigger: target,
                      start: "top 90%",
                      end: "center 48%",
                      scrub: 0.7,
                    },
                  },
                );
              });
            element
              .querySelectorAll<HTMLElement>("[data-wipe]")
              .forEach((target) => {
                if (
                  !CSS.supports(
                    "clip-path",
                    "inset(0 0 0 clamp(0%, 50%, 100%))",
                  )
                )
                  return;
                target.dataset.cleaningReveal = "active";
                const sweep = target.querySelector(".signature-sweep");
                const sheen = target.querySelector(".signature-sheen");
                // One finite scroll-driven pass. The tool tracks the same edge
                // as the mask; the final sheen only crosses the cleared image.
                gsap
                  .timeline({
                    scrollTrigger: {
                      trigger: target,
                      start: "top 85%",
                      end: "center 42%",
                      scrub: 0.45,
                    },
                  })
                  .fromTo(
                    target,
                    { "--wipe": "-6%" },
                    { "--wipe": "106%", duration: 0.78, ease: "none" },
                    0,
                  )
                  .fromTo(
                    sweep,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.06 },
                    0,
                  )
                  .to(sweep, { opacity: 0, duration: 0.06 }, 0.72)
                  .fromTo(
                    sheen,
                    { xPercent: -100 },
                    { xPercent: 100, duration: 0.22, ease: "power1.inOut" },
                    0.78,
                  )
                  .fromTo(
                    sheen,
                    { opacity: 0 },
                    { opacity: 0.35, duration: 0.07 },
                    0.78,
                  )
                  .to(sheen, { opacity: 0, duration: 0.08 }, 0.92);
              });
            return () => {
              delete element.dataset.motion;
              element
                .querySelectorAll<HTMLElement>("[data-wipe]")
                .forEach((target) => {
                  delete target.dataset.cleaningReveal;
                });
            };
          });
          media.add(
            {
              motion: "(prefers-reduced-motion: no-preference)",
              mobile: "(max-width: 640px)",
              desktop: "(min-width: 641px)",
            },
            ({ conditions }) => {
              if (
                !conditions?.motion ||
                !CSS.supports("clip-path", "inset(0 0 0 clamp(0%, 50%, 100%))")
              )
                return;
              const surfaces = [
                ...element.querySelectorAll<HTMLElement>("[data-glass]"),
              ];
              surfaces.forEach((surface) => {
                const count = conditions.mobile ? 2 : 3;
                const bands = [
                  ...surface.querySelectorAll<HTMLElement>(".glass-mist-band"),
                ].slice(0, count);
                const tool = surface.querySelector(".glass-tool-track");
                const polish = surface.querySelector(".glass-polish");
                surface.dataset.glassReady = "true";
                gsap.set(surface, { "--glass-bands": count });
                const sweep = gsap.timeline({
                  scrollTrigger: {
                    trigger: surface,
                    start: "top 80%",
                    end: "bottom 65%",
                    scrub: 0.5,
                  },
                });
                // The blade height equals one band. Each band's mask and the
                // tool use identical x positions, so only the swept path clears.
                bands.forEach((band, index) => {
                  const start = index * 1.08;
                  sweep
                    .set(
                      tool,
                      {
                        "--glass-y": `${(index * 100) / count}%`,
                        "--glass-x": "-10%",
                        opacity: 0,
                      },
                      start,
                    )
                    .fromTo(
                      band,
                      { "--clear": "-10%" },
                      { "--clear": "110%", duration: 1, ease: "none" },
                      start,
                    )
                    .to(
                      tool,
                      { "--glass-x": "110%", duration: 1, ease: "none" },
                      start,
                    )
                    .to(tool, { opacity: 1, duration: 0.07 }, start)
                    .to(tool, { opacity: 0, duration: 0.08 }, start + 0.92);
                });
                const finish = count * 1.08;
                sweep
                  .fromTo(
                    polish,
                    { xPercent: -100, opacity: 0 },
                    { xPercent: 100, duration: 0.55, ease: "power1.inOut" },
                    finish,
                  )
                  .to(polish, { opacity: 0.3, duration: 0.1 }, finish)
                  .to(polish, { opacity: 0, duration: 0.15 }, finish + 0.4);
              });
              return () =>
                surfaces.forEach((surface) => {
                  delete surface.dataset.glassReady;
                });
            },
          );
          media.add(
            "(min-width: 1000px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)",
            () => {
              element
                .querySelectorAll<HTMLElement>("[data-float]")
                .forEach((target) => {
                  gsap.to(target, {
                    yPercent: Number(target.dataset.float),
                    ease: "none",
                    scrollTrigger: {
                      trigger: target.closest(".rose-scene"),
                      start: "top top",
                      end: "bottom top",
                      scrub: 0.8,
                    },
                  });
                });
              const story =
                element.querySelector<HTMLElement>(".process-story");
              if (!story) return;
              const visual =
                story.querySelector<HTMLElement>(".process-visual")!;
              const steps = [
                ...story.querySelectorAll<HTMLElement>(".process-step"),
              ];
              const photos = [
                ...visual.querySelectorAll<HTMLElement>(".process-photo"),
              ];
              ScrollTrigger.create({
                trigger: story,
                start: "top 100px",
                end: () => `bottom ${visual.offsetHeight + 100}px`,
                pin: visual,
                pinSpacing: false,
                invalidateOnRefresh: true,
              });
              const show = (index: number) => {
                steps.forEach((step, i) => {
                  step.dataset.active = String(i === index);
                });
                photos.forEach((photo, i) =>
                  gsap.to(photo, {
                    opacity: i === index ? 1 : 0,
                    scale: i === index ? 1 : 1.035,
                    duration: 0.55,
                    overwrite: true,
                  }),
                );
              };
              steps.forEach((step, i) =>
                ScrollTrigger.create({
                  trigger: step,
                  start: "top 55%",
                  end: "bottom 55%",
                  onEnter: () => show(i),
                  onEnterBack: () => show(i),
                }),
              );
              return () =>
                steps.forEach((step) => {
                  delete step.dataset.active;
                });
            },
          );
        }, element);
        const refresh = () => ScrollTrigger.refresh();
        const images = [...element.querySelectorAll("img")];
        images.forEach((img) => {
          if (!img.complete)
            img.addEventListener("load", refresh, { once: true });
        });
        const frame = requestAnimationFrame(refresh);
        teardown = () => {
          cancelAnimationFrame(frame);
          images.forEach((img) => img.removeEventListener("load", refresh));
          media.revert();
          context.revert();
          delete element.dataset.motion;
        };
      } catch {
        // Network/chunk failures retain the complete static experience.
        delete element.dataset.motion;
      }
    };
    const onPreference = () => {
      if (preference.matches) {
        teardown?.();
        teardown = undefined;
      } else void initialise();
    };
    void initialise();
    preference.addEventListener("change", onPreference);
    return () => {
      disposed = true;
      teardown?.();
      preference.removeEventListener("change", onPreference);
    };
  }, []);
  return (
    <div ref={root} className={`cinematic ${className}`}>
      {children}
    </div>
  );
}
