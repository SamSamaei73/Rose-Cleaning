import type { Metadata } from "next";
import "./globals.css";

// The shared header and demo indicator depend on the current session and
// runtime configuration, including when a build was created without secrets.
export const dynamic = "force-dynamic";
import { DemoBar, Footer, Header } from "@/components/chrome";
import { isDemo } from "@/lib/server/config";
export const metadata: Metadata = {
  title: {
    default: "Rose Professional Cleaning | A fresh home, more time for you",
    template: "%s | Rose Professional Cleaning",
  },
  description:
    "Managed home cleaning in London. Explore regular, one-off, deep and end of tenancy cleaning and request your preferred time with Rose.",
  robots:
    process.env.APP_MODE === "demo"
      ? { index: false, follow: false }
      : undefined,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" data-scroll-behavior="smooth">
      <body data-mode={isDemo() ? "demo" : "connected"}>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <DemoBar />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
