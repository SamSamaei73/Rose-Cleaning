import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireConfiguration } from "./config";
import { authCookieOptions } from "../auth-cookie-options";
import { fetchWithTimeout } from "../network";
import { cache } from "react";
export const supabaseServer = cache(async () => {
  requireConfiguration();
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: authCookieOptions,
      global: { fetch: fetchWithTimeout },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server components cannot refresh cookies; proxy performs refresh. */
          }
        },
      },
    },
  );
});
export function supabaseAdmin() {
  requireConfiguration();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: fetchWithTimeout },
    },
  );
}
