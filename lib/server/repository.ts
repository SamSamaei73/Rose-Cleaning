import "server-only";
import { randomUUID } from "node:crypto";
import {
  demoCatalogue,
  emptyPricing,
  preferredAvailability,
} from "../catalogue";
import type {
  Address,
  Booking,
  BookingDraft,
  BookingEvent,
  Catalogue,
  Note,
  Profile,
  Proposal,
  Quote,
  Session,
} from "../types";
import { calculateQuote } from "../pricing";
import { reservationRange, slotReason } from "../scheduling";
import { demoIdentity, demoState } from "./demo";
import { isDemo } from "./config";
import { supabaseAdmin, supabaseServer } from "./supabase";
import { AppError, dbError } from "./http";
import { digest, seal, unseal } from "./signing";

export async function getCatalogue(staff = false): Promise<Catalogue> {
  if (isDemo())
    return (await demoIdentity())
      ? (await demoState()).catalogue
      : structuredClone(demoCatalogue);
  const db = await supabaseServer();
  const admin = supabaseAdmin();
  const [services, pricing, availability, policy] = await Promise.all([
    db.from("services").select("*").order("sort_order"),
    admin
      .from("pricing_versions")
      .select("config,version")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("operational_settings").select("config").eq("id", true).single(),
    db
      .from("policy_versions")
      .select("id,title,content")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  [services, pricing, availability, policy].forEach((r) => dbError(r.error));
  return {
    services: staff
      ? (services.data ?? [])
      : (services.data ?? []).filter((s) => s.active),
    pricing: pricing.data
      ? {
          ...pricing.data.config,
          version: pricing.data.version,
          approved: true,
          demo: false,
        }
      : emptyPricing,
    availability: availability.data?.config ?? preferredAvailability,
    policy: policy.data,
  };
}
export async function listBookings(session: Session): Promise<Booking[]> {
  if (isDemo())
    return (await demoState()).bookings
      .filter(
        (b) => session.role === "staff" || b.customer_id === session.user.id,
      )
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at));
  const db = await supabaseServer();
  const { data, error } = await db
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  dbError(error);
  return data ?? [];
}
export async function getBooking(
  id: string,
  session: Session,
): Promise<{ booking: Booking; events: BookingEvent[]; notes: Note[] }> {
  if (isDemo()) {
    const state = await demoState();
    const booking = state.bookings.find(
      (b) =>
        b.id === id &&
        (session.role === "staff" || b.customer_id === session.user.id),
    );
    if (!booking) throw new Error("NOT_FOUND");
    return {
      booking,
      events: state.events.filter((e) => e.booking_id === id),
      notes:
        session.role === "staff"
          ? state.notes.filter((n) => n.booking_id === id)
          : [],
    };
  }
  const db = await supabaseServer();
  const [b, e, n] = await Promise.all([
    db.from("bookings").select("*").eq("id", id).maybeSingle(),
    db
      .from("booking_events")
      .select("*")
      .eq("booking_id", id)
      .order("created_at"),
    session.role === "staff"
      ? db
          .from("internal_notes")
          .select("*")
          .eq("booking_id", id)
          .order("created_at")
      : Promise.resolve({ data: [], error: null }),
  ]);
  [b, e, n].forEach((r) => dbError(r.error));
  if (!b.data) throw new Error("NOT_FOUND");
  return { booking: b.data, events: e.data ?? [], notes: n.data ?? [] };
}
export async function reservations(): Promise<Booking[]> {
  if (isDemo())
    return (await demoIdentity()) ? (await demoState()).bookings : [];
  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select("id,draft,quote,status,reserved_start,reserved_end")
    .not("reserved_start", "is", null)
    .gte("reserved_end", new Date().toISOString());
  dbError(error);
  return (data ?? []) as Booking[];
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function issueQuote(draft: BookingDraft, quote: Quote) {
  return seal({
    fingerprint: digest(stable({ draft, quote })),
    expires: Date.now() + 30 * 60000,
  });
}
export function verifyReviewedQuote(
  token: string,
  draft: BookingDraft,
  quote: Quote,
) {
  const signed = unseal<{ fingerprint: string; expires: number }>(token);
  if (
    !signed ||
    signed.expires < Date.now() ||
    signed.fingerprint !== digest(stable({ draft, quote }))
  )
    throw new AppError(
      "The estimate or your details have changed. Please review the updated summary before submitting.",
      409,
      { quote, quoteToken: issueQuote(draft, quote) },
    );
}
function demoEvent(
  state: Awaited<ReturnType<typeof demoState>>,
  booking: Booking,
  session: Session,
  message: string,
) {
  const titles = {
    pending: "Request received — awaiting confirmation from Rose",
    confirmed: "Your clean is confirmed",
    alternative_proposed: "Rose has proposed an alternative for your clean",
    completed: "Your cleaning visit is complete",
    cancelled: "Your cleaning request has been cancelled",
    rejected: "An update on your cleaning request",
  };
  state.events.push({
    id: randomUUID(),
    booking_id: booking.id,
    actor_id: session.user.id,
    status: booking.status,
    message,
    created_at: new Date().toISOString(),
  });
  const eventKey = `${booking.id}:${booking.revision}`;
  if (!state.notifications.some((n) => n.event_key === eventKey))
    state.notifications.push({
      id: randomUUID(),
      event_key: eventKey,
      event_type:
        booking.status === "pending"
          ? "request_received"
          : booking.status === "confirmed"
            ? "booking_confirmed"
            : booking.status === "alternative_proposed"
              ? "alternative_proposed"
              : booking.status === "cancelled"
                ? "booking_cancelled"
                : "booking_changed",
      recipient: booking.customer_email,
      subject: titles[booking.status],
      body: `${titles[booking.status]}\n\n${message}\n\nReference: ${booking.id.slice(0, 8)}\nSign in to your Rose account to review the details.`,
      status: "preview",
      provider_id: null,
      created_at: new Date().toISOString(),
      error: null,
    });
}
export async function submitBooking(
  session: Session,
  input: {
    draft: BookingDraft;
    quoteToken: string;
    idempotencyKey: string;
    policyVersion: string | null;
  },
) {
  const previous = (await listBookings(session)).find(
    (b) =>
      b.customer_id === session.user.id &&
      b.idempotency_key === input.idempotencyKey,
  );
  if (previous) return previous;
  const catalogue = await getCatalogue();
  const quote = calculateQuote(input.draft, catalogue);
  verifyReviewedQuote(input.quoteToken, input.draft, quote);
  if ((catalogue.policy?.id ?? null) !== input.policyVersion)
    throw new Error("POLICY_CHANGED");
  const reason = slotReason(
    input.draft.date,
    input.draft.windowId,
    quote,
    catalogue.availability,
    await reservations(),
  );
  if (reason) throw new AppError(reason, 409);
  if (isDemo()) {
    const state = await demoState();
    // No await within the critical mutation: one demo process has atomic writes.
    const existing = state.bookings.find(
      (b) =>
        b.customer_id === session.user.id &&
        b.idempotency_key === input.idempotencyKey,
    );
    if (existing) return existing;
    const now = new Date().toISOString();
    const booking: Booking = {
      id: randomUUID(),
      customer_id: session.user.id,
      customer_name: session.user.full_name,
      customer_email: session.user.email,
      customer_phone: session.user.phone,
      idempotency_key: input.idempotencyKey,
      status: "pending",
      draft: input.draft,
      quote,
      proposal: null,
      revision: 1,
      created_at: now,
      updated_at: now,
      cleaner_id: null,
      policy_version: input.policyVersion,
      reserved_start: null,
      reserved_end: null,
    };
    state.bookings.push(booking);
    demoEvent(
      state,
      booking,
      session,
      "Rose will review your request, price and preferred time. This is not yet a confirmed booking.",
    );
    return booking;
  }
  const { data, error } = await supabaseAdmin()
    .rpc("submit_booking", {
      p_actor: session.user.id,
      p_key: input.idempotencyKey,
      p_draft: input.draft,
      p_quote: quote,
      p_policy: input.policyVersion,
    })
    .single();
  dbError(error);
  return data as Booking;
}
export async function transition(
  session: Session,
  id: string,
  revision: number,
  action: string,
  proposal: Proposal | null,
) {
  const { booking } = await getBooking(id, session);
  if (!["cancel", "accept"].includes(action) && session.role !== "staff")
    throw new Error("FORBIDDEN");
  if (action === "accept" && booking.customer_id !== session.user.id)
    throw new Error("FORBIDDEN");
  if (!isDemo()) {
    const { data, error } = await supabaseAdmin()
      .rpc("transition_booking", {
        p_actor: session.user.id,
        p_id: id,
        p_revision: revision,
        p_action: action,
        p_proposal: proposal,
      })
      .single();
    dbError(error);
    return data as Booking;
  }
  const state = await demoState();
  if (booking.revision !== revision) return booking;
  let message = "";
  if (
    action === "cancel" &&
    ["pending", "alternative_proposed", "confirmed"].includes(booking.status)
  ) {
    booking.status = "cancelled";
    message = "The request was cancelled.";
  } else if (
    (action === "confirm" && booking.status === "pending") ||
    (action === "accept" && booking.status === "alternative_proposed")
  ) {
    const date =
      action === "accept" ? booking.proposal!.date : booking.draft.date;
    const windowId =
      action === "accept" ? booking.proposal!.windowId : booking.draft.windowId;
    const quote = action === "accept" ? booking.proposal!.quote : booking.quote;
    if (!state.catalogue.availability.configured)
      throw new Error("AVAILABILITY_UNCONFIGURED");
    if (quote.totalPence === null) throw new Error("PRICE_UNAPPROVED");
    const reason = slotReason(
      date,
      windowId,
      quote,
      state.catalogue.availability,
      state.bookings,
      id,
    );
    if (reason) throw new AppError(reason, 409);
    const [a, z] = reservationRange(
      date,
      windowId,
      quote,
      state.catalogue.availability,
    );
    if (
      booking.cleaner_id &&
      state.bookings.some(
        (b) =>
          b.id !== id &&
          b.cleaner_id === booking.cleaner_id &&
          b.reserved_start &&
          b.reserved_end &&
          Date.parse(b.reserved_start) < z &&
          Date.parse(b.reserved_end) > a,
      )
    )
      throw new Error("CLEANER_CONFLICT");
    booking.reserved_start = new Date(a).toISOString();
    booking.reserved_end = new Date(z).toISOString();
    booking.draft = { ...booking.draft, date, windowId };
    booking.quote = quote;
    booking.proposal = null;
    booking.status = "confirmed";
    message =
      action === "accept"
        ? "The customer accepted the proposed time and quotation."
        : "Rose confirmed the requested visit and quotation.";
  } else if (
    action === "propose" &&
    ["pending", "confirmed", "alternative_proposed"].includes(booking.status) &&
    proposal
  ) {
    booking.proposal = proposal;
    booking.status = "alternative_proposed";
    message =
      "Please review and accept the proposed date, arrival window and quotation. Any existing reservation is held until acceptance or cancellation.";
  } else if (
    action === "reject" &&
    ["pending", "alternative_proposed"].includes(booking.status)
  ) {
    booking.status = "rejected";
    message =
      "Rose is unable to fulfil this request. Please contact us to discuss other options.";
  } else if (action === "complete" && booking.status === "confirmed") {
    booking.status = "completed";
    message = "Rose marked the visit as completed.";
  } else throw new Error("INVALID_TRANSITION");
  if (["completed", "cancelled", "rejected"].includes(booking.status)) {
    booking.reserved_start = null;
    booking.reserved_end = null;
  }
  booking.revision++;
  booking.updated_at = new Date().toISOString();
  demoEvent(state, booking, session, message);
  return booking;
}
export async function getAddresses(session: Session): Promise<Address[]> {
  if (isDemo())
    return (await demoState()).addresses.filter(
      (a) => a.customer_id === session.user.id,
    );
  const { data, error } = await (
    await supabaseServer()
  )
    .from("addresses")
    .select("*")
    .eq("customer_id", session.user.id);
  dbError(error);
  return data ?? [];
}
export async function updateProfile(
  session: Session,
  value: Pick<Profile, "full_name" | "phone">,
) {
  if (isDemo()) {
    Object.assign((await demoState()).profile, value);
    return;
  }
  const { error } = await (
    await supabaseServer()
  )
    .from("profiles")
    .update(value)
    .eq("id", session.user.id);
  dbError(error);
}
