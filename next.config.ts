import type { NextConfig } from "next";
const config: NextConfig = {
  // Only non-secret release identity belongs in build-time env configuration.
  env: {
    ROSE_RELEASE_SHA: process.env.ROSE_RELEASE_SHA || "development",
    ROSE_RELEASE_ID: process.env.ROSE_RELEASE_ID || "development",
  },
  output: process.env.ROSE_BUILD_TARGET === "cpanel" ? "standalone" : undefined,
  poweredByHeader: false,
  devIndicators: false,
  // Verification/recovery links contain one-time secrets; do not log their URLs.
  logging: { incomingRequests: { ignore: [/\/auth\/callback/] } },
  turbopack: { root: process.cwd() },
  async redirects() {
    // Keep auth cookies, callback URLs and form origins on the same public host.
    return [{
      source: "/:path*",
      has: [{ type: "host" as const, value: "www.rosecleaning.uk" }],
      destination: "https://rosecleaning.uk/:path*",
      permanent: true,
    }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
      {
        source: "/auth/callback",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};
export default config;
