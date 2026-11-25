import "server-only";
import type { Booking, BookingDraft, Session } from "../types";
import {
  cleaningRequestSchema,
  type CleaningRequestInput,
} from "../validation";
import { AppError, dbError } from "./http";
import { isDemo } from "./config";
import { getCatalogue } from "./repository";
import { supabaseAdmin } from "./supabase";

export async function submitCleaningRequest(
  session: Session,
  raw: CleaningRequestInput,
) {
  const input = cleaningRequestSchema.parse(raw);
  if (isDemo())
    throw new AppError(
      "This request form needs the connected application. Demo records remain separate.",
    );
  const catalogue = await getCatalogue();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
  const lastDate = new Date(`${today}T12:00:00Z`);
  lastDate.setUTCDate(lastDate.getUTCDate() + 365);
  if (input.date < today || input.date > lastDate.toISOString().slice(0, 10))
    throw new AppError("Choose a preferred date within the next year.");
  if (
    !catalogue.services.some(
      (s) => s.id === input.serviceId && s.active && s.kind === "service",
    )
  )
    throw new AppError("Choose a service from the current catalogue.");
  if (
    input.windowId !== "flexible" &&
    !catalogue.availability.windows.some((w) => w.id === input.windowId)
  )
    throw new AppError("Choose a preferred time from the list.");
  const { idempotencyKey, ...details } = input;
  const draft: BookingDraft = {
    ...details,
    bedrooms: null,
    bathrooms: null,
    extras: [],
    pets: "",
    access: "",
  };
  const { data, error } = await supabaseAdmin()
    .rpc("submit_cleaning_request", {
      p_actor: session.user.id,
      p_key: idempotencyKey,
      p_draft: draft,
    })
    .single();
  dbError(error);
  return data as Booking;
}
