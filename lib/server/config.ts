import "server-only";
import { randomBytes } from "node:crypto";
export const isDemo = () => process.env.APP_MODE === "demo";
export const isConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.APP_SECRET &&
    process.env.APP_SECRET.length >= 32,
  );
export function requireConfiguration() {
  if (!isConfigured()) throw new Error("SETUP_REQUIRED");
}
export function appSecret() {
  if (process.env.APP_SECRET && process.env.APP_SECRET.length >= 32)
    return process.env.APP_SECRET;
  if (!isDemo()) throw new Error("SETUP_REQUIRED");
  const g = globalThis as typeof globalThis & { roseSecret?: string };
  return (g.roseSecret ??= randomBytes(32).toString("hex"));
}
export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
