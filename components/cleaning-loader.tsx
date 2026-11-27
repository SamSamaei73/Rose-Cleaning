"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { loadingProgress } from "@/lib/client/loading-progress";
import { leaseScene } from "@/lib/client/scene-budget";
import styles from "./cleaning-loader.module.css";

type LoadingProps = {
  active?: boolean;
  label?: string;
  scope?: "operation" | "page" | "shell";
};

/** Route markers are server-rendered, so feedback works before hydration, too. */
export function CleaningLoader({
  active = true,
  label = "Getting everything ready…",
  scope = "operation",
}: LoadingProps) {
  const id = useId();
  useEffect(() => {
    if (active && scope === "operation")
      return loadingProgress.begin(id, label);
  }, [active, id, label, scope]);
  return active && scope !== "operation" ? (
    <div
      data-route-loading
      className={scope === "page" ? styles.reserved : undefined}
      aria-hidden="true"
    />
  ) : null;
}

const subscribeToHydration = () => () => {};
/** Keep streamed HTML covered until this Suspense boundary's code is interactive. */
export function PageReadiness({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  return (
    <>
      {!ready && <span data-route-loading aria-hidden="true" />}
      {children}
    </>
  );
}

function LoadingContent({ active, label }: { active: boolean; label: string }) {
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setStalled(true), 25000);
    return () => clearTimeout(timer);
  }, [active]);
  return stalled ? (
    <div className={styles.recovery} role="alert">
      <h2>This is taking longer than expected</h2>
      <p>You can reload this page or return to the previous one.</p>
      <div className="button-row">
        <button className="btn" onClick={() => location.reload()}>
          Reload page
        </button>
        <button className="btn secondary" onClick={() => history.back()}>
          Go back
        </button>
      </div>
    </div>
  ) : (
    <>
      <div className={styles.spinner} data-loading-spinner aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.innerRing} />
        <svg className={styles.sparkle} viewBox="0 0 40 40" fill="none">
          <path
            d="M20 5c1.6 10 5 13.4 15 15-10 1.6-13.4 5-15 15C18.4 25 15 21.6 5 20c10-1.6 13.4-5 15-15Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <p
        id="global-loading-message"
        className={styles.message}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {label}
      </p>
    </>
  );
}

/** One permanent, server-rendered surface; native modal behaviour is added after hydration. */
export function GlobalLoadingOverlay() {
  const dialog = useRef<HTMLDialogElement>(null);
  const focusOrigin = useRef<HTMLElement | null>(null);
  const pending = useSyncExternalStore(
    loadingProgress.subscribe,
    loadingProgress.snapshot,
    loadingProgress.serverSnapshot,
  );
  const active = pending !== null;
  useEffect(() => {
    let finish: (() => void) | undefined;
    const update = () => {
      const waiting = [
        ...document.querySelectorAll<HTMLElement>("[data-route-loading]"),
      ].some((marker) => marker.getClientRects().length > 0);
      if (waiting && !finish)
        finish = loadingProgress.begin(
          "streamed-page",
          "Getting everything ready…",
          3,
        );
      else if (!waiting && finish) {
        finish();
        finish = undefined;
      }
    };
    const observer = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            record.type === "childList" ||
            (record.target instanceof Element &&
              record.target.querySelector("[data-route-loading]")),
        )
      )
        update();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "style"],
    });
    update();
    return () => {
      observer.disconnect();
      finish?.();
    };
  }, []);
  useEffect(() => {
    const rememberFocus = (event: Event) => {
      if (
        !(event.target instanceof Element) ||
        event.target.closest("#global-loading-overlay")
      )
        return;
      const target = event.target.closest<HTMLElement>(
        "button, a[href], input, select, textarea, [tabindex]",
      );
      if (target) focusOrigin.current = target;
    };
    document.addEventListener("focusin", rememberFocus, true);
    document.addEventListener("pointerdown", rememberFocus, true);
    return () => {
      document.removeEventListener("focusin", rememberFocus, true);
      document.removeEventListener("pointerdown", rememberFocus, true);
    };
  }, []);
  useLayoutEffect(() => {
    if (!active) return;
    const element = dialog.current!;
    const previousFocus = focusOrigin.current || document.activeElement;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    const main = document.getElementById("main");
    const busy = main?.getAttribute("aria-busy");
    const scene = leaseScene(1, () => {});
    scene.setEligible(true);
    element.showModal();
    element.focus({ preventScroll: true });
    root.style.overflow = "hidden";
    main?.setAttribute("aria-busy", "true");
    return () => {
      element.close();
      scene.release();
      root.style.overflow = overflow;
      if (busy == null) main?.removeAttribute("aria-busy");
      else main?.setAttribute("aria-busy", busy);
      // Form controls may be re-enabled later in this same React commit.
      queueMicrotask(() => {
        if (element.matches(":modal")) return;
        if (
          previousFocus instanceof HTMLElement &&
          previousFocus.isConnected &&
          !previousFocus.matches(":disabled")
        )
          previousFocus.focus({ preventScroll: true });
        else document.getElementById("main")?.focus({ preventScroll: true });
      });
    };
  }, [active]);
  return (
    <dialog
      id="global-loading-overlay"
      ref={dialog}
      className={styles.overlay}
      aria-modal={active || undefined}
      aria-label="Please wait"
      tabIndex={active ? -1 : undefined}
      data-active={active}
      data-cleaning-loader={active ? "overlay" : undefined}
      onCancel={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
        ];
        if (!buttons.length) {
          event.preventDefault();
          dialog.current?.focus({ preventScroll: true });
        } else if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault();
          buttons.at(-1)?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === buttons.at(-1)
        ) {
          event.preventDefault();
          buttons[0]?.focus();
        }
      }}
    >
      <LoadingContent
        key={active ? "active" : "idle"}
        active={active}
        label={pending?.label || "Getting everything ready…"}
      />
    </dialog>
  );
}
