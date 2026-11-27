"use client";
import { CleaningLoader } from "./cleaning-loader";
import { useRouter } from "./navigation-provider";
import { useRef, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import type { Address, Catalogue } from "@/lib/types";
import { api, Message } from "./ui";

export function CleaningRequestForm({
  catalogue,
  addresses,
  selectedService,
  today,
}: {
  catalogue: Pick<Catalogue, "services" | "availability">;
  addresses: Address[];
  selectedService?: string;
  today: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState(addresses[0]?.address || "");
  const [postcode, setPostcode] = useState(addresses[0]?.postcode || "");
  const key = useRef("");
  const inFlight = useRef(false);
  return (
    <form
      className="request-form card stack"
      onSubmit={async (event) => {
        event.preventDefault();
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setError("");
        const form = new FormData(event.currentTarget);
        key.current ||= crypto.randomUUID();
        try {
          const { booking } = await api<{ booking: { id: string } }>(
            "requests",
            {
              serviceId: form.get("serviceId"),
              address,
              postcode,
              date: form.get("date"),
              windowId: form.get("windowId"),
              propertyType: form.get("propertyType"),
              propertyDetails: form.get("propertyDetails"),
              notes: form.get("notes") || "",
              idempotencyKey: key.current,
            },
          );
          router.push(`/dashboard/requests/${booking.id}?received=1`);
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
          inFlight.current = false;
          setBusy(false);
        }
      }}
    >
      <Message error={error} />
      <CleaningLoader active={busy} label="Saving your cleaning request…" />
      <fieldset disabled={busy} className="stack">
        <legend className="sr-only">Your cleaning preferences</legend>
        <div className="field">
          <label htmlFor="request-service">Which service do you need?</label>
          <select
            id="request-service"
            name="serviceId"
            required
            defaultValue={selectedService || ""}
          >
            <option value="" disabled>
              Choose a service
            </option>
            {catalogue.services
              .filter((s) => s.kind === "service" && s.active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
        {addresses.length > 0 && (
          <div className="field">
            <label htmlFor="saved-address">Use a saved address</label>
            <select
              id="saved-address"
              defaultValue={addresses[0].id}
              onChange={(e) => {
                const saved = addresses.find((a) => a.id === e.target.value);
                setAddress(saved?.address || "");
                setPostcode(saved?.postcode || "");
              }}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} · {a.postcode}
                </option>
              ))}
              <option value="">A different address</option>
            </select>
          </div>
        )}
        <div className="form-grid">
          <div className="field span-2">
            <label htmlFor="request-address">Property address</label>
            <input
              id="request-address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              minLength={5}
              maxLength={300}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="request-postcode">Postcode</label>
            <input
              id="request-postcode"
              name="postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              autoComplete="postal-code"
              maxLength={12}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="request-property">Property type</label>
            <select
              id="request-property"
              name="propertyType"
              defaultValue="house"
            >
              <option value="house">House</option>
              <option value="flat">Flat</option>
              <option value="other">Workplace or other</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="request-date">Preferred date</label>
            <input
              id="request-date"
              name="date"
              type="date"
              min={today}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="request-time">Preferred arrival time</label>
            <select id="request-time" name="windowId" defaultValue="flexible">
              <option value="flexible">I’m flexible</option>
              {catalogue.availability.windows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} · {w.start}–{w.end}
                </option>
              ))}
            </select>
          </div>
          <div className="field span-2">
            <label htmlFor="request-details">A little about the property</label>
            <input
              id="request-details"
              name="propertyDetails"
              placeholder="e.g. A 2-bedroom flat with 1 bathroom"
              minLength={3}
              maxLength={500}
              required
            />
            <small>
              Size, number of rooms or the areas you’d like cleaned.
            </small>
          </div>
          <div className="field span-2">
            <label htmlFor="request-notes">
              Anything else? <span className="muted">(optional)</span>
            </label>
            <textarea
              id="request-notes"
              name="notes"
              rows={3}
              maxLength={1500}
              aria-describedby="request-notes-help"
            />
            <small id="request-notes-help">
              Please leave out door, alarm and key-safe codes. Arrange secure
              access directly with Rose.
            </small>
          </div>
        </div>
      </fieldset>
      <div className="request-note">
        <MapPin size={18} />
        <p>
          Your date and time are preferences, not confirmed availability. Rose
          will agree the scope, price and visit with you.
        </p>
      </div>
      <button className="btn" disabled={busy}>
        {busy ? "Saving your request…" : "Send cleaning request"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
