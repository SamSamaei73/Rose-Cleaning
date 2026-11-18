import { LegalDraft } from "@/components/legal";
export const metadata = { title: "Privacy — draft" };
export default function Privacy() {
  return (
    <LegalDraft
      title="Privacy notice — draft"
      description="This notice must be completed before collecting live customer data."
      items={[
        "Data controller identity and privacy contact",
        "Purposes and appropriate lawful bases for processing",
        "Approved processors, hosting locations and any international transfers",
        "Retention periods for account, enquiry and service records",
        "Data access, correction, export and deletion procedures",
        "Rights, complaint routes and essential-cookie details",
      ]}
    />
  );
}
