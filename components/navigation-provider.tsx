"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useTransition,
  type ReactNode,
} from "react";
import {
  usePathname,
  useRouter as useNextRouter,
  useSearchParams,
} from "next/navigation";
import { loadingProgress } from "@/lib/client/loading-progress";
import { navigationProgress } from "@/lib/client/navigation-progress";

type Router = ReturnType<typeof useNextRouter>;
const RouterContext = createContext<Router | null>(null);

/** Track actual React router transitions, including programmatic navigation. */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useNextRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    if (pending)
      return loadingProgress.begin("router", "Opening your page…", 1);
  }, [pending]);
  const tracked = useMemo<Router>(
    () => ({
      ...router,
      push: (href, options) =>
        startTransition(() => router.push(href, options)),
      replace: (href, options) =>
        startTransition(() => router.replace(href, options)),
      refresh: () => startTransition(() => router.refresh()),
      back: () => router.back(),
      forward: () => router.forward(),
    }),
    [router],
  );
  return (
    <RouterContext.Provider value={tracked}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const router = useContext(RouterContext);
  if (!router)
    throw new Error("NavigationProvider is missing from the root layout.");
  return router;
}

/** popstate starts before React commits a restored page; the URL alone is not readiness. */
export function NavigationHistory() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const committed = `${pathname}${search ? `?${search}` : ""}`;
  const current = useRef(committed);
  useEffect(() => {
    current.current = committed;
    navigationProgress.commit(committed);
  }, [committed]);
  useEffect(() => {
    let frame = 0;
    const onPopState = () => {
      cancelAnimationFrame(frame);
      const target = location.pathname + location.search;
      if (target === current.current) return navigationProgress.cancel();
      navigationProgress.start(target);
      const waitForCommit = () => {
        // Also handles a guard redirecting a history entry back to the current page.
        if (location.pathname + location.search === current.current)
          navigationProgress.cancel();
        else frame = requestAnimationFrame(waitForCommit);
      };
      frame = requestAnimationFrame(waitForCommit);
    };
    const onPageShow = (event: PageTransitionEvent) => {
      // A restored document can retain a disabled sign-in form from a full OAuth redirect.
      if (event.persisted) location.reload();
    };
    window.addEventListener("popstate", onPopState, true);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", onPopState, true);
      window.removeEventListener("pageshow", onPageShow);
      cancelAnimationFrame(frame);
      navigationProgress.cancel();
    };
  }, []);
  return null;
}
