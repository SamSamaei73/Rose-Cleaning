import { describe, it, expect } from "vitest";
import {
  londonDate,
  londonInstant,
  reservationRange,
  slotReason,
} from "./scheduling";
import { demoCatalogue, preferredAvailability } from "./catalogue";
import type { Booking, Quote } from "./types";
const quote: Quote = {
  version: "test",
  kind: "approved",
  service: "Fixture clean",
  property: "Fixture",
  durationMinutes: 120,
  teamSize: 1,
  lines: [],
  totalPence: 5000,
  note: "",
};
const settings = {
  ...demoCatalogue.availability,
  workingDays: [0, 1, 2, 3, 4, 5, 6],
  capacity: 1,
  leadHours: 24,
  horizonDays: 365,
};
const now = new Date("2030-06-10T08:00:00Z");
const booking = (id: string, start: string, end: string): Booking =>
  ({
    id,
    quote,
    reserved_start: start,
    reserved_end: end,
    status: "confirmed",
  }) as Booking;
describe("Operational scheduling", () => {
  it("uses London dates and daylight saving time", () => {
    expect(londonDate(new Date("2030-06-10T23:30:00Z"))).toBe("2030-06-11");
    expect(londonInstant("2030-06-11", "09:00")).toBe(
      Date.parse("2030-06-11T08:00:00Z"),
    );
    expect(londonInstant("2030-01-11", "09:00")).toBe(
      Date.parse("2030-01-11T09:00:00Z"),
    );
  });
  it("blocks past dates, lead-time breaches and closed days", () => {
    expect(
      slotReason("2030-06-09", "morning", quote, settings, [], undefined, now),
    ).toMatch(/future/);
    expect(
      slotReason("2030-06-10", "morning", quote, settings, [], undefined, now),
    ).toMatch(/notice/);
    expect(
      slotReason(
        "2030-06-11",
        "morning",
        quote,
        { ...settings, blackoutDates: ["2030-06-11"] },
        [],
        undefined,
        now,
      ),
    ).toMatch(/not taking/);
  });
  it("reserves the complete arrival window plus duration", () => {
    expect(reservationRange("2030-06-11", "morning", quote, settings)).toEqual([
      Date.parse("2030-06-11T08:00Z"),
      Date.parse("2030-06-11T13:00Z"),
    ]);
  });
  it("does not count pending unreserved requests", () => {
    const b = {
      ...booking("pending", "", ""),
      status: "pending",
      reserved_start: null,
      reserved_end: null,
    } as Booking;
    expect(
      slotReason("2030-06-11", "morning", quote, settings, [b], undefined, now),
    ).toBeNull();
  });
  it("blocks overlapping reservations and counts a held alternative", () => {
    const b = booking("other", "2030-06-11T08:00Z", "2030-06-11T13:00Z");
    expect(
      slotReason("2030-06-11", "morning", quote, settings, [b], undefined, now),
    ).toMatch(/full/);
    b.status = "alternative_proposed";
    expect(
      slotReason("2030-06-11", "morning", quote, settings, [b], undefined, now),
    ).toMatch(/full/);
  });
  it("excludes the booking being rescheduled and allows adjacent reservations", () => {
    const b = booking("self", "2030-06-11T08:00Z", "2030-06-11T13:00Z");
    expect(
      slotReason("2030-06-11", "morning", quote, settings, [b], "self", now),
    ).toBeNull();
    const adjacent = booking(
      "adjacent",
      "2030-06-11T13:00Z",
      "2030-06-11T17:00Z",
    );
    expect(
      slotReason(
        "2030-06-11",
        "morning",
        quote,
        settings,
        [adjacent],
        undefined,
        now,
      ),
    ).toBeNull();
  });
  it("uses peak concurrency, not the sum of separate overlaps", () => {
    const q = { ...quote, durationMinutes: 240 };
    const s = { ...settings, capacity: 2 };
    const bookings = [
      booking("a", "2030-06-11T08:00Z", "2030-06-11T10:00Z"),
      booking("b", "2030-06-11T10:00Z", "2030-06-11T12:00Z"),
    ];
    expect(
      slotReason("2030-06-11", "morning", q, s, bookings, undefined, now),
    ).toBeNull();
  });
  it("collects preferences when operations are unconfigured", () => {
    expect(
      slotReason(
        "2030-06-11",
        "morning",
        quote,
        preferredAvailability,
        [],
        undefined,
        now,
      ),
    ).toBeNull();
  });
});
