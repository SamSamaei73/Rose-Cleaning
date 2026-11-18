import { requirePageSession } from "@/lib/server/auth";
import { getAddresses } from "@/lib/server/repository";
import { isDemo } from "@/lib/server/config";
import { demoState } from "@/lib/server/demo";
import { supabaseServer } from "@/lib/server/supabase";
import { dbError } from "@/lib/server/http";
import { AccountSettings } from "@/components/account-settings";
export const metadata = { title: "Account & addresses" };
export default async function Settings() {
  const s = await requirePageSession();
  let status: string | null = null;
  if (isDemo())
    status =
      (await demoState()).requests.find((r) => r.customer_id === s.user.id)
        ?.status ?? null;
  else {
    const { data, error } = await (
      await supabaseServer()
    )
      .from("account_requests")
      .select("status")
      .eq("customer_id", s.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    dbError(error);
    status = data?.status ?? null;
  }
  return (
    <>
      <div className="portal-heading">
        <div>
          <h1>Your account</h1>
          <p>Keep your details up to date, so we can take care of the rest.</p>
        </div>
      </div>
      <AccountSettings
        profile={s.user}
        addresses={await getAddresses(s)}
        deletionStatus={status}
      />
    </>
  );
}
