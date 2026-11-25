import "server-only";
import { z } from "zod";
import { contactSchema } from "../validation";
import { dbError } from "./http";
import { supabaseAdmin } from "./supabase";
import { dispatchNotifications } from "./email";

export function contactRecipient() {
  return z
    .email()
    .parse(process.env.CONTACT_TO_EMAIL || "rose.cleaning.uk@icloud.com");
}
export function contactReceipt(status: string, id: string) {
  const reference = `Reference: ${id}.`;
  if (status === "submitted")
    return {
      saved: true,
      emailStatus: "accepted",
      reference: id,
      message: `Your message has been saved and accepted by our email provider for forwarding to Rose. Delivery is not yet confirmed. ${reference}`,
    };
  if (["failed", "preview", "uncertain"].includes(status))
    return {
      saved: true,
      emailStatus: status,
      reference: id,
      message: `Your message has been saved, but email forwarding ${status === "uncertain" ? "could not be confirmed" : "is currently unavailable"}. Rose can retrieve it using this reference. For urgent help, call 07775 170005. ${reference}`,
    };
  return {
    saved: true,
    emailStatus: "queued",
    reference: id,
    message: `Your message has been saved and is awaiting email processing. For urgent help, call 07775 170005. ${reference}`,
  };
}
export async function saveContact(raw: z.infer<typeof contactSchema>) {
  const value = contactSchema.parse(raw);
  const db = supabaseAdmin();
  const { data: id, error } = await db.rpc("submit_contact", {
    p_key: value.idempotencyKey,
    p_value: value,
    p_recipient: contactRecipient(),
  });
  dbError(error);
  // The durable queue remains traceable even if dispatch or its final write fails.
  try {
    await dispatchNotifications(id);
  } catch {
    return contactReceipt("queued", id);
  }
  const notification = await db
    .from("notifications")
    .select("status")
    .eq("submission_id", id)
    .single();
  return contactReceipt(
    notification.error ? "queued" : notification.data.status,
    id,
  );
}
