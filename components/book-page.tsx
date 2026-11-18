import { BookingFlow } from "./booking-flow";
import { getSession } from "@/lib/server/auth";
import { getAddresses, getCatalogue } from "@/lib/server/repository";
import { isConfigured, isDemo } from "@/lib/server/config";
import Link from "next/link";
export async function BookPage({ service }: { service?: string }) {
  if (!isDemo() && !isConfigured())
    return (
      <div className="section stack">
        <h1 style={{ fontSize: 38 }}>Your clean starts here.</h1>
        <p>
          The booking portal needs backend configuration before it can calculate
          and save requests.
        </p>
        <div>
          <Link href="/setup" className="btn">
            View setup instructions
          </Link>
        </div>
      </div>
    );
  const [catalogue, session] = await Promise.all([
    getCatalogue(),
    getSession(),
  ]);
  return (
    <BookingFlow
      catalogue={catalogue}
      signedIn={Boolean(session)}
      demo={isDemo()}
      initialService={
        catalogue.services.some(
          (s) => s.id === service && s.kind === "service" && s.active,
        )
          ? service
          : undefined
      }
      addresses={session ? await getAddresses(session) : []}
    />
  );
}
