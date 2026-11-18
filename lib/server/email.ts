import "server-only";
import type { Notification } from "../types";
import { isDemo, siteUrl } from "./config";
import { supabaseAdmin } from "./supabase";
import { dbError } from "./http";
export type { EmailEvent } from "../types";
export interface EmailAdapter {
  send(notification: Notification): Promise<{
    status: "submitted" | "preview" | "failed" | "uncertain";
    providerId?: string;
    error?: string;
  }>;
}
export const previewAdapter: EmailAdapter = {
  async send() {
    return { status: "preview" };
  },
};
export const resendAdapter: EmailAdapter = {
  async send(n) {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
      return { status: "failed", error: "Resend is not fully configured." };
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `rose/${n.event_key}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [n.recipient],
          subject: n.subject,
          text: `${n.body}\n\n${siteUrl()}/dashboard`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        return {
          status: "failed",
          error: `Provider rejected the message (HTTP ${response.status}).`,
        };
      const data = await response.json();
      return { status: "submitted", providerId: data.id };
    } catch {
      return {
        status: "uncertain",
        error:
          "Delivery request timed out. Check the provider before retrying; delivery is not confirmed.",
      };
    }
  },
};
export async function dispatchNotifications() {
  if (isDemo()) return;
  const db = supabaseAdmin();
  // Preview is the default even in connected mode. Sending requires two explicit switches.
  const adapter =
    process.env.EMAIL_PROVIDER === "resend" &&
    process.env.EMAIL_SEND_ENABLED === "true"
      ? resendAdapter
      : previewAdapter;
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("status", "queued")
    .order("created_at")
    .limit(20);
  dbError(error);
  for (const notification of data ?? []) {
    const claim = await db.rpc("claim_notification", { p_id: notification.id });
    dbError(claim.error);
    if (!claim.data?.length) continue;
    const result = await adapter.send(notification);
    const update = await db
      .from("notifications")
      .update({
        status: result.status,
        provider_id: result.providerId ?? null,
        error: result.error ?? null,
      })
      .eq("id", notification.id);
    dbError(update.error);
  }
}
