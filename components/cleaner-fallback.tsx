"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { leaseScene } from "@/lib/client/scene-budget";
import styles from "./cleaner-canvas.module.css";

/** The same real 3D rig, rendered ahead of time for devices without WebGL2. */
export function CleanerFallback({
  variant,
  enabled,
  paused,
}: {
  variant: "companion" | "loading";
  enabled: boolean;
  paused: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const preferences = useRef({ enabled, paused });
  const updateEligibility = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    preferences.current = { enabled, paused };
    updateEligibility.current?.();
  }, [enabled, paused]);
  useEffect(() => {
    const element = host.current;
    const media = video.current;
    if (!element || !media) return;
    media.src = `/images/cleaner/${variant}.webm`;
    let visible = false,
      disposed = false;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const lease = leaseScene(variant === "companion" ? 0 : 1, (active) => {
      if (active)
        void media.play().catch(() => {
          if (!disposed) setReady(false);
        });
      else media.pause();
    });
    const update = () =>
      lease.setEligible(
        visible &&
          !document.hidden &&
          !motion.matches &&
          !connection?.saveData &&
          preferences.current.enabled &&
          !preferences.current.paused,
      );
    updateEligibility.current = update;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      element.style.setProperty(
        "--travel-range",
        `${Math.max(0, width / 2 - height * 0.28333)}px`,
      );
    });
    observer.observe(element);
    resize.observe(element);
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      disposed = true;
      updateEligibility.current = null;
      lease.release();
      observer.disconnect();
      resize.disconnect();
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      media.pause();
      media.removeAttribute("src");
      media.load();
    };
  }, [variant]);
  return (
    <div
      ref={host}
      className={styles.fallback}
      data-motion={playing}
      data-enabled={enabled}
      data-ready={ready}
    >
      <div className={styles.traveler}>
        <Image
          src={`/images/cleaner/${variant}.webp`}
          width={280}
          height={360}
          alt=""
          unoptimized
          className={styles.poster}
        />
        <video
          ref={video}
          src={`/images/cleaner/${variant}.webm`}
          muted
          playsInline
          loop
          preload="none"
          tabIndex={-1}
          className={styles.video}
          data-ready={ready}
          onPlaying={() => {
            setReady(true);
            setPlaying(true);
          }}
          onPause={() => setPlaying(false)}
          onError={() => {
            setReady(false);
            setPlaying(false);
          }}
        />
      </div>
    </div>
  );
}
