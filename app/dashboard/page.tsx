import Link from "next/link";
import { requirePageSession } from "@/lib/server/auth";
import { listBookings } from "@/lib/server/repository";
import { BookingList } from "@/components/booking-list";
import { serviceCatalogue } from "@/lib/service-catalogue";
export const metadata = { title: "Your dashboard" };
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const session = await requirePageSession();
  const selectedId = (await searchParams).service;
  const selectedService = serviceCatalogue.find(
    (service) => service.id === selectedId && service.journey === "booking",
  );
  const requestHref = selectedService
    ? `/dashboard/book?service=${encodeURIComponent(selectedService.id)}`
    : "/dashboard/book";
  const bookings = await listBookings(session);
  const own = bookings.filter((b) => b.customer_id === session.user.id);
  return (
    <>
      <div className="portal-heading">
        <div>
          <h1>Hello, {session.user.full_name.split(" ")[0] || "there"}</h1>
          <p>Manage your cleaning requests and account.</p>
        </div>
        <div className="actions dashboard-actions">
          <Link href={requestHref} className="btn">
            Request a Clean
          </Link>
          <Link href="/dashboard/settings" className="btn secondary">
            Account & profile
          </Link>
        </div>
      </div>
      {selectedService && (
        <p className="selected-service">
          Selected service: <strong>{selectedService.name}</strong>
        </p>
      )}
      <h2 className="sub-heading">Your requests</h2>
      {!own.length ? (
        <div className="empty">
          <h3>No requests yet</h3>
          <p>Send a cleaning request to see its progress and updates here.</p>
        </div>
      ) : (
        <BookingList bookings={own} />
      )}
      <div className="notice" style={{ marginTop: 25 }}>
        Your request is only confirmed when Rose confirms it. Any alternative
        time or price will be shown for you to accept.
      </div>
    </>
  );
}
