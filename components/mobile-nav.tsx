"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";
import { brand } from "@/lib/brand";

export function MobileNav() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const desktop = matchMedia("(min-width: 851px)");
    const closeOnDesktop = () => {
      if (desktop.matches && dialog.current?.open) dialog.current.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const close = () => dialog.current?.close();
  const links = [
    ["/", "Home"],
    ["/services", "Services"],
    ["/about", "About"],
    ["/contact", "Contact"],
    ["/office-quote", "Office cleaning"],
  ];
  return (
    <div className="mobile-nav rose-menu">
      <button
        ref={trigger}
        className="menu-trigger"
        type="button"
        aria-label="Open navigation"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="rose-navigation"
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        <span className="menu-lines" aria-hidden="true">
          <span />
          <span />
        </span>
        <span>Menu</span>
      </button>
      <dialog
        ref={dialog}
        id="rose-navigation"
        className="navigation-dialog"
        aria-label="Rose navigation"
        onClose={() => {
          setOpen(false);
          if (trigger.current?.getClientRects().length) trigger.current.focus();
          else
            (
              document.querySelector<HTMLElement>(
                '.header-nav a[aria-current="page"]',
              ) || document.querySelector<HTMLElement>(".header-nav a")
            )?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              "a[href], button:not(:disabled)",
            ),
          ].filter((control) => control.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="navigation-sheet">
          <div className="navigation-top">
            <a
              href={brand.phoneHref}
              className="navigation-phone"
            >
              Call Rose
            </a>
            <div onClick={close}>
              <Brand compact />
            </div>
            <button className="menu-close" onClick={close} autoFocus>
              Close
            </button>
          </div>
          <div className="navigation-body">
            <nav
              aria-label="Mobile navigation"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) close();
              }}
            >
              {links.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="navigation-photo">
              <Image
                src="/images/photography/regular-whatsapp.webp"
                alt="A kitchen cabinet being carefully wiped with a cloth"
                fill
                sizes="(max-width: 850px) 1px, 40vw"
              />
            </div>
          </div>
          <div className="navigation-bottom">
            <a href={brand.phoneHref}>
              {brand.phone}
            </a>
            <a href={`mailto:${brand.email}`}>
              {brand.email}
            </a>
          </div>
        </div>
      </dialog>
    </div>
  );
}
