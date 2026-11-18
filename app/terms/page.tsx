import { LegalDraft } from "@/components/legal";
export const metadata = { title: "Terms — draft" };
export default function Terms() {
  return (
    <LegalDraft
      title="Booking terms — draft"
      description="A place for the owner-approved terms that will apply to Rose’s services."
      items={[
        "Business legal identity and contact details",
        "Approved service descriptions, inclusions and exclusions",
        "How requests, quotations and customer acceptance form an agreement",
        "Complete pricing, payment arrangements and any applicable tax treatment",
        "Property access, customer responsibilities and complaints process",
        "Applicable consumer rights and policy versioning",
      ]}
    />
  );
}
