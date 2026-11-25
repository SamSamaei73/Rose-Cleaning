import { afterEach, describe, expect, it, vi } from "vitest";
import { authSchema, cleaningRequestSchema, contactSchema } from "./validation";
import { contactReceipt, contactRecipient } from "./server/contact";
import { resendAdapter } from "./server/email";
import type { Notification } from "./types";

const request = {
  serviceId: "regular",
  address: "1 Test Road",
  postcode: "sw1a1aa",
  date: "2027-01-20",
  windowId: "flexible",
  propertyType: "flat",
  propertyDetails: "Two bedrooms",
  notes: "",
  idempotencyKey: "10000000-0000-4000-8000-000000000001",
};
const contact = {
  kind: "contact",
  name: "Test Customer",
  email: "customer@example.test",
  phone: "",
  company: "",
  postcode: "",
  subject: "Kitchen cleaning",
  message: "Please discuss cleaning my kitchen.",
  website: "",
  idempotencyKey: request.idempotencyKey,
};
const email: Notification = {
  id: request.idempotencyKey,
  event_key: "contact-owner:test",
  event_type: "enquiry_received",
  recipient: "rose.cleaning.uk@icloud.com",
  reply_to: contact.email,
  submission_id: request.idempotencyKey,
  subject: "Rose contact: Kitchen cleaning",
  body: "Name: Test Customer\nMessage: <script>alert('x')</script>",
  status: "queued",
  provider_id: null,
  created_at: "2026-11-22T00:00:00Z",
  error: null,
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("Customer input boundaries", () => {
  it("requires a full name and password for registration; rejects role input", () => {
    const signup = {
      action: "signup",
      name: "Test Customer",
      email: contact.email,
      password: "Local-test-password-only",
    };
    expect(authSchema.safeParse(signup).success).toBe(true);
    expect(authSchema.safeParse({ ...signup, name: undefined }).success).toBe(
      false,
    );
    expect(authSchema.safeParse({ ...signup, role: "staff" }).success).toBe(
      false,
    );
    expect(authSchema.safeParse({ ...signup, password: "short" }).success).toBe(
      false,
    );
  });
  it("normalises postcodes and rejects ownership, status and assignment tampering", () => {
    expect(cleaningRequestSchema.parse(request).postcode).toBe("SW1A 1AA");
    for (const field of [
      "customer_id",
      "status",
      "cleaner_id",
      "quote",
      "role",
    ]) {
      expect(
        cleaningRequestSchema.safeParse({ ...request, [field]: "tampered" })
          .success,
      ).toBe(false);
    }
    expect(
      cleaningRequestSchema.safeParse({ ...request, date: "2027-02-30" })
        .success,
    ).toBe(false);
    expect(
      cleaningRequestSchema.safeParse({
        ...request,
        notes: "key-safe code: 1234",
      }).success,
    ).toBe(false);
  });
  it("rejects destination overrides, header injection and the spam trap", () => {
    expect(contactSchema.safeParse(contact).success).toBe(true);
    expect(
      contactSchema.safeParse({ ...contact, to: "attacker@example.test" })
        .success,
    ).toBe(false);
    expect(
      contactSchema.safeParse({
        ...contact,
        subject: "Subject\nBcc: attacker@example.test",
      }).success,
    ).toBe(false);
    expect(
      contactSchema.safeParse({ ...contact, website: "spam" }).success,
    ).toBe(false);
    vi.stubEnv("CONTACT_TO_EMAIL", "rose.cleaning.uk@icloud.com");
    expect(contactRecipient()).toBe("rose.cleaning.uk@icloud.com");
  });
});
describe("Contact forwarding adapter", () => {
  it("uses the owner recipient, verified From, validated Reply-To and literal plain text", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key-no-network");
    vi.stubEnv("EMAIL_FROM", "Rose <verified@example.test>");
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "provider-test-id" }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetcher);
    expect(await resendAdapter.send(email)).toEqual({
      status: "submitted",
      providerId: "provider-test-id",
    });
    const [, options] = fetcher.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      from: "Rose <verified@example.test>",
      to: ["rose.cleaning.uk@icloud.com"],
      reply_to: contact.email,
      subject: email.subject,
      text: email.body,
    });
    expect(options.headers["Idempotency-Key"]).toBe("rose/contact-owner:test");
  });
  it("does not pretend to send without credentials", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect((await resendAdapter.send(email)).status).toBe("failed");
    expect(fetcher).not.toHaveBeenCalled();
    expect(contactReceipt("failed", "reference")).toMatchObject({
      saved: true,
      emailStatus: "failed",
    });
  });
  it("distinguishes a definite rejection from uncertain acceptance", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key-no-network");
    vi.stubEnv("EMAIL_FROM", "verified@example.test");
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("denied", { status: 403 }))
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockRejectedValueOnce(new Error("timeout"));
    vi.stubGlobal("fetch", fetcher);
    expect((await resendAdapter.send(email)).status).toBe("failed");
    expect((await resendAdapter.send(email)).status).toBe("uncertain");
    expect((await resendAdapter.send(email)).status).toBe("uncertain");
    expect(contactReceipt("submitted", "reference").message).toContain(
      "Delivery is not yet confirmed",
    );
  });
});
