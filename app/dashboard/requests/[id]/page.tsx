import { notFound } from "next/navigation";
import { z } from "zod";
import { BookingDetail } from "@/components/booking-detail";
export const metadata = { title: "Request details" };
export default async function RequestDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ received?: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return (
    <BookingDetail id={id} received={(await searchParams).received === "1"} />
  );
}
