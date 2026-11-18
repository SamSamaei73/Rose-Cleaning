import { requirePageSession } from "@/lib/server/auth";
import { getCatalogue, listBookings } from "@/lib/server/repository";
import { StaffBookings } from "@/components/staff-bookings";
export const metadata = { title: "Requests & visits" };
export default async function Bookings() {
  const s = await requirePageSession(true);
  return (
    <>
      <div className="portal-heading">
        <div>
          <h1>Requests & visits</h1>
          <p>A request becomes a booking only after confirmation.</p>
        </div>
      </div>
      <StaffBookings
        bookings={await listBookings(s)}
        services={(await getCatalogue(true)).services}
      />
    </>
  );
}
