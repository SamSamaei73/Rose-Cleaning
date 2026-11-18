import { requirePageSession } from "@/lib/server/auth";
import { getCatalogue } from "@/lib/server/repository";
import { isDemo } from "@/lib/server/config";
import { CatalogueEditor } from "@/components/catalogue-editor";
export const metadata = { title: "Services & pricing" };
export default async function Catalogue() {
  await requirePageSession(true);
  return (
    <>
      <div className="portal-heading">
        <div>
          <h1>Services & pricing</h1>
          <p>Keep the catalogue clear and publish prices only when approved.</p>
        </div>
      </div>
      <CatalogueEditor catalogue={await getCatalogue(true)} demo={isDemo()} />
    </>
  );
}
