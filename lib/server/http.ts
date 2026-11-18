import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isDemo, siteUrl } from "./config";
import { digest } from "./signing";
import { supabaseAdmin } from "./supabase";
const errors: Record<string, [number, string]> = {
  CLEANER_CONFLICT: [
    409,
    "This cleaner is assigned to an overlapping reserved visit. Choose another cleaner or time.",
  ],
  INVALID_CLEANER: [400, "Choose an active internal cleaner."],
  SETUP_REQUIRED: [
    503,
    "Connected mode needs Supabase and APP_SECRET configuration. See /setup.",
  ],
  UNAUTHENTICATED: [401, "Please sign in to continue."],
  FORBIDDEN: [403, "You do not have access to this action."],
  NOT_FOUND: [404, "This record could not be found."],
  QUOTE_CHANGED: [409, "The estimate has changed. Please review it again."],
  POLICY_CHANGED: [
    409,
    "The booking information has changed. Please review the current version.",
  ],
  CAPACITY_CONFLICT: [
    409,
    "That arrival window is now full. Please choose another.",
  ],
  UNAVAILABLE: [409, "That date or arrival window is no longer available."],
  AVAILABILITY_UNCONFIGURED: [
    409,
    "Configure working hours and capacity before confirming a visit.",
  ],
  PRICE_UNAPPROVED: [
    409,
    "Propose an approved quotation for the customer to accept before confirming.",
  ],
  INVALID_TRANSITION: [
    409,
    "This action is not available for the current status.",
  ],
  ACTIVE_RESERVATIONS: [
    409,
    "There are upcoming reservations. Resolve these before changing operational settings.",
  ],
  RATE_LIMIT: [
    429,
    "Too many attempts. Please wait a few minutes and try again.",
  ],
};
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}
export function fail(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || "Check your details." },
      { status: 400 },
    );
  if (error instanceof AppError)
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.status },
    );
  const message = error instanceof Error ? error.message : "";
  const known = errors[message];
  if (known)
    return NextResponse.json(
      { error: known[1], code: message },
      { status: known[0] },
    );
  // Do not return provider or database errors to the browser.
  console.error("Rose operation failed", {
    type: error instanceof Error ? error.name : "UnknownError",
    code: message in errors ? message : "INTERNAL",
  });
  return NextResponse.json(
    {
      error:
        "We could not complete that action. Please try again or call Rose.",
    },
    { status: 500 },
  );
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(siteUrl()).origin)
    throw new AppError(
      "This request could not be verified. Reload the page and try again.",
      403,
    );
}
export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppError("Use a JSON request.", 415);
  const text = await request.text();
  if (text.length > 30000)
    throw new AppError("This submission is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("Check the submitted information.");
  }
}
const g = globalThis as typeof globalThis & {
  roseLimits?: Map<string, { count: number; expires: number }>;
};
export async function rateLimit(
  request: Request,
  scope: string,
  limit = 20,
  seconds = 600,
) {
  const ip =
    (process.env.VERCEL
      ? request.headers.get("x-vercel-forwarded-for")
      : request.headers.get("x-forwarded-for")
    )
      ?.split(",")[0]
      ?.trim() || "local";
  const key = digest(`${scope}:${ip}`);
  if (isDemo()) {
    const map = (g.roseLimits ??= new Map());
    for (const [k, v] of map) if (v.expires < Date.now()) map.delete(k);
    const value = map.get(key) ?? {
      count: 0,
      expires: Date.now() + seconds * 1000,
    };
    value.count++;
    map.set(key, value);
    if (value.count > limit) throw new Error("RATE_LIMIT");
  } else {
    const { data, error } = await supabaseAdmin().rpc("consume_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_seconds: seconds,
    });
    if (error) throw new Error("Rate limit unavailable.");
    if (!data) throw new Error("RATE_LIMIT");
  }
}
export function dbError(error: { message: string; code?: string } | null) {
  if (error)
    throw new Error(
      error.message in errors ? error.message : "Database operation failed.",
    );
}
