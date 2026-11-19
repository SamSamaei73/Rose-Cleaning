import type { Metadata } from "next";
import "./globals.css";
import "./cinematic.css";
import "./rose-experience.css";

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
    "Professional cleaning in London, from homes and offices to specialist, outdoor and vehicle cleaning. Request a clean or ask Rose for a quote.",
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
