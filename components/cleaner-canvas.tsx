"use client";

import { useEffect, useRef, useState } from "react";
import { leaseScene } from "@/lib/client/scene-budget";
import type { CleanerRenderer } from "@/lib/client/cleaner-renderer";
import { CleanerFallback } from "./cleaner-fallback";
import styles from "./cleaner-canvas.module.css";

export function CleanerCanvas({
  variant = "loading",
  paused = false,
}: {
  variant?: "companion" | "loading";
  paused?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const updateEligibility = useRef<(() => void) | null>(null);
  const [state, setState] = useState<"pending" | "webgl" | "fallback">(
    "pending",
  );
  useEffect(() => {
    pausedRef.current = paused;
    updateEligibility.current?.();
  }, [paused]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let disposed = false,
      visible = false,
      started = false;
    let renderer: CleanerRenderer | undefined;
    let context: WebGL2RenderingContext | null = null;
    let lease: ReturnType<typeof leaseScene> | undefined;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      lease?.setEligible(
        visible && !document.hidden && !motion.matches && !pausedRef.current,
      );
    updateEligibility.current = update;
    const fail = () => {
      if (disposed) return;
      lease?.release();
      lease = undefined;
      if (renderer) renderer.dispose();
      else context?.getExtension("WEBGL_lose_context")?.loseContext();
      context = null;
      renderer = undefined;
      setState("fallback");
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    async function start() {
      if (started || disposed) return;
      started = true;
      const connection = (
        navigator as Navigator & { connection?: { saveData?: boolean } }
      ).connection;
      if (connection?.saveData) {
        setState("fallback");
        return;
      }
      try {
        context = element!.getContext("webgl2", {
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        if (!context) {
          fail();
          return;
        }
        const { createCleanerRenderer } =
          await import("@/lib/client/cleaner-renderer");
        if (disposed) return;
        renderer = createCleanerRenderer(element!, variant, { context });
        element!.addEventListener("webglcontextlost", contextLost);
        lease = leaseScene(variant === "companion" ? 0 : 1, (active) =>
          renderer?.setActive(active),
        );
        setState("webgl");
        update();
      } catch (error) {
        if (
          process.env.NODE_ENV === "development" &&
          error instanceof Error &&
          error.message !== "WebGL2 is unavailable"
        )
          console.warn("Rose 3D renderer fallback:", error);
        fail();
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) void start();
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    return () => {
      disposed = true;
      updateEligibility.current = null;
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
      element.removeEventListener("webglcontextlost", contextLost);
      lease?.release();
      if (renderer) renderer.dispose();
      else context?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [variant]);
  return (
    <div
      className={styles.host}
      data-cleaner-renderer={state}
      data-variant={variant}
      aria-hidden="true"
    >
      {state !== "webgl" && (
        <CleanerFallback
          variant={variant}
          enabled={state === "fallback"}
          paused={paused}
        />
      )}
      <canvas
        ref={canvas}
        className={styles.canvas}
        data-ready={state === "webgl"}
        tabIndex={-1}
      />
    </div>
  );
}
