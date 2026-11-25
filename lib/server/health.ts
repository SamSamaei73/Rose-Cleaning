import "server-only";
import { isConfigured, isDemo } from "./config";
import { supabaseAdmin } from "./supabase";

// These two public identifiers are fixed at build time by next.config.ts.
export function releaseIdentity() {
  return {
    revision: process.env.ROSE_RELEASE_SHA || "development",
    release: process.env.ROSE_RELEASE_ID || "development",
  };
}

export async function productionReady(): Promise<boolean> {
  if (isDemo() || !isConfigured()) return false;
  try {
    const { error } = await supabaseAdmin()
      // Check the current schema without retrieving customer message content.
      .from("notifications")
      .select("id,submission_id,reply_to,accepted_at")
      .limit(0)
      .abortSignal(AbortSignal.timeout(4000));
    return !error;
  } catch {
    return false;
  }
}
