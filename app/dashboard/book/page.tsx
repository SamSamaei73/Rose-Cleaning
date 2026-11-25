import { redirect } from "next/navigation";
import { isDemo } from "@/lib/server/config";
import { BookPage } from "@/components/book-page";
export const metadata = { title: "Request a clean" };
export default async function Book({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  if (!isDemo()) redirect(`/dashboard/requests/new${service ? `?service=${encodeURIComponent(service)}` : ""}`);
  return <BookPage service={service} />;
}
