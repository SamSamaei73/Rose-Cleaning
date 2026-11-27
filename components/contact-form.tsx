"use client";
import { CleaningLoader } from "./cleaning-loader";
import { useRef, useState } from "react";
import Link from "@/components/app-link";
import { serviceCatalogue } from "@/lib/service-catalogue";
import { api, Message } from "./ui";
export function ContactForm({
  office = false,
  demo = false,
  subject = "",
  serviceId = "",
}: {
  office?: boolean;
  demo?: boolean;
  subject?: string;
  serviceId?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const key = useRef("");
  return (
    <form
      className="form-panel stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || message) return;
        setBusy(true);
        setError("");
        const form = new FormData(e.currentTarget);
        const selectedService = serviceCatalogue.find(
          (service) => service.id === form.get("service"),
        );
        key.current ||= crypto.randomUUID();
        try {
          const result = await api<{ message: string }>("contact", {
            kind: office ? "office" : "contact",
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone") || "",
            company: form.get("company") || "",
            postcode: form.get("postcode") || "",
            subject:
              selectedService?.name ||
              (office ? "Office cleaning enquiry" : "General enquiry"),
            message: form.get("message") || "",
            website: form.get("website") || "",
            idempotencyKey: key.current,
          });
          setMessage(result.message);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 style={{ fontSize: 24 }}>
        {office
          ? "Tell us about your workspace"
          : serviceId
            ? "Request a quote"
            : "Send a message"}
      </h2>
      {demo && (
        <div className="notice">
          Demo form · Use fictional details. Submissions are temporary and no
          email is sent.
        </div>
      )}
      <Message error={error} message={message} />
      <CleaningLoader active={busy} label="Saving your enquiry…" />
      {!message && (
        <>
          <div className="form-grid">
            <div className="field span-2">
              <label htmlFor="enquiry-service">Service</label>
              <select
                id="enquiry-service"
                name="service"
                defaultValue={serviceId}
              >
                {!office && <option value="">General enquiry</option>}
                {serviceCatalogue
                  .filter(
                    (service) => !office || service.id === "office-cleaning",
                  )
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
              </select>
              {serviceId && (
                <small>
                  Price to be confirmed. Rose will agree the scope with you.
                </small>
              )}
            </div>
            <div className="field">
              <label htmlFor="contact-name">Your name</label>
              <input
                id="contact-name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
              />
            </div>
            <div className="field">
              <label htmlFor="contact-email">Email address</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </div>
            <div className="field">
              <label htmlFor="contact-phone">
                Phone <span className="muted">(optional)</span>
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
              />
            </div>
            <div className="field">
              <label htmlFor="contact-postcode">
                {office ? "Office postcode" : "Postcode (optional)"}
              </label>
              <input
                id="contact-postcode"
                name="postcode"
                autoComplete="postal-code"
                required={office}
                maxLength={12}
              />
            </div>
            {office && (
              <div className="field span-2">
                <label htmlFor="company">Company name</label>
                <input id="company" name="company" required maxLength={150} />
              </div>
            )}
            <div className="field span-2">
              <label htmlFor="contact-message">
                {office
                  ? "Premises, cleaning needs and preferred schedule"
                  : "How can we help?"}
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                minLength={10}
                maxLength={2800}
                defaultValue={subject}
              />
              <small>
                Please do not include door codes, key-safe codes or payment
                details.
              </small>
            </div>
            <div className="hidden-trap" aria-hidden="true">
              <label htmlFor="website">Leave blank</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
          </div>
          <p className="small">
            Your details are used to respond to your enquiry. The{" "}
            <Link className="btn secondary small action-link inline-action" href="/privacy">
              privacy notice is a draft
            </Link>{" "}
            pending owner completion.
          </p>
          <button className="btn" disabled={busy}>
            {busy
              ? "Saving your enquiry…"
              : office || serviceId
                ? "Send quote request"
                : "Send message"}
          </button>
        </>
      )}
    </form>
  );
}
