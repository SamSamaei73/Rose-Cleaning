import { beforeEach, describe, it, expect, vi } from "vitest";
import { demoCatalogue } from "./catalogue";
import { calculateQuote } from "./pricing";
import { draftSchema, requestSchema } from "./validation";
import { issueQuote, verifyReviewedQuote } from "./server/repository";
import { canTransition } from "./status";
const draft = {
  postcode: "SW1A 1AA",
  serviceId: "regular",
  propertyType: "flat" as const,
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
beforeEach(() => {
  vi.stubEnv("APP_MODE", "demo");
  vi.stubEnv(
    "APP_SECRET",
    "a-test-only-secret-that-is-longer-than-thirty-two-characters",
  );
});
describe("Request boundary", () => {
  it("rejects a client-supplied total rather than accepting it", () => {
    expect(() =>
      requestSchema.parse({
        draft,
        quoteToken: "some-token",
        idempotencyKey: crypto.randomUUID(),
        policyVersion: null,
        acknowledged: true,
        totalPence: 1,
      }),
    ).toThrow();
  });
  it("requires a server signature over the reviewed quote and draft", () => {
    const quote = calculateQuote(draft, demoCatalogue),
      token = issueQuote(draft, quote);
    expect(() => verifyReviewedQuote(token, draft, quote)).not.toThrow();
    expect(() => verifyReviewedQuote(`${token}x`, draft, quote)).toThrow();
    expect(() =>
      verifyReviewedQuote(token, { ...draft, bedrooms: 4 }, quote),
    ).toThrow();
  });
  it("requires another review when the server price/version changes", () => {
    const q = calculateQuote(draft, demoCatalogue),
      token = issueQuote(draft, q);
    expect(() =>
      verifyReviewedQuote(token, draft, {
        ...q,
        totalPence: 6600,
        version: "demo-v2",
      }),
    ).toThrow(/review/);
  });
  it("normalises a UK postcode and rejects invalid dates and obvious access codes", () => {
    expect(draftSchema.parse({ ...draft, postcode: "sw1a1aa" }).postcode).toBe(
      "SW1A 1AA",
    );
    expect(() => draftSchema.parse({ ...draft, date: "2030-02-30" })).toThrow();
    expect(() =>
      draftSchema.parse({ ...draft, notes: "Door code: 1234" }),
    ).toThrow();
  });
  it("does not let customers confirm their own pending request or complete a visit", () => {
    expect(canTransition("pending", "confirmed", "customer")).toBe(false);
    expect(canTransition("confirmed", "completed", "customer")).toBe(false);
    expect(canTransition("alternative_proposed", "confirmed", "customer")).toBe(
      true,
    );
    expect(canTransition("confirmed", "cancelled", "customer")).toBe(true);
  });
});
