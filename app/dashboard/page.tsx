import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { requirePageSession } from "@/lib/server/auth";
import { listBookings } from "@/lib/server/repository";
import { BookingList } from "@/components/booking-list";
export const metadata = { title: "Your dashboard" };
export default async function Dashboard() {
  const session = await requirePageSession();
  const bookings = await listBookings(session);
  const own = bookings.filter((b) => b.customer_id === session.user.id);
  const pending = own.filter((b) =>
    ["pending", "alternative_proposed"].includes(b.status),
  );
  const upcoming = own.filter((b) => b.status === "confirmed");
  const past = own.filter((b) =>
    ["completed", "cancelled", "rejected"].includes(b.status),
  );
  return (
    <>
      <div className="portal-heading">
        <div>
          <span className="eyebrow">A little more room for life</span>
          <h1>Hello, {session.user.full_name.split(" ")[0] || "there"}.</h1>
          <p>Your home, your plans and all the details. Right here.</p>
        </div>
        <Link href="/dashboard/book" className="btn">
          Request a clean <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="metrics">
        {[
          { label: "Awaiting a decision", value: pending.length, icon: Clock3 },
          {
            label: "Confirmed visits",
            value: upcoming.length,
            icon: CalendarDays,
          },
          { label: "Past requests", value: past.length, icon: Sparkles },
        ].map(({ label, value, icon: Icon }) => (
          <div className="metric" key={label}>
            <span className="metric-label">
              {label}
              <Icon size={17} />
            </span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {!own.length ? (
        <BookingList bookings={[]} />
      ) : (
        <>
          <h2 className="sub-heading">Pending requests & proposals</h2>
          <BookingList bookings={pending} empty="Everything is up to date." />
          <h2 className="sub-heading">Your confirmed visits</h2>
          <BookingList
            bookings={upcoming}
            empty="No confirmed visits just yet."
          />
          {past.length > 0 && (
            <>
              <h2 className="sub-heading">Past & closed requests</h2>
              <BookingList bookings={past} />
            </>
          )}
        </>
      )}
      <div className="notice" style={{ marginTop: 25 }}>
        Your request is only confirmed when Rose confirms it. Any alternative
        time or price will be shown for you to accept.
      </div>
    </>
  );
}
