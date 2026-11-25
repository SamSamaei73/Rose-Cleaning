import { requirePageSession } from "@/lib/server/auth";
import { getAddresses, getCatalogue } from "@/lib/server/repository";
import { CleaningRequestForm } from "@/components/cleaning-request-form";
import { isDemo } from "@/lib/server/config";
import { redirect } from "next/navigation";
export const metadata = { title: "Request a clean" };
export default async function NewRequest({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const session = await requirePageSession();
  if (isDemo()) redirect("/dashboard/book");
  const [catalogue, addresses, params] = await Promise.all([
    getCatalogue(),
    getAddresses(session),
    searchParams,
  ]);
  return (
    <>
      <div className="portal-heading">
        <div>
          <span className="eyebrow">A fresh start</span>
          <h1>Request a clean</h1>
          <p>A few details now. We’ll take care of the next steps together.</p>
        </div>
      </div>
      <CleaningRequestForm
        catalogue={{
          services: catalogue.services,
          availability: catalogue.availability,
        }}
        addresses={addresses}
        selectedService={params.service}
        today={new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/London",
        }).format(new Date())}
      />
    </>
  );
}
