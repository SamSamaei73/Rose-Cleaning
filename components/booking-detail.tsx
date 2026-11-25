import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  getBooking,
  getCatalogue,
  listBookings,
} from "@/lib/server/repository";
import { requirePageSession } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/config";
import { demoState } from "@/lib/server/demo";
import { supabaseServer } from "@/lib/server/supabase";
import { dbError } from "@/lib/server/http";
import { dateLabel } from "@/lib/scheduling";
import { statusLabels } from "@/lib/status";
import { Status, BookingList } from "./booking-list";
import { QuoteSummary } from "./quote-summary";
import { BookingActions } from "./booking-actions";
export async function BookingDetail({
  id,
  staff = false,
  received = false,
}: {
  id: string;
  staff?: boolean;
  received?: boolean;
}) {
  const session = await requirePageSession(staff);
  const data = await getBooking(id, session).catch((e) => {
    if (e.message === "NOT_FOUND") notFound();
    throw e;
  });
  const { booking: b, events, notes } = data;
  if (!staff && b.customer_id !== session.user.id) notFound();
  const catalogue = await getCatalogue();
  let cleaners = [];
  if (staff) {
    if (isDemo()) cleaners = (await demoState()).cleaners;
    else {
      const r = await (
        await supabaseServer()
      )
        .from("cleaners")
        .select("*")
        .order("name");
      dbError(r.error);
      cleaners = r.data ?? [];
    }
  }
  const w = catalogue.availability.windows.find(
    (w) => w.id === b.draft.windowId,
  );
  const history = staff
    ? (await listBookings(session)).filter(
        (v) => v.customer_id === b.customer_id && v.id !== b.id,
      )
    : [];
  return (
    <>
      <Link
        className="text-link"
        href={staff ? "/staff/bookings" : "/dashboard"}
      >
        <ArrowLeft size={14} /> Back to {staff ? "requests" : "your account"}
      </Link>
      {received && ["pending", "pending_confirmation"].includes(b.status) && (
        <div
          className="notice success"
          style={{
            marginTop: 25,
            display: "flex",
            gap: 13,
            alignItems: "flex-start",
          }}
        >
          <CheckCircle2 size={22} />
          <div>
            <strong>Request received — awaiting confirmation from Rose.</strong>
            <br />
            You can follow every update here. No payment has been taken.
          </div>
        </div>
      )}
      <div className="portal-heading" style={{ marginTop: 30 }}>
        <div>
          <span className="eyebrow">Reference {b.id.slice(0, 8)}</span>
          <h1>{b.quote.service}</h1>
          <p>
            {dateLabel(b.draft.date)} · {w?.label ?? (b.draft.windowId === "flexible" ? "Flexible time" : b.draft.windowId)}{" "}
            {w ? `${w.start}–${w.end}` : ""} · Europe/London
          </p>
        </div>
        <Status status={b.status} />
      </div>
      {b.status === "alternative_proposed" && b.proposal && (
        <section
          className="card stack"
          style={{ background: "var(--pale)", marginBottom: 25 }}
        >
          <h2 style={{ fontSize: 24 }}>An alternative from Rose</h2>
          <p>{b.proposal.message}</p>
          <p>
            <strong>
              {dateLabel(b.proposal.date)} ·{" "}
              {catalogue.availability.windows.find(
                (w) => w.id === b.proposal?.windowId,
              )?.label ?? b.proposal.windowId}
            </strong>
          </p>
          <QuoteSummary quote={b.proposal.quote} />
          <p className="small">
            The proposal takes effect only after you accept it. Capacity is
            checked again at acceptance.
          </p>
        </section>
      )}
      <div className="detail-grid">
        <div className="stack">
          <section className="card">
            <h2 style={{ fontSize: 22, marginBottom: 15 }}>The details</h2>
            <dl>
              <div className="review-row">
                <dt>Property details</dt>
                <dd>{b.quote.property}</dd>
              </div>
              <div className="review-row">
                <dt>Address</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>
                  {b.draft.address}
                  <br />
                  {b.draft.postcode}
                </dd>
              </div>
              <div className="review-row">
                <dt>Pets</dt>
                <dd>{b.draft.pets || "None mentioned"}</dd>
              </div>
              <div className="review-row">
                <dt>Access & parking</dt>
                <dd>{b.draft.access || "No details provided"}</dd>
              </div>
              <div className="review-row">
                <dt>Your notes</dt>
                <dd style={{ whiteSpace: "pre-wrap" }}>
                  {b.draft.notes || "No additional notes"}
                </dd>
              </div>
              {staff && (
                <>
                  <div className="review-row">
                    <dt>Customer</dt>
                    <dd>
                      {b.customer_name}
                      <br />
                      <a
                        className="text-link"
                        href={`mailto:${b.customer_email}`}
                      >
                        {b.customer_email}
                      </a>
                      <br />
                      {b.customer_phone || "No phone provided"}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </section>
          <section className="card stack">
            <h2 style={{ fontSize: 22 }}>What happens next</h2>
            {["pending", "pending_confirmation"].includes(b.status) && (
              <p className="small">
                Rose will review the service, property, price and preferred time. This
                request is not a reservation yet.
              </p>
            )}
            <BookingActions
              booking={b}
              staff={staff}
              catalogue={catalogue}
              cleaners={cleaners}
            />
          </section>
          {staff && (
            <section className="card stack">
              <h2 style={{ fontSize: 22 }}>Internal notes</h2>
              {notes.length ? (
                notes.map((n) => (
                  <div key={n.id}>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
                      {n.body}
                    </p>
                    <span className="small muted">
                      {new Date(n.created_at).toLocaleString("en-GB", {
                        timeZone: "Europe/London",
                      })}{" "}
                      · Staff {n.actor_id.slice(0, 8)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="small">
                  No internal notes yet. These notes are never shown to the
                  customer.
                </p>
              )}
            </section>
          )}
        </div>
        <div className="stack">
          <QuoteSummary quote={b.quote} />
          <section className="card">
            <h2 style={{ fontSize: 22, marginBottom: 25 }}>Request history</h2>
            <ol className="timeline">
              {events.toReversed().map((e) => (
                <li key={e.id}>
                  <strong>{statusLabels[e.status]}</strong>
                  <p>{e.message}</p>
                  <small>
                    {new Date(e.created_at).toLocaleString("en-GB", {
                      timeZone: "Europe/London",
                    })}
                    <br />
                    {e.actor_id === b.customer_id
                      ? "Customer"
                      : "Rose team"} · {e.actor_id.slice(0, 8)}
                  </small>
                </li>
              ))}
            </ol>
            <p className="small">Pricing version: {b.quote.version}</p>
          </section>
        </div>
      </div>
      {staff && (
        <>
          <h2 className="sub-heading">Customer history</h2>
          <BookingList
            bookings={history}
            staff
            empty="No previous requests for this customer."
          />
        </>
      )}
    </>
  );
}
