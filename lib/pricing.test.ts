import { describe, it, expect } from "vitest";
import { calculateQuote, money } from "./pricing";
import { demoCatalogue, emptyPricing } from "./catalogue";
import type { BookingDraft } from "./types";
const draft: BookingDraft = {
  postcode: "SW1A 1AA",
  serviceId: "regular",
  propertyType: "flat",
  bedrooms: 1,
  bathrooms: 1,
  address: "1 Fictional Lane",
  extras: [],
  date: "2030-06-11",
  windowId: "morning",
  notes: "",
  pets: "",
  access: "",
};
describe("Integer-pence quote calculation with explicit demo fixtures", () => {
  it("calculates quantity, complete total and a versioned itemised snapshot", () => {
    const q = calculateQuote(draft, demoCatalogue);
    expect(q.totalPence).toBe(6500);
    expect(q.durationMinutes).toBe(150);
    expect(q.lines[0].quantity).toBe(2.5);
    expect(q.kind).toBe("demo");
    expect(q.version).toBe("demo-v1");
  });
  it("includes extras and their duration once", () => {
    const q = calculateQuote(
      { ...draft, bedrooms: 2, extras: ["oven", "fridge"] },
      demoCatalogue,
    );
    expect(q.totalPence).toBe(7800 + 2600 + 1800);
    expect(q.durationMinutes).toBe(180 + 30 + 20);
    expect(q.lines).toHaveLength(3);
  });
  it("supports studio properties and a minimum charge", () => {
    const q = calculateQuote({ ...draft, bedrooms: 0 }, demoCatalogue);
    expect(q.totalPence).toBe(6500);
    expect(q.property).toContain("Studio");
  });
  it("rounds fractional pence up on the server", () => {
    const c = structuredClone(demoCatalogue);
    c.pricing.services.regular = {
      hourlyPence: 1001,
      baseMinutes: 61,
      bedroomMinutes: 0,
      bathroomMinutes: 0,
      minimumPence: 0,
    };
    expect(calculateQuote(draft, c).totalPence).toBe(1018);
  });
  it("never exposes unapproved connected rates or a misleading zero", () => {
    const c = {
      ...demoCatalogue,
      pricing: { ...demoCatalogue.pricing, demo: false, approved: false },
    };
    const q = calculateQuote(draft, c);
    expect(q.totalPence).toBeNull();
    expect(q.kind).toBe("unpriced");
    expect(q.lines.every((l) => l.totalPence === null)).toBe(true);
    expect(money(q.totalPence)).toBe("Price to be confirmed");
  });
  it("handles missing rates without inventing a charge", () => {
    expect(
      calculateQuote(draft, { ...demoCatalogue, pricing: emptyPricing })
        .totalPence,
    ).toBeNull();
    const c = structuredClone(demoCatalogue);
    delete c.pricing.extras.oven;
    expect(
      calculateQuote({ ...draft, extras: ["oven"] }, c).totalPence,
    ).toBeNull();
  });
  it("rejects unknown and duplicated extras or inactive services", () => {
    expect(() =>
      calculateQuote({ ...draft, extras: ["made-up"] }, demoCatalogue),
    ).toThrow();
    expect(() =>
      calculateQuote({ ...draft, extras: ["oven", "oven"] }, demoCatalogue),
    ).toThrow();
    const c = structuredClone(demoCatalogue);
    c.services[0].active = false;
    expect(() => calculateQuote(draft, c)).toThrow();
  });
  it("includes explicitly configured charges and discounts", () => {
    const c = structuredClone(demoCatalogue);
    c.pricing.adjustments = [
      { label: "Fixture charge", pence: 300 },
      { label: "Fixture discount", pence: -100 },
    ];
    const q = calculateQuote(draft, c);
    expect(q.totalPence).toBe(6700);
    expect(q.lines.reduce((sum, l) => sum + l.totalPence!, 0)).toBe(
      q.totalPence,
    );
  });
});
