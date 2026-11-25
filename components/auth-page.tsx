import { AuthForm, type AuthKind } from "./auth-form";
import { isConfigured, isDemo } from "@/lib/server/config";
import { getSession } from "@/lib/server/auth";
import { redirect } from "next/navigation";
export async function AuthPage({
  kind,
  searchParams,
}: {
  kind: AuthKind;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next =
    params.next &&
    /^\/(dashboard|book|staff)(\/|\?|$)/.test(params.next) &&
    !params.next.includes("\\")
      ? params.next
      : "/dashboard";
  if ((kind === "login" || kind === "signup") && (await getSession()))
    redirect("/dashboard");
  if (kind === "reset" && !(await getSession()))
    redirect("/forgot-password?error=link-expired");
  return (
    <AuthForm
      kind={kind}
      demo={isDemo()}
      configured={isConfigured()}
      next={next}
      error={
        params.error
          ? "That email link is invalid or has expired. Request a new link and try again."
          : undefined
      }
    />
  );
}
