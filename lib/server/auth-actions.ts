import "server-only";
import { cookies } from "next/headers";
import { authSchema } from "../validation";
import { isDemo, siteUrl } from "./config";
import { AppError, rateLimit } from "./http";
import { supabaseServer } from "./supabase";
import { startGoogleSignIn } from "./google-auth";

export async function authenticate(request: Request, body: unknown) {
  const input = authSchema.parse(body);
  // Logout must remain available even when login attempts have hit their limit.
  if (input.action === "logout") {
    if (isDemo()) (await cookies()).delete("rose_demo");
    else {
      const { error } = await (
        await supabaseServer()
      ).auth.signOut({ scope: "local" });
      if (error) throw new AppError("Unable to sign out. Please try again.");
    }
    return { redirect: "/login" };
  }
  if (isDemo())
    throw new AppError(
      "Real account access is unavailable in the separate demo. Use the connected application to register.",
    );
  if (input.action === "google") return startGoogleSignIn(request, input);
  await rateLimit(request, `auth:${input.action}`, 15);
  if (
    ["signup", "resend", "forgot", "magic"].includes(input.action) &&
    "email" in input
  ) {
    await rateLimit(
      request,
      `auth-email-minute:${input.email.toLowerCase()}`,
      1,
      60,
    );
    await rateLimit(
      request,
      `auth-email-hour:${input.email.toLowerCase()}`,
      5,
      3600,
    );
  }
  const db = await supabaseServer();
  const redirectTo = `${siteUrl()}/auth/callback?next=/dashboard`;
  if (input.action === "login") {
    const { error } = await db.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error)
      throw new AppError(
        error.code === "email_not_confirmed"
          ? "Please verify your email before logging in."
          : "We could not sign you in. Check your email and password.",
      );
    return { redirect: "/dashboard" };
  }
  if (input.action === "signup") {
    const { data, error } = await db.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.name }, emailRedirectTo: redirectTo },
    });
    if (error)
      throw new AppError(
        "Unable to register. Check your details or try signing in.",
      );
    return data.session
      ? { redirect: "/dashboard" }
      : {
          verification: true,
          message:
            "Check your email to verify your account, then log in. If an account already exists, sign in or reset your password.",
        };
  }
  if (input.action === "resend") {
    const { error } = await db.auth.resend({
      type: "signup",
      email: input.email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error)
      throw new AppError(
        "Unable to resend right now. Wait a minute and try again.",
      );
    return {
      message:
        "If this account needs verification, a new link has been requested. Check your inbox and junk folder.",
      verification: true,
    };
  }
  if (input.action === "forgot") {
    const { error } = await db.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
    });
    if (error)
      throw new AppError(
        "Unable to request a reset link right now. Please try again.",
      );
    return {
      message:
        "If an account matches that email, a reset link has been requested. Check your inbox.",
    };
  }
  if (input.action === "magic") {
    const { error } = await db.auth.signInWithOtp({
      email: input.email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    if (error)
      throw new AppError(
        "Unable to request a sign-in link right now. Please try again.",
      );
    return {
      message:
        "If an account matches that email, a sign-in link has been requested.",
    };
  }
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user?.email_confirmed_at) throw new Error("UNAUTHENTICATED");
  const { error } = await db.auth.updateUser({ password: input.password });
  if (error)
    throw new AppError(
      "Unable to update your password. Request a new reset link and try again.",
    );
  return { message: "Your password has been updated.", redirect: "/dashboard" };
}
