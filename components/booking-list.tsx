import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import type { Booking } from "@/lib/types";
import { dateLabel } from "@/lib/scheduling";
import { statusLabels } from "@/lib/status";
import { money } from "@/lib/pricing";
export function Status({ status }: { status: Booking["status"] }) {
  return <span className={`status ${status}`}>{statusLabels[status]}</span>;
}
export function BookingList({
  bookings,
  staff = false,
  empty = "Your next fresh start begins here.",
}: {
  bookings: Booking[];
  staff?: boolean;
  empty?: string;
}) {
  if (!bookings.length)
    return (
      <div className="empty">
        <span className="service-icon">
          <Sparkles size={25} />
        </span>
        <h3>{empty}</h3>
        <p>
          {staff
            ? "New cleaning requests will appear here, ready for your review."
            : "Choose a service and a preferred time. We’ll keep your request and all its updates together here."}
        </p>
        {!staff && (
          <Link className="btn" href="/dashboard/book">
            Request a clean <ArrowRight size={15} />
          </Link>
        )}
      </div>
    );
  return (
    <div className="booking-list">
      {bookings.map((b) => (
        <article className="booking-item" key={b.id}>
          <div>
            <h3>{b.quote.service}</h3>
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 7,
              }}
            >
              <CalendarDays size={14} />
              {dateLabel(b.draft.date)} · {b.draft.windowId}
            </p>
            <p>
              {staff ? `${b.customer_name} · ` : ""}
              {b.draft.postcode} · {b.quote.property}
            </p>
          </div>
          <div className="booking-item-right">
            <Status status={b.status} />
            <span style={{ fontSize: 13 }}>{money(b.quote.totalPence)}</span>
            <Link
              href={`${staff ? "/staff" : "/dashboard"}/bookings/${b.id}`}
              className="text-link"
            >
              View details <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
