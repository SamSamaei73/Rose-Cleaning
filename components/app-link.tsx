"use client";
import NextLink from "next/link";
import { useRef, type ComponentProps } from "react";
import { useRouter } from "./navigation-provider";
import { navigationProgress } from "@/lib/client/navigation-progress";

/** Preserve Next's anchors, prefetching and modified clicks; track the whole transition. */
export default function AppLink({
  ref: forwardedRef,
  children,
  onNavigate,
  replace,
  scroll,
  transitionTypes,
  ...props
}: ComponentProps<typeof NextLink>) {
  const anchor = useRef<HTMLAnchorElement | null>(null);
  const router = useRouter();
  return (
    <NextLink
      {...props}
      replace={replace}
      scroll={scroll}
      transitionTypes={transitionTypes}
      ref={(element) => {
        anchor.current = element;
        if (typeof forwardedRef === "function") return forwardedRef(element);
        if (forwardedRef) forwardedRef.current = element;
      }}
      onNavigate={(event) => {
        let cancelled = false;
        onNavigate?.({
          preventDefault: () => {
            cancelled = true;
            event.preventDefault();
          },
        });
        if (cancelled || !anchor.current) return;
        event.preventDefault();
        navigationProgress.cancel();
        router[replace ? "replace" : "push"](anchor.current.href, {
          scroll,
          transitionTypes,
        });
      }}
    >
      {children}
    </NextLink>
  );
}
