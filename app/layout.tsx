import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import "./cinematic.css";
import "./rose-experience.css";
import "./design-system.css";

const manrope = localFont({
  src: "../public/fonts/manrope-latin-variable.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

// The shared header and demo indicator depend on the current session and
// runtime configuration, including when a build was created without secrets.
export const dynamic = "force-dynamic";
import { DemoBar, Footer, Header, HeaderFallback } from "@/components/chrome";
import { isDemo } from "@/lib/server/config";
import {
  CleaningLoader,
  GlobalLoadingOverlay,
  PageReadiness,
} from "@/components/cleaning-loader";
import {
  NavigationHistory,
  NavigationProvider,
} from "@/components/navigation-provider";
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
    <html
      lang="en-GB"
      className={manrope.variable}
      data-scroll-behavior="smooth"
    >
      <body data-mode={isDemo() ? "demo" : "connected"}>
        <NavigationProvider>
          <GlobalLoadingOverlay />
          <Suspense fallback={null}>
            <NavigationHistory />
          </Suspense>
          <div id="application">
            <a className="skip btn" href="#main">
              Skip to content
            </a>
            <DemoBar />
            <Suspense
              fallback={
                <>
                  <HeaderFallback />
                  <CleaningLoader scope="shell" />
                </>
              }
            >
              <Header />
            </Suspense>
            <main id="main" tabIndex={-1}>
              <Suspense
                fallback={
                  <CleaningLoader
                    scope="page"
                    label="Preparing your next fresh start…"
                  />
                }
              >
                <PageReadiness>{children}</PageReadiness>
              </Suspense>
            </main>
            <Footer />
          </div>
        </NavigationProvider>
      </body>
    </html>
  );
}
