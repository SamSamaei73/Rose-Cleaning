import { BookingDetail } from "@/components/booking-detail";
export const metadata = { title: "Request details" };
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ received?: string }>;
}) {
  return (
    <BookingDetail
      id={(await params).id}
      received={(await searchParams).received === "1"}
    />
  );
}
