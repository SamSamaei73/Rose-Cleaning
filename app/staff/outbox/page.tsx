import { requirePageSession } from "@/lib/server/auth";
import { isDemo } from "@/lib/server/config";
import { demoState } from "@/lib/server/demo";
import { supabaseServer } from "@/lib/server/supabase";
import { dbError } from "@/lib/server/http";
import { Outbox } from "@/components/outbox";
export const metadata = { title: "Enquiries & notifications" };
export default async function OutboxPage() {
  await requirePageSession(true);
  let notifications = [],
    submissions = [];
  if (isDemo()) {
    const s = await demoState();
    notifications = s.notifications.toReversed();
    submissions = s.submissions.toReversed();
  } else {
    const db = await supabaseServer();
    const [n, s] = await Promise.all([
      db
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    dbError(n.error);
    dbError(s.error);
    notifications = n.data ?? [];
    submissions = s.data ?? [];
  }
  return (
    <>
      <div className="portal-heading">
        <div>
          <h1>Enquiries & notifications</h1>
          <p>See what customers have asked and what the system has prepared.</p>
        </div>
      </div>
      <Outbox notifications={notifications} submissions={submissions} />
    </>
  );
}
