import Link from "next/link";
import { requirePageSession } from "@/lib/server/auth";
import { getCatalogue, listBookings } from "@/lib/server/repository";
import { dateLabel, londonDate } from "@/lib/scheduling";
import { Status } from "@/components/booking-list";
export const metadata = { title: "Operations calendar" };
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const s = await requirePageSession(true);
  const { from } = await searchParams;
  const valid =
    from && /^\d{4}-\d{2}-\d{2}$/.test(from) && !Number.isNaN(Date.parse(from));
  const start = valid ? from! : londonDate();
  const all = await listBookings(s);
  const catalogue = await getCatalogue();
  const days = Array.from({ length: 14 }, (_, i) =>
    new Date(Date.parse(`${start}T12:00:00Z`) + i * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  const offset = (n: number) =>
    new Date(Date.parse(`${start}T12:00:00Z`) + n * 86400000)
      .toISOString()
      .slice(0, 10);
  return (
    <>
      <div className="portal-heading">
        <div>
          <h1>The next fortnight</h1>
          <p>
            Confirmed visits reserve capacity. Pending requests are preferences.
          </p>
        </div>
        <div className="actions">
          <Link
            className="btn secondary small"
            href={`/staff/calendar?from=${offset(-14)}`}
          >
            Previous
          </Link>
          <Link className="btn secondary small" href="/staff/calendar">
            Today
          </Link>
          <Link
            className="btn secondary small"
            href={`/staff/calendar?from=${offset(14)}`}
          >
            Next
          </Link>
        </div>
      </div>
      <div className="notice" style={{ marginBottom: 24 }}>
        Europe/London ·{" "}
        {catalogue.availability.configured
          ? `${catalogue.availability.capacity} configured team capacity units. Reservations cover the arrival window plus service duration.`
          : "Availability is not configured. Dates are preferences until working hours and capacity are approved."}
      </div>
      <div className="calendar-list">
        {days.map((day) => {
          const items = all.filter(
            (b) =>
              b.draft.date === day &&
              ["pending", "pending_confirmation", "confirmed", "alternative_proposed"].includes(
                b.status,
              ),
          );
          return (
            <section className="card" key={day}>
              <h3>{dateLabel(day).replace(/,? \d{4}$/, "")}</h3>
              {items.length ? (
                items.map((b) => (
                  <Link
                    className="calendar-visit"
                    style={{ display: "block" }}
                    href={`/staff/bookings/${b.id}`}
                    key={b.id}
                  >
                    <strong>{b.customer_name}</strong>
                    <span>{b.quote.service}</span>
                    <p>
                      {catalogue.availability.windows.find(
                        (w) => w.id === b.draft.windowId,
                      )?.label ?? b.draft.windowId}{" "}
                      · {b.draft.postcode}
                    </p>
                    <Status status={b.status} />
                    {b.reserved_start && (
                      <p className="small">Capacity reserved</p>
                    )}
                  </Link>
                ))
              ) : (
                <p className="small">No visits or requests.</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
