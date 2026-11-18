import { requirePageSession } from "@/lib/server/auth";
import { listBookings } from "@/lib/server/repository";
import { BookingList } from "@/components/booking-list";
export const metadata = { title: "Your cleaning requests" };
export default async function Bookings() {
  const s = await requirePageSession();
  return (
    <>
      <div className="portal-heading">
        <div>
          <h1>Your cleaning requests</h1>
          <p>Every request, visit and update in one place.</p>
        </div>
      </div>
      <BookingList
        bookings={(await listBookings(s)).filter(
          (b) => b.customer_id === s.user.id,
        )}
      />
    </>
  );
}
