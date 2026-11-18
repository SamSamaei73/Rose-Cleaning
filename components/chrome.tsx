import Link from "next/link";
import { ArrowUpRight, Menu, Phone, MapPin } from "lucide-react";
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
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/services">Our services</Link>
          <Link href="/about">About Rose</Link>
          <Link href="/contact">Get in touch</Link>
        </nav>
        <div className="header-right">
          <a href={brand.phoneHref} className="header-contact">
            <Phone size={14} />
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
            Request a clean <ArrowUpRight size={15} />
          </Link>
          <details className="mobile-nav">
            <summary aria-label="Open navigation">
              <Menu size={23} />
            </summary>
            <nav aria-label="Mobile navigation">
              <Link href="/">Home</Link>
              <Link href="/services">Our services</Link>
              <Link href="/about">About Rose</Link>
              <Link href="/contact">Get in touch</Link>
              <Link href="/office-quote">Office cleaning</Link>
              <a href={brand.phoneHref}>{brand.phone}</a>
              <Link className="btn" href="/book">
                Request a clean
              </Link>
              {session && (
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
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p style={{ maxWidth: 250, marginTop: 20 }}>
            A fresh home. A little more room for life.
            <br />
            Managed cleaning services in London.
          </p>
          <p
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <MapPin size={13} /> Service areas to be confirmed
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
          <Link href="/contact">Contact the team</Link>
          <Link href="/dashboard">Your account</Link>
          <Link href="/staff">Staff sign in</Link>
        </div>
        <div className="footer-links">
          <h3>The details</h3>
          <Link href="/terms">Terms · draft</Link>
          <Link href="/privacy">Privacy · draft</Link>
          <Link href="/cancellation">Cancellation · draft</Link>
          <span className="small muted">No payment taken online</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Rose Professional Cleaning</span>
        <span>
          Provisional brand mark · Final logo and photography pending owner
          approval
        </span>
        <span>Made for a little more peace of mind.</span>
      </div>
    </footer>
  );
}
