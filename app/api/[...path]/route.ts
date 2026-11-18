import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireSession } from "@/lib/server/auth";
import { isDemo, siteUrl } from "@/lib/server/config";
import { demoIdentity, demoState, enterDemo } from "@/lib/server/demo";
import { supabaseAdmin, supabaseServer } from "@/lib/server/supabase";
import {
  AppError,
  checkOrigin,
  dbError,
  fail,
  rateLimit,
  readBody,
} from "@/lib/server/http";
import {
  getAddresses,
  getBooking,
  getCatalogue,
  issueQuote,
  listBookings,
  reservations,
  submitBooking,
  transition,
  updateProfile,
} from "@/lib/server/repository";
import {
  addressSchema,
  availabilitySchema,
  contactSchema,
  draftSchema,
  estimateSchema,
  pricingSchema,
  profileSchema,
  requestSchema,
  serviceSchema,
} from "@/lib/validation";
import { calculateQuote } from "@/lib/pricing";
import { slotReason } from "@/lib/scheduling";
import { dispatchNotifications } from "@/lib/server/email";
import type { Proposal, Quote } from "@/lib/types";
export const dynamic = "force-dynamic";
const safeNext = (value: unknown) =>
  typeof value === "string" &&
  /^\/(dashboard|staff|book)(\/|\?|$)/.test(value) &&
  !value.includes("\\")
    ? value
    : "/dashboard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await params).path.join("/");
    if (path === "catalogue") return NextResponse.json(await getCatalogue());
    const session = await requireSession(path.startsWith("staff"));
    if (path === "bookings")
      return NextResponse.json(await listBookings(session));
    if (path === "account/export") {
      const bookings = await listBookings(session);
      const addresses = await getAddresses(session);
      const own = bookings.filter((b) => b.customer_id === session.user.id);
      const details = await Promise.all(
        own.map((b) => getBooking(b.id, session)),
      );
      return new NextResponse(
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            profile: session.user,
            addresses,
            bookings: own,
            history: details.flatMap((d) => d.events),
            note: "This export contains your account and booking data. It excludes internal operational notes.",
          },
          null,
          2,
        ),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition":
              'attachment; filename="rose-account-data.json"',
            "Cache-Control": "no-store",
          },
        },
      );
    }
    if (path === "staff/data") {
      if (isDemo()) {
        const s = await demoState();
        return NextResponse.json({
          cleaners: s.cleaners,
          notifications: s.notifications,
          submissions: s.submissions,
          accountRequests: s.requests,
          pricingDrafts: s.pricingVersions.toReversed(),
        });
      }
      const db = await supabaseServer();
      const [cleaners, notifications, submissions, requests, pricing] =
        await Promise.all([
          db.from("cleaners").select("*").order("name"),
          db
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
          db
            .from("submissions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
          db
            .from("account_requests")
            .select("*,profiles(full_name,email)")
            .order("created_at", { ascending: false }),
          db
            .from("pricing_versions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20),
        ]);
      [cleaners, notifications, submissions, requests, pricing].forEach((r) =>
        dbError(r.error),
      );
      return NextResponse.json({
        cleaners: cleaners.data,
        notifications: notifications.data,
        submissions: submissions.data,
        accountRequests: requests.data,
        pricingDrafts: pricing.data,
      });
    }
    throw new Error("NOT_FOUND");
  } catch (e) {
    return fail(e);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await params).path.join("/");
    if (
      path === "notifications/dispatch" &&
      process.env.CRON_SECRET &&
      request.headers.get("authorization") ===
        `Bearer ${process.env.CRON_SECRET}`
    ) {
      await dispatchNotifications();
      return NextResponse.json({
        message:
          "Queued notifications processed. Check the outbox for provider status.",
      });
    }
    checkOrigin(request);
    const body = await readBody(request);
    if (path === "demo") {
      if (!isDemo()) throw new Error("NOT_FOUND");
      await rateLimit(request, "demo", 60);
      const { role } = z
        .object({ role: z.enum(["customer", "staff"]) })
        .parse(body);
      await enterDemo(role);
      return NextResponse.json({
        redirect: safeNext(
          body.next ?? (role === "staff" ? "/staff" : "/dashboard"),
        ),
      });
    }
    if (path === "auth") {
      await rateLimit(request, "auth", 15);
      const input = z
        .object({
          action: z.enum([
            "login",
            "signup",
            "forgot",
            "reset",
            "magic",
            "logout",
          ]),
          email: z.email().max(254).optional(),
          password: z.string().max(200).optional(),
          name: z.string().trim().min(2).max(120).optional(),
          next: z.string().optional(),
        })
        .parse(body);
      if (input.action === "logout") {
        if (isDemo()) (await cookies()).delete("rose_demo");
        else {
          const { error } = await (await supabaseServer()).auth.signOut();
          if (error)
            throw new AppError("Unable to sign out. Please try again.");
        }
        return NextResponse.json({ redirect: "/" });
      }
      if (isDemo())
        throw new AppError(
          "Demo mode uses fictional accounts. Choose “Explore the customer demo”; no password or real email is needed.",
        );
      const db = await supabaseServer();
      const redirectTo = `${siteUrl()}/auth/callback?next=${encodeURIComponent(safeNext(input.next))}`;
      if (
        ["signup", "reset"].includes(input.action) &&
        (!input.password || input.password.length < 12)
      )
        throw new AppError("Use a password with at least 12 characters.");
      if (input.action !== "reset" && !input.email)
        throw new AppError("Enter your email address.");
      if (input.action === "login") {
        if (!input.password) throw new AppError("Enter your password.");
        const { error } = await db.auth.signInWithPassword({
          email: input.email!,
          password: input.password,
        });
        if (error)
          throw new AppError(
            error.code === "email_not_confirmed"
              ? "Please verify your email address before signing in."
              : "We could not sign you in. Check your email and password.",
          );
        return NextResponse.json({ redirect: safeNext(input.next) });
      }
      if (input.action === "signup") {
        const { data, error } = await db.auth.signUp({
          email: input.email!,
          password: input.password!,
          options: {
            data: { full_name: input.name || "" },
            emailRedirectTo: redirectTo,
          },
        });
        if (error)
          throw new AppError(
            "Unable to register. Check your details or try signing in.",
          );
        return NextResponse.json(
          data.session
            ? { redirect: safeNext(input.next) }
            : {
                message:
                  "Check your inbox for the verification link. If this account already exists, sign in or reset your password.",
              },
        );
      }
      if (input.action === "forgot") {
        const { error } = await db.auth.resetPasswordForEmail(input.email!, {
          redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
        });
        if (error)
          throw new AppError(
            "Unable to request a reset link right now. Please try again.",
          );
        return NextResponse.json({
          message:
            "If an account matches that email, a reset link has been requested. Check your inbox.",
        });
      }
      if (input.action === "magic") {
        const { error } = await db.auth.signInWithOtp({
          email: input.email!,
          options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
        });
        if (error)
          throw new AppError(
            "Unable to request a sign-in link right now. Please try again.",
          );
        return NextResponse.json({
          message:
            "If an account matches that email, a sign-in link has been requested.",
        });
      }
      if (input.action === "reset") {
        const {
          data: { user },
        } = await db.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");
        const { error } = await db.auth.updateUser({
          password: input.password,
        });
        if (error)
          throw new AppError(
            "Unable to update your password. Request a new reset link and try again.",
          );
        return NextResponse.json({
          message: "Your password has been updated.",
          redirect: "/dashboard",
        });
      }
    }
    if (path === "estimate") {
      await rateLimit(request, "estimate", 300);
      const draft = estimateSchema.parse(body);
      const catalogue = await getCatalogue();
      const quote = calculateQuote(draft, catalogue);
      return NextResponse.json({ quote, quoteToken: issueQuote(draft, quote) });
    }
    if (path === "availability") {
      await rateLimit(request, "availability", 200);
      const draft = estimateSchema.parse(body);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date))
        throw new AppError("Choose a date.");
      const catalogue = await getCatalogue();
      const quote = calculateQuote(draft, catalogue);
      const booked = await reservations();
      return NextResponse.json(
        catalogue.availability.windows.map((w) => ({
          ...w,
          reason: slotReason(
            draft.date,
            w.id,
            quote,
            catalogue.availability,
            booked,
          ),
        })),
      );
    }
    if (path === "contact") {
      await rateLimit(request, "contact", 8);
      const value = contactSchema.parse(body);
      if (isDemo()) {
        if (!(await demoIdentity())) await enterDemo("visitor");
        const s = await demoState();
        const id = s.contactKeys[value.idempotencyKey] ?? randomUUID();
        if (!s.contactKeys[value.idempotencyKey]) {
          s.contactKeys[value.idempotencyKey] = id;
          s.submissions.push({
            ...value,
            id,
            created_at: new Date().toISOString(),
          });
          s.notifications.push({
            id: randomUUID(),
            event_key: `contact:${id}`,
            event_type: "enquiry_received",
            recipient: value.email,
            subject: "Rose has received your enquiry",
            body: "Your demonstration enquiry has been recorded in this temporary workspace.",
            status: "preview",
            provider_id: null,
            created_at: new Date().toISOString(),
            error: null,
          });
        }
        return NextResponse.json({
          message:
            "Demo enquiry saved in this temporary workspace. No email was sent.",
        });
      }
      const { error } = await supabaseAdmin().rpc("submit_contact", {
        p_key: value.idempotencyKey,
        p_value: value,
      });
      dbError(error);
      // Submission success is independent of notification-provider availability.
      await dispatchNotifications().catch(() => {});
      return NextResponse.json({
        message:
          "Your enquiry has been saved for Rose to review. You can also call 07775 170005.",
      });
    }
    const session = await requireSession(
      path.startsWith("staff/") || path === "notifications/dispatch",
    );
    if (path === "bookings") {
      await rateLimit(request, `booking:${session.user.id}`, 20);
      const value = requestSchema.parse(body);
      const booking = await submitBooking(session, value);
      await dispatchNotifications().catch(() => {});
      return NextResponse.json({ booking });
    }
    if (path.startsWith("bookings/") && path.endsWith("/action")) {
      const id = z.uuid().parse(path.split("/")[1]);
      const value = z
        .object({
          action: z.enum([
            "confirm",
            "reject",
            "propose",
            "complete",
            "cancel",
            "accept",
          ]),
          revision: z.number().int().positive(),
          proposal: z
            .object({
              date: z.string(),
              windowId: z.string(),
              totalPence: z.number().int().min(1).max(10000000),
              message: z.string().trim().min(5).max(1000),
            })
            .optional(),
        })
        .parse(body);
      let proposal: Proposal | null = null;
      if (value.action === "propose") {
        if (session.role !== "staff" || !value.proposal)
          throw new Error("FORBIDDEN");
        const { booking } = await getBooking(id, session);
        const catalogue = await getCatalogue();
        const draft = draftSchema.parse({
          ...booking.draft,
          date: value.proposal.date,
          windowId: value.proposal.windowId,
        });
        const reason = slotReason(
          draft.date,
          draft.windowId,
          booking.quote,
          catalogue.availability,
          await reservations(),
          id,
        );
        if (reason) throw new AppError(reason, 409);
        // A tailored quotation is explicitly presented for customer acceptance; never silently applied.
        const quote: Quote = {
          ...booking.quote,
          kind: isDemo() ? "demo" : "approved",
          version: `tailored-${randomUUID()}`,
          lines: [
            {
              label: "Tailored cleaning quotation — complete total",
              quantity: 1,
              unitPence: value.proposal.totalPence,
              totalPence: value.proposal.totalPence,
            },
          ],
          totalPence: value.proposal.totalPence,
          note: isDemo()
            ? "Demo estimate — final pricing to be confirmed."
            : "Tailored quotation from Rose. Review the complete total before accepting.",
        };
        proposal = {
          date: draft.date,
          windowId: draft.windowId,
          quote,
          message: value.proposal.message,
        };
      }
      const booking = await transition(
        session,
        id,
        value.revision,
        value.action,
        proposal,
      );
      await dispatchNotifications().catch(() => {});
      return NextResponse.json({ booking });
    }
    if (path === "account/profile") {
      await updateProfile(session, profileSchema.parse(body));
      return NextResponse.json({ message: "Profile saved." });
    }
    if (path === "account/address") {
      const value = addressSchema.parse(body);
      if (isDemo()) {
        const state = await demoState();
        if (value.id) {
          const address = state.addresses.find(
            (a) => a.id === value.id && a.customer_id === session.user.id,
          );
          if (!address) throw new Error("NOT_FOUND");
          Object.assign(address, value);
        } else
          state.addresses.push({
            ...value,
            id: randomUUID(),
            customer_id: session.user.id,
          });
      } else {
        const db = await supabaseServer();
        const result = value.id
          ? await db
              .from("addresses")
              .update(value)
              .eq("id", value.id)
              .eq("customer_id", session.user.id)
          : await db
              .from("addresses")
              .insert({ ...value, customer_id: session.user.id });
        dbError(result.error);
      }
      return NextResponse.json({ message: "Address saved." });
    }
    if (path === "account/address/delete") {
      const { id } = z.object({ id: z.uuid() }).parse(body);
      if (isDemo()) {
        const state = await demoState();
        state.addresses = state.addresses.filter(
          (a) => a.id !== id || a.customer_id !== session.user.id,
        );
      } else {
        const { error } = await (
          await supabaseServer()
        )
          .from("addresses")
          .delete()
          .eq("id", id)
          .eq("customer_id", session.user.id);
        dbError(error);
      }
      return NextResponse.json({ message: "Address removed." });
    }
    if (path === "account/deletion") {
      z.object({ acknowledged: z.literal(true) }).parse(body);
      if (isDemo()) {
        const state = await demoState();
        if (
          !state.requests.some(
            (r) =>
              r.customer_id === session.user.id && r.status !== "completed",
          )
        )
          state.requests.push({
            id: randomUUID(),
            customer_id: session.user.id,
            kind: "deletion",
            status: "requested",
            created_at: new Date().toISOString(),
          });
      } else {
        const { error } = await supabaseAdmin()
          .from("account_requests")
          .insert({ customer_id: session.user.id });
        if (error?.code !== "23505") dbError(error);
      }
      return NextResponse.json({
        message:
          "Deletion request recorded. Your account and records have not been deleted. Rose will review any records that must be retained and contact you.",
      });
    }
    if (path === "staff/settings") {
      const { kind, value } = z
        .object({
          kind: z.enum(["pricing", "availability", "service"]),
          value: z.unknown(),
        })
        .parse(body);
      const parsed =
        kind === "pricing"
          ? pricingSchema.parse(value)
          : kind === "availability"
            ? availabilitySchema.parse(value)
            : serviceSchema.parse(value);
      if (kind === "pricing") {
        const p = pricingSchema.parse(parsed);
        p.demo = isDemo();
        if (isDemo()) {
          const state = await demoState();
          if (
            state.pricingVersions.some(
              (version) => version.version === p.version,
            )
          )
            throw new AppError(
              "That pricing version already exists. Use a new version name.",
              409,
            );
          p.approved = false;
          state.pricingVersions.push(p);
          state.catalogue.pricing = p;
        } else {
          const { error } = await supabaseAdmin().rpc("save_staff_settings", {
            p_actor: session.user.id,
            p_kind: kind,
            p_value: { ...p, demo: false },
          });
          if (error?.code === "23505")
            throw new AppError(
              "That pricing version already exists. Use a new version name.",
              409,
            );
          dbError(error);
        }
      } else if (isDemo()) {
        const s = await demoState();
        if (kind === "availability") {
          if (
            s.bookings.some(
              (b) =>
                b.reserved_end && b.reserved_end > new Date().toISOString(),
            )
          )
            throw new Error("ACTIVE_RESERVATIONS");
          s.catalogue.availability = availabilitySchema.parse(parsed);
        } else {
          const v = serviceSchema.parse(parsed);
          const ix = s.catalogue.services.findIndex((s) => s.id === v.id);
          if (ix < 0) s.catalogue.services.push(v);
          else s.catalogue.services[ix] = v;
        }
      } else {
        const { error } = await supabaseAdmin().rpc("save_staff_settings", {
          p_actor: session.user.id,
          p_kind: kind,
          p_value: parsed,
        });
        dbError(error);
      }
      return NextResponse.json({ message: "Settings saved." });
    }
    if (path === "staff/note") {
      const value = z
        .object({
          bookingId: z.uuid(),
          body: z.string().trim().min(1).max(3000),
        })
        .parse(body);
      await getBooking(value.bookingId, session);
      if (isDemo())
        (await demoState()).notes.push({
          id: randomUUID(),
          booking_id: value.bookingId,
          body: value.body,
          actor_id: session.user.id,
          created_at: new Date().toISOString(),
        });
      else {
        const { error } = await supabaseAdmin().from("internal_notes").insert({
          booking_id: value.bookingId,
          actor_id: session.user.id,
          body: value.body,
        });
        dbError(error);
      }
      return NextResponse.json({ message: "Internal note saved." });
    }
    if (path === "staff/cleaner") {
      const value = z
        .object({ name: z.string().trim().min(2).max(100) })
        .parse(body);
      if (isDemo())
        (await demoState()).cleaners.push({
          id: randomUUID(),
          name: value.name,
          active: true,
        });
      else {
        const { error } = await supabaseAdmin().from("cleaners").insert(value);
        dbError(error);
      }
      return NextResponse.json({ message: "Internal cleaner record added." });
    }
    if (path === "staff/assign") {
      const value = z
        .object({ bookingId: z.uuid(), cleanerId: z.uuid().nullable() })
        .parse(body);
      await getBooking(value.bookingId, session);
      if (isDemo()) {
        const state = await demoState();
        if (
          value.cleanerId &&
          !state.cleaners.some((c) => c.id === value.cleanerId && c.active)
        )
          throw new AppError("Choose an active cleaner.");
        const b = state.bookings.find((b) => b.id === value.bookingId)!;
        if (
          value.cleanerId &&
          b.reserved_start &&
          b.reserved_end &&
          state.bookings.some(
            (other) =>
              other.id !== b.id &&
              other.cleaner_id === value.cleanerId &&
              other.reserved_start &&
              other.reserved_end &&
              other.reserved_start < b.reserved_end! &&
              other.reserved_end > b.reserved_start!,
          )
        )
          throw new Error("CLEANER_CONFLICT");
        if (b.cleaner_id !== value.cleanerId) {
          b.cleaner_id = value.cleanerId;
          state.notes.push({
            id: randomUUID(),
            booking_id: b.id,
            actor_id: session.user.id,
            body: value.cleanerId
              ? "Internal cleaner assignment updated."
              : "Internal cleaner assignment removed.",
            created_at: new Date().toISOString(),
          });
        }
      } else {
        if (value.cleanerId) {
          const { data } = await supabaseAdmin()
            .from("cleaners")
            .select("id")
            .eq("id", value.cleanerId)
            .eq("active", true)
            .maybeSingle();
          if (!data) throw new AppError("Choose an active cleaner.");
        }
        const { error } = await supabaseAdmin().rpc("assign_cleaner", {
          p_actor: session.user.id,
          p_booking: value.bookingId,
          p_cleaner: value.cleanerId,
        });
        dbError(error);
      }
      return NextResponse.json({
        message:
          "Assignment saved. Capacity is based on configured team units; named cleaner scheduling is manual.",
      });
    }
    if (path === "staff/account-request") {
      const value = z
        .object({ id: z.uuid(), status: z.literal("in_review") })
        .parse(body);
      if (isDemo()) {
        const r = (await demoState()).requests.find((r) => r.id === value.id);
        if (!r) throw new Error("NOT_FOUND");
        r.status = "in_review";
      } else {
        const { error } = await supabaseAdmin()
          .from("account_requests")
          .update({ status: "in_review" })
          .eq("id", value.id);
        dbError(error);
      }
      return NextResponse.json({
        message:
          "Request marked as under review. No records have been deleted.",
      });
    }
    if (path === "notifications/dispatch") {
      await dispatchNotifications();
      return NextResponse.json({
        message:
          "Queued notifications processed. Check each status; submitted does not mean delivered.",
      });
    }
    throw new Error("NOT_FOUND");
  } catch (e) {
    return fail(e);
  }
}
