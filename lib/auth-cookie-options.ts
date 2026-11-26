// Rose authenticates through server routes; no browser Supabase client needs
// access to the session or PKCE verifier. Keep issuance and refresh consistent.
export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ??
    process.env.NODE_ENV === "production",
  path: "/",
};
