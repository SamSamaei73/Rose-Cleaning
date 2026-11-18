import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server/supabase";
import type { EmailOtpType } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/server/config";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";
  const safe =
    /^\/(dashboard|book|reset-password)(\/|\?|$)/.test(next) &&
    !next.includes("\\")
      ? next
      : "/dashboard";
  try {
    const db = await supabaseServer();
    const code = url.searchParams.get("code");
    const token = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    const result = code
      ? await db.auth.exchangeCodeForSession(code)
      : token &&
          type &&
          ["signup", "recovery", "magiclink", "email"].includes(type)
        ? await db.auth.verifyOtp({
            token_hash: token,
            type: type as EmailOtpType,
          })
        : { error: true };
    if (!result.error) return NextResponse.redirect(new URL(safe, siteUrl()));
  } catch {}
  return NextResponse.redirect(new URL("/login?error=link-expired", siteUrl()));
}
