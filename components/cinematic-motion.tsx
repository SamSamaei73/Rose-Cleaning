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
                gsap.fromTo(
                  target,
                  { "--wipe": "0%" },
                  {
                    "--wipe": "100%",
                    ease: "none",
                    scrollTrigger: {
                      trigger: target,
                      start: "top 85%",
                      end: "center 42%",
                      scrub: 0.45,
                    },
                  },
                );
              });
            return () => {
              delete element.dataset.motion;
            };
          });
          media.add(
            "(min-width: 1000px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)",
            () => {
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
