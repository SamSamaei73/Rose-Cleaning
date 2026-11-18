"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useRef } from "react";
import { brand } from "@/lib/brand";
import { ActionButton } from "./ui";

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <details
      className="mobile-nav"
      ref={menu}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Open navigation">
        <Menu size={23} />
      </summary>
      <nav
        aria-label="Mobile navigation"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a") && menu.current)
            menu.current.open = false;
        }}
      >
        <Link href="/">Home</Link>
        <Link href="/services">Our services</Link>
        <Link href="/about">About Rose</Link>
        <Link href="/contact">Get in touch</Link>
        <Link href="/office-quote">Office cleaning</Link>
        <a href={brand.phoneHref}>{brand.phone}</a>
        <Link className="btn" href="/book">
          Request a clean
        </Link>
        {signedIn && (
          <ActionButton
            path="auth"
            body={{ action: "logout" }}
            className="btn secondary"
          >
            Sign out
          </ActionButton>
        )}
      </nav>
    </details>
  );
}
