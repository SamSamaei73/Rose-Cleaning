import { BookPage } from "@/components/book-page";
export const metadata = { title: "Request a clean" };
export default async function Book({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  return <BookPage service={(await searchParams).service} />;
}
