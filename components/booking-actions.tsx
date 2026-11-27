"use client";
import { CleaningLoader } from "./cleaning-loader";
import Link from "./app-link";
import { useState, useTransition } from "react";
import { useRouter } from "./navigation-provider";
import type { Booking, Catalogue, Cleaner } from "@/lib/types";
import { ActionButton, api, Message } from "./ui";
import { money } from "@/lib/pricing";
import { londonDate } from "@/lib/scheduling";
export function BookingActions({
  booking,
  staff,
  catalogue,
  cleaners = [],
}: {
  booking: Booking;
  staff: boolean;
  catalogue: Catalogue;
  cleaners?: Cleaner[];
}) {
  const [proposing, setProposing] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [submitting, setBusy] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const busy = submitting || refreshing;
  const router = useRouter();
  const active = [
    "pending",
    "pending_confirmation",
    "alternative_proposed",
    "confirmed",
  ].includes(booking.status);
  const base = { revision: booking.revision };
  return (
    <div className="stack">
      <Message error={error} message={message} />
      <CleaningLoader active={busy} label="Updating this request…" />
      <div className="actions">
        {staff &&
          ["pending", "pending_confirmation"].includes(booking.status) && (
            <ActionButton
              path={`bookings/${booking.id}/action`}
              body={{ ...base, action: "confirm" }}
              className="btn"
            >
              Confirm request
            </ActionButton>
          )}
        {staff && active && (
          <button
            className="btn secondary"
            onClick={() => setProposing(!proposing)}
          >
            {proposing ? "Close proposal" : "Propose an alternative"}
          </button>
        )}
        {staff &&
          ["pending", "pending_confirmation", "alternative_proposed"].includes(
            booking.status,
          ) && (
            <ActionButton
              path={`bookings/${booking.id}/action`}
              body={{ ...base, action: "reject" }}
              confirmMessage="Reject this request and record the decision for the customer?"
            >
              Reject request
            </ActionButton>
          )}
        {staff && booking.status === "confirmed" && (
          <ActionButton
            path={`bookings/${booking.id}/action`}
            body={{ ...base, action: "complete" }}
            className="btn"
          >
            Mark completed
          </ActionButton>
        )}
        {!staff && booking.status === "alternative_proposed" && (
          <ActionButton
            path={`bookings/${booking.id}/action`}
            body={{ ...base, action: "accept" }}
            className="btn"
            confirmMessage={`Accept the proposed time and complete total of ${money(booking.proposal!.quote.totalPence)}? Capacity will be checked again.`}
          >
            Accept proposed arrangement
          </ActionButton>
        )}
        {active && (
          <ActionButton
            path={`bookings/${booking.id}/action`}
            body={{ ...base, action: "cancel" }}
            confirmMessage="Cancel this request or visit? Rose will see the cancellation in its operations panel."
            className="btn secondary"
          >
            {booking.status === "confirmed" ? "Cancel visit" : "Cancel request"}
          </ActionButton>
        )}
      </div>
      {!staff && active && (
        <p className="small">
          To request a change,{" "}
          <Link href="/contact" className="btn secondary small action-link">
            contact Rose
          </Link>{" "}
          with reference {booking.id.slice(0, 8)}. Rose can propose an
          alternative here for you to review.
        </p>
      )}
      {staff && proposing && (
        <form
          className="card stack"
          style={{ background: "var(--pale)" }}
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            const form = new FormData(e.currentTarget);
            try {
              await api(`bookings/${booking.id}/action`, {
                ...base,
                action: "propose",
                proposal: {
                  date: form.get("date"),
                  windowId: form.get("window"),
                  totalPence: Math.round(Number(form.get("price")) * 100),
                  message: form.get("message"),
                },
              });
              setProposing(false);
              startRefresh(() => router.refresh());
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>Agree the change with your customer</h3>
          <p className="small">
            This proposal is not a confirmation. The customer must accept the
            date, arrival window and complete quotation. Existing reservations
            stay held until acceptance or cancellation.
          </p>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="proposal-date">Proposed date</label>
              <input
                type="date"
                id="proposal-date"
                name="date"
                defaultValue={booking.draft.date}
                min={londonDate()}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="proposal-window">Arrival window</label>
              <select
                name="window"
                id="proposal-window"
                defaultValue={booking.draft.windowId}
              >
                {catalogue.availability.windows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label} · {w.start}–{w.end}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="proposal-price">
              Complete customer-facing price (GBP)
            </label>
            <input
              id="proposal-price"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              max="100000"
              defaultValue={
                booking.quote.totalPence === null
                  ? ""
                  : booking.quote.totalPence / 100
              }
              required
            />
            <small>
              Include all mandatory charges. Do not add an unapproved tax
              statement.
            </small>
          </div>
          <div className="field">
            <label htmlFor="proposal-message">
              Explain the proposal to the customer
            </label>
            <textarea
              id="proposal-message"
              name="message"
              required
              minLength={5}
              maxLength={1000}
            />
          </div>
          <label className="check-label">
            <input type="checkbox" required />
            <span>
              I am authorised to offer this complete quotation and have reviewed
              the service scope.
            </span>
          </label>
          <button className="btn" disabled={busy}>
            {busy ? "Saving…" : "Send proposal for acceptance"}
          </button>
        </form>
      )}
      {staff && (
        <>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setBusy(true);
              const form = new FormData(e.currentTarget);
              try {
                const result = await api<{ message: string }>("staff/assign", {
                  bookingId: booking.id,
                  cleanerId: form.get("cleaner") || null,
                });
                setMessage(result.message);
                startRefresh(() => router.refresh());
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="field">
              <label htmlFor="cleaner">Internal cleaner assignment</label>
              <select
                id="cleaner"
                name="cleaner"
                defaultValue={booking.cleaner_id || ""}
              >
                <option value="">Unassigned</option>
                {cleaners
                  .filter((c) => c.active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <button className="btn secondary small" disabled={busy}>
                Save assignment
              </button>
            </div>
          </form>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const element = e.currentTarget,
                form = new FormData(element);
              setBusy(true);
              setError("");
              try {
                await api("staff/note", {
                  bookingId: booking.id,
                  body: form.get("note"),
                });
                element.reset();
                startRefresh(() => router.refresh());
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="field">
              <label htmlFor="internal-note">Internal note — staff only</label>
              <textarea
                id="internal-note"
                name="note"
                required
                maxLength={3000}
                placeholder="Operational notes. Do not store door codes here."
              />
            </div>
            <div>
              <button className="btn secondary small" disabled={busy}>
                Add internal note
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
