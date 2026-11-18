import { BookPage } from "@/components/book-page";
export const metadata = { title: "Request a clean" };
export default async function Book({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <BookPage service={service} />
    </div>
  );
}
