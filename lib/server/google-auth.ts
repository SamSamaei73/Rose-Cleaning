import "server-only";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { authCookieOptions } from "../auth-cookie-options";
import { requireConfiguration, siteUrl } from "./config";
import { AppError, rateLimit } from "./http";
import { seal, unseal } from "./signing";
import { supabaseAdmin, supabaseServer } from "./supabase";

const contextCookie = "rose_google_context";
const contextLifetime = 10 * 60;
const unavailable =
  "Google sign-in is temporarily unavailable. Please try again shortly or use your email and password.";

type GoogleContext = {
  intent: "login" | "signup";
  next: string;
  expires: number;
};

function safeDestination(value?: string) {
  return value &&
    /^\/(dashboard|book|staff)(\/|\?|$)/.test(value) &&
    !value.includes("\\")
    ? value
    : "/dashboard";
}

export async function startGoogleSignIn(
  request: Request,
  input: { intent: "login" | "signup"; next?: string },
) {
  requireConfiguration();
  try {
    await rateLimit(request, "auth:google", 15);
    // Supabase returns an authorization URL even when a provider is disabled.
    // Check availability before sending the customer away from the form.
    const settingsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!settingsResponse.ok) throw new Error("AUTH_SETTINGS_UNAVAILABLE");
    const settings = (await settingsResponse.json()) as {
      external?: { google?: boolean };
    };
    if (settings.external?.google !== true) {
      console.error("Google sign-in unavailable: provider is not enabled.");
      throw new AppError(unavailable, 503);
    }

    const db = await supabaseServer();
    const { data, error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: {
        // A fixed callback can be allowlisted exactly in Supabase.
        redirectTo: `${siteUrl()}/auth/callback?provider=google`,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error || !data.url) throw new Error("GOOGLE_AUTH_START_FAILED");

    (await cookies()).set(
      contextCookie,
      seal({
        intent: input.intent,
        next: safeDestination(input.next),
        expires: Date.now() + contextLifetime * 1000,
      } satisfies GoogleContext),
      { ...authCookieOptions, maxAge: contextLifetime },
    );
    return { redirect: data.url };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.message === "RATE_LIMIT") throw error;
    console.error("Unable to start Google sign-in", {
      type: error instanceof Error ? error.name : "UnknownError",
    });
    throw new AppError(unavailable, 503);
  }
}

async function consumeContext() {
  const jar = await cookies();
  const token = jar.get(contextCookie)?.value;
  jar.delete(contextCookie);
  const context = token ? unseal<GoogleContext>(token) : null;
  if (
    !context ||
    !["login", "signup"].includes(context.intent) ||
    typeof context.next !== "string" ||
    typeof context.expires !== "number" ||
    context.expires <= Date.now()
  )
    return null;
  return { ...context, next: safeDestination(context.next) };
}

async function ensureCustomerProfile(user: User) {
  if (!user.email || !user.email_confirmed_at)
    throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
  const name = user.user_metadata.full_name ?? user.user_metadata.name;
  // The signup trigger normally creates this row. Repair a missing row using
  // only the authenticated identity, without overwriting an existing profile.
  const { error } = await supabaseAdmin().from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: typeof name === "string" ? name.trim().slice(0, 120) : "",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("Unable to prepare Google customer profile", { code: error.code });
    throw new Error("GOOGLE_PROFILE_UNAVAILABLE");
  }
}

export async function finishGoogleSignIn(url: URL) {
  const context = await consumeContext();
  const failure = new URL(
    context?.intent === "signup" ? "/signup" : "/login",
    siteUrl(),
  );
  failure.searchParams.set("next", context?.next || "/dashboard");
  failure.searchParams.set(
    "error",
    context ? "google-sign-in" : "google-session-expired",
  );
  if (!context) return failure;
  if (url.searchParams.has("error")) {
    if (url.searchParams.get("error") === "access_denied")
      failure.searchParams.set("error", "google-cancelled");
    return failure;
  }
  const code = url.searchParams.get("code");
  if (!code) return failure;

  try {
    const db = await supabaseServer();
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (error || !data.user || !data.session) {
      console.error("Google authorization code exchange failed", {
        code: error?.code || "NO_SESSION",
        status: error?.status,
      });
      return failure;
    }
    try {
      await ensureCustomerProfile(data.user);
    } catch (error) {
      // Do not strand a signed-in customer behind an unusable dashboard.
      await db.auth.signOut({ scope: "local" });
      throw error;
    }
    return new URL(context.next, siteUrl());
  } catch (error) {
    console.error("Unable to complete Google sign-in", {
      type: error instanceof Error ? error.name : "UnknownError",
    });
    return failure;
  }
}
