import { LegalDraft } from "@/components/legal";
export const metadata = { title: "Cancellation — draft" };
export default function Cancellation() {
  return (
    <LegalDraft
      title="Changes & cancellation — draft"
      description="Rose’s final change and cancellation policy is awaiting owner and solicitor completion."
      items={[
        "How and when a customer can change or cancel a visit",
        "Any applicable notice periods and charges, if approved",
        "Relevant cancellation rights and any required consent wording",
        "How Rose handles changes to an agreed date, time or quotation",
        "How disputes and exceptional circumstances are reviewed",
      ]}
    />
  );
}
