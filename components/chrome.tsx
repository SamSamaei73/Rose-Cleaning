import Link from "@/components/app-link";
import Image from "next/image";
import { MobileNav } from "./mobile-nav";
import { HeaderShell } from "./header-shell";
import { NavLink } from "./nav-link";
import { Brand } from "./brand";
import { ActionButton } from "./ui";
import { brand } from "@/lib/brand";
import { getSession } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/config";
import { customerEntryHref } from "@/lib/navigation";
import type { Session } from "@/lib/types";
export function DemoBar() {
  if (!isDemo()) return null;
  return (
    <div className="demo-bar">
      <p>
        <strong>DEMO PREVIEW</strong> · Fictional accounts, estimates &
        availability · Temporary server state · No messages or payments
      </p>
      <div className="role-controls">
        <ActionButton
          path="demo"
          body={{ role: "customer" }}
          className="btn secondary small"
        >
          Customer demo
        </ActionButton>
        <ActionButton
          path="demo"
          body={{ role: "staff" }}
          className="btn secondary small"
        >
          Staff demo
        </ActionButton>
      </div>
    </div>
  );
}
export async function Header() {
  const session = await getSession();
  return <HeaderFrame session={session} />;
}
export function HeaderFallback() {
  return (
    <HeaderShell>
      <div className="container header-inner" aria-hidden="true" inert>
        <div />
        <div className="header-placeholder-logo">
          <Image
            src={brand.logo}
            alt=""
            width={brand.logoWidth}
            height={brand.logoHeight}
            sizes="92px"
          />
        </div>
        <div />
      </div>
    </HeaderShell>
  );
}
function HeaderFrame({ session }: { session: Session | null }) {
  return (
    <HeaderShell>
      <div className="container header-inner">
        <div className="header-left">
          <MobileNav />
          <nav className="header-nav" aria-label="Main navigation">
            <NavLink href="/" appearance="text">
              Home
            </NavLink>
            <NavLink href="/services" appearance="text">
              Services
            </NavLink>
            <NavLink href="/about" appearance="text">
              About
            </NavLink>
            <NavLink href="/contact" appearance="text">
              Contact
            </NavLink>
          </nav>
        </div>
        <Brand compact />
        <div className="header-right">
          <a href={brand.phoneHref} className="header-contact">
            {brand.phone}
          </a>
          <Link
            className="header-login"
            href={
              session
                ? session.role === "staff"
                  ? "/staff"
                  : "/dashboard"
                : customerEntryHref(false)
            }
          >
            {session ? "Dashboard" : "Login"}
          </Link>
        </div>
      </div>
    </HeaderShell>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p style={{ maxWidth: 270, marginTop: 20 }}>
            Professional cleaning across London.
          </p>
          <p className="small" style={{ marginTop: 14 }}>
            Exact service areas to be confirmed.
          </p>
        </div>
        <div className="footer-links">
          <h3>Explore Rose</h3>
          <Link className="btn secondary small footer-action" href="/services">
            Our cleaning services
          </Link>
          <Link className="btn secondary small footer-action" href="/about">
            About us
          </Link>
          <Link
            className="btn secondary small footer-action"
            href="/office-quote"
          >
            Office cleaning
          </Link>
          <Link className="btn secondary small footer-action" href="/book">
            Request a clean
          </Link>
        </div>
        <div className="footer-links">
          <h3>Here to help</h3>
          <a
            className="btn secondary small footer-action"
            href={brand.phoneHref}
          >
            {brand.phone}
          </a>
          <a
            className="btn secondary small footer-action"
            href={brand.secondaryPhoneHref}
          >
            {brand.secondaryPhone}
          </a>
          <a
            className="btn secondary small footer-action"
            href={`mailto:${brand.email}`}
          >
            {brand.email}
          </a>
          <a className="btn secondary small footer-action" href={brand.website}>
            {brand.websiteLabel}
          </a>
          <Link className="btn secondary small footer-action" href="/contact">
            Contact the team
          </Link>
          <Link className="btn secondary small footer-action" href="/dashboard">
            Your account
          </Link>
          <Link className="btn secondary small footer-action" href="/staff">
            Staff sign in
          </Link>
        </div>
        <div className="footer-links">
          <h3>The details</h3>
          <Link className="btn secondary small footer-action" href="/terms">
            Terms · draft
          </Link>
          <Link className="btn secondary small footer-action" href="/privacy">
            Privacy · draft
          </Link>
          <Link
            className="btn secondary small footer-action"
            href="/cancellation"
          >
            Cancellation · draft
          </Link>
          <a
            className="btn secondary small footer-action"
            href={brand.instagramHref}
          >
            {brand.instagram}
          </a>
          <span className="small muted">No payment taken online</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Rose Professional Cleaning</span>
        <span>
          Stock photographs illustrate services; they do not depict Rose staff
          or customer results.
        </span>
      </div>
    </footer>
  );
}
