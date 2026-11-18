import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { demoCatalogue } from "../catalogue";
import type {
  AccountRequest,
  Address,
  Booking,
  BookingEvent,
  Catalogue,
  Cleaner,
  Note,
  Notification,
  Profile,
  Pricing,
  Role,
  Session,
  Submission,
} from "../types";
import { isDemo } from "./config";
import { seal, unseal } from "./signing";

type DemoIdentity = {
  workspace: string;
  role: Role | "visitor";
  expires: number;
};
export type DemoState = {
  catalogue: Catalogue;
  pricingVersions: Pricing[];
  bookings: Booking[];
  events: BookingEvent[];
  notes: Note[];
  cleaners: Cleaner[];
  notifications: Notification[];
  submissions: Submission[];
  addresses: Address[];
  requests: AccountRequest[];
  profile: Profile;
  contactKeys: Record<string, string>;
};
const g = globalThis as typeof globalThis & {
  roseWorkspaces?: Map<string, { state: DemoState; touched: number }>;
};
const workspaces = (g.roseWorkspaces ??= new Map());
export const demoCustomerId = "10000000-0000-4000-8000-000000000001";
export const demoStaffId = "10000000-0000-4000-8000-000000000002";
export async function demoIdentity() {
  if (!isDemo()) return null;
  const value = (await cookies()).get("rose_demo")?.value;
  const identity = value ? unseal<DemoIdentity>(value) : null;
  return identity &&
    identity.expires > Date.now() &&
    ["customer", "staff", "visitor"].includes(identity.role)
    ? identity
    : null;
}
export async function enterDemo(role: Role | "visitor") {
  if (!isDemo()) throw new Error("NOT_FOUND");
  const current = await demoIdentity();
  const value: DemoIdentity = {
    workspace: current?.workspace ?? randomUUID(),
    role,
    expires: Date.now() + 86400000,
  };
  (await cookies()).set("rose_demo", seal(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 86400,
  });
}
export async function demoState(): Promise<DemoState> {
  const identity = await demoIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED");
  let entry = workspaces.get(identity.workspace);
  if (!entry) {
    for (const [key, item] of workspaces)
      if (item.touched < Date.now() - 86400000) workspaces.delete(key);
    if (workspaces.size > 500)
      throw new Error("Demo capacity reached. Please try later.");
    entry = {
      touched: Date.now(),
      state: {
        catalogue: structuredClone(demoCatalogue),
        pricingVersions: [structuredClone(demoCatalogue.pricing)],
        bookings: [],
        events: [],
        notes: [],
        cleaners: [
          {
            id: randomUUID(),
            name: "Alex — fictional demo cleaner",
            active: true,
          },
        ],
        notifications: [],
        submissions: [],
        addresses: [],
        requests: [],
        profile: {
          id: demoCustomerId,
          full_name: "Jamie Morgan",
          email: "jamie@example.test",
          phone: "Demo contact only",
        },
        contactKeys: {},
      },
    };
    workspaces.set(identity.workspace, entry);
  }
  entry.touched = Date.now();
  return entry.state;
}
export async function demoSession(): Promise<Session | null> {
  const identity = await demoIdentity();
  if (!identity || identity.role === "visitor") return null;
  const state = await demoState();
  return {
    user:
      identity.role === "customer"
        ? state.profile
        : {
            id: demoStaffId,
            full_name: "Rose demo team",
            email: "staff@example.test",
            phone: "",
          },
    role: identity.role,
    demo: true,
  };
}
