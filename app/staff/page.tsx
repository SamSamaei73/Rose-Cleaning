import Link from "next/link";
import { requirePageSession } from "@/lib/server/auth";
import { listBookings } from "@/lib/server/repository";
import { BookingList } from "@/components/booking-list";
export const metadata = { title: "Rose operations" };
export default async function Staff() {
  const s = await requirePageSession(true);
  const all = await listBookings(s);
  const pending = all.filter((b) => b.status === "pending"),
    confirmed = all.filter((b) => b.status === "confirmed"),
    proposals = all.filter((b) => b.status === "alternative_proposed");
  return (
    <>
      <div className="portal-heading">
        <div>
          <span className="eyebrow">Rose operations</span>
          <h1>A clear view of the day</h1>
          <p>
            Review new requests, agree the details and look after each visit.
          </p>
        </div>
        <Link className="btn secondary" href="/staff/calendar">
          View calendar
        </Link>
      </div>
      <div className="metrics">
        {[
          { label: "New requests", value: pending.length },
          { label: "Awaiting acceptance", value: proposals.length },
          { label: "Confirmed visits", value: confirmed.length },
        ].map((v) => (
          <div className="metric" key={v.label}>
            <span className="metric-label">{v.label}</span>
            <strong>{v.value}</strong>
          </div>
        ))}
      </div>
      <h2 className="sub-heading">Ready for your review</h2>
      <BookingList bookings={pending} staff empty="You’re up to date" />
      <h2 className="sub-heading">Upcoming confirmed visits</h2>
      <BookingList
        bookings={confirmed}
        staff
        empty="No confirmed visits yet"
      />
      {proposals.length > 0 && (
        <>
          <h2 className="sub-heading">With your customers</h2>
          <BookingList bookings={proposals} staff />
        </>
      )}
    </>
  );
}
