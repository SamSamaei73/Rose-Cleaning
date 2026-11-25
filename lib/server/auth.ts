import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Session } from "../types";
import { isConfigured, isDemo } from "./config";
import { demoSession } from "./demo";
import { supabaseServer } from "./supabase";
export const getSession = cache(async (): Promise<Session | null> => {
  if (isDemo()) return demoSession();
  if (!isConfigured()) return null;
  const db = await supabaseServer();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return null;
  const [
    { data: profile, error: profileError },
    { data: staff, error: staffError },
  ] = await Promise.all([
    db
      .from("profiles")
      .select("id,full_name,email,phone")
      .eq("id", user.id)
      .single(),
    db
      .from("staff_members")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (profileError || staffError)
    throw new Error("Unable to load your account. Please try again.");
  return { user: profile, role: staff ? "staff" : "customer", demo: false };
});
export async function requireSession(staff = false) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (staff && session.role !== "staff") throw new Error("FORBIDDEN");
  return session;
}
export async function requirePageSession(staff = false) {
  if (!isDemo() && !isConfigured()) redirect("/login");
  const session = await getSession();
  if (!session) redirect(`/login?next=${staff ? "/staff" : "/dashboard"}`);
  if (staff && session.role !== "staff") redirect("/dashboard");
  return session;
}
