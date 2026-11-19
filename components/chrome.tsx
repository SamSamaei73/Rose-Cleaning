import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import { HeaderShell } from "./header-shell";
import { NavLink } from "./nav-link";
import { Brand } from "./brand";
import { ActionButton } from "./ui";
import { brand } from "@/lib/brand";
import { getSession } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/config";
export function DemoBar() {
  if (!isDemo()) return null;
  return (
    <div className="demo-bar">
      <p>
        <strong>DEMO PREVIEW</strong> · Fictional accounts, estimates &
        availability · Temporary server state · No messages or payments
      </p>
      <div className="role-controls">
        <ActionButton path="demo" body={{ role: "customer" }} className="">
          Customer demo
        </ActionButton>
        <ActionButton path="demo" body={{ role: "staff" }} className="">
          Staff demo
        </ActionButton>
      </div>
    </div>
  );
}
export async function Header() {
  const session = await getSession();
  return (
    <HeaderShell>
      <div className="container header-inner">
        <div className="header-left">
          <MobileNav signedIn={Boolean(session)} />
          <nav className="header-nav" aria-label="Main navigation">
            <NavLink href="/services">Services</NavLink>
            <NavLink href="/about">About Rose</NavLink>
            <NavLink href="/contact">Contact</NavLink>
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
                : "/login"
            }
          >
            {session ? "My account" : "Log in"}
          </Link>
          <Link className="btn small" href="/book">
            Request a clean
          </Link>
        </div>
      </div>
    </HeaderShell>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-signature" aria-hidden="true">
        <span>Rose</span>
      </div>
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
          <Link href="/services">Our cleaning services</Link>
          <Link href="/about">About us</Link>
          <Link href="/office-quote">Office cleaning</Link>
          <Link href="/book">Request a clean</Link>
        </div>
        <div className="footer-links">
          <h3>Here to help</h3>
          <a href={brand.phoneHref}>{brand.phone}</a>
          <a href={brand.secondaryPhoneHref}>{brand.secondaryPhone}</a>
          <a href={`mailto:${brand.email}`}>{brand.email}</a>
          <a href={brand.website}>{brand.websiteLabel}</a>
          <Link href="/contact">Contact the team</Link>
          <Link href="/dashboard">Your account</Link>
          <Link href="/staff">Staff sign in</Link>
        </div>
        <div className="footer-links">
          <h3>The details</h3>
          <Link href="/terms">Terms · draft</Link>
          <Link href="/privacy">Privacy · draft</Link>
          <Link href="/cancellation">Cancellation · draft</Link>
          <a href={brand.instagramHref}>{brand.instagram}</a>
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
