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
          reply_to: n.reply_to || undefined,
          // Plain text treats customer content literally: no unescaped HTML.
          text: n.submission_id
            ? n.body
            : `${n.body}\n\n${siteUrl()}/dashboard`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        return {
          status: response.status >= 500 ? "uncertain" : "failed",
          error: `Provider rejected the message (HTTP ${response.status}).`,
        };
      const data = await response.json();
      if (typeof data.id !== "string" || !data.id)
        return {
          status: "uncertain",
          error:
            "Provider acceptance could not be verified. Check the provider logs.",
        };
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
export async function dispatchNotifications(submissionId?: string) {
  if (isDemo()) return;
  const db = supabaseAdmin();
  // Preview is the default even in connected mode. Sending requires two explicit switches.
  const adapter =
    process.env.EMAIL_PROVIDER === "resend" &&
    process.env.EMAIL_SEND_ENABLED === "true"
      ? resendAdapter
      : previewAdapter;
  dbError((await db.rpc("recover_notification_claims")).error);
  let query = db
    .from("notifications")
    .select("*")
    .eq("status", "queued")
    .order("created_at")
    .limit(20);
  if (submissionId) query = query.eq("submission_id", submissionId);
  const { data, error } = await query;
  dbError(error);
  for (const notification of data ?? []) {
    const claim = await db.rpc("claim_notification", { p_id: notification.id });
    dbError(claim.error);
    if (!claim.data?.length) continue;
    const claimed: Notification = claim.data[0];
    const result =
      claimed.submission_id && adapter === previewAdapter
        ? {
            status: "failed" as const,
            error:
              "Contact forwarding is disabled. Configure Resend, EMAIL_FROM and EMAIL_SEND_ENABLED before retrying.",
          }
        : await adapter.send(claimed);
    const update = await db
      .from("notifications")
      .update({
        status: result.status,
        provider_id: result.providerId ?? null,
        error: result.error ?? null,
        accepted_at:
          result.status === "submitted" ? new Date().toISOString() : null,
      })
      .eq("id", notification.id);
    dbError(update.error);
  }
}
