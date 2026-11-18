import { requirePageSession } from "@/lib/server/auth";
import { getCatalogue } from "@/lib/server/repository";
import { isDemo } from "@/lib/server/config";
import { demoState } from "@/lib/server/demo";
import { supabaseServer } from "@/lib/server/supabase";
import { dbError } from "@/lib/server/http";
import { OperationsSettings } from "@/components/operations-settings";
export const metadata = { title: "Team & operational settings" };
export default async function Settings() {
  await requirePageSession(true);
  let cleaners = [],
    requests = [];
  if (isDemo()) {
    const s = await demoState();
    cleaners = s.cleaners;
    requests = s.requests;
  } else {
    const db = await supabaseServer();
    const [c, r] = await Promise.all([
      db.from("cleaners").select("*").order("name"),
      db
        .from("account_requests")
        .select("*,profiles(full_name,email)")
        .order("created_at", { ascending: false }),
    ]);
    dbError(c.error);
    dbError(r.error);
    cleaners = c.data ?? [];
    requests = r.data ?? [];
  }
  return (
    <>
      <div className="portal-heading">
        <div>
          <h1>Team & settings</h1>
          <p>Set the operational details behind each customer request.</p>
        </div>
      </div>
      <OperationsSettings
        availability={(await getCatalogue()).availability}
        cleaners={cleaners}
        requests={requests}
      />
    </>
  );
}
