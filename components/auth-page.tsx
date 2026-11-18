import { AuthForm, type AuthKind } from "./auth-form";
import { isConfigured, isDemo } from "@/lib/server/config";
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
