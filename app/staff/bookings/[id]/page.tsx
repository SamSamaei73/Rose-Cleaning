import { BookingDetail } from "@/components/booking-detail";
export const metadata = { title: "Review a request" };
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <BookingDetail staff id={(await params).id} />;
}
