import { ClipboardList, Clock3 } from "lucide-react";
import { money } from "@/lib/pricing";
import type { Quote } from "@/lib/types";
import { CleaningLoader } from "./cleaning-loader";
export function QuoteSummary({
  quote,
  loading = false,
}: {
  quote: Quote | null;
  loading?: boolean;
}) {
  return (
    <aside className="summary" aria-label="Cost summary">
      <div className="summary-top">
        <h2>
          <ClipboardList size={19} strokeWidth={1.6} /> Your clean, at a glance
        </h2>
      </div>
      <div className="summary-body" aria-live="polite" aria-busy={loading}>
        <CleaningLoader active={loading} label="Updating your estimate…" />
        {quote ? (
          <>
            <div className="summary-service">{quote.service}</div>
            <div className="summary-property">{quote.property}</div>
            {quote.kind !== "unpriced" && (
              <p
                className="small"
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Clock3 size={13} /> Indicative duration:{" "}
                {Number((quote.durationMinutes / 60).toFixed(2))} hours
              </p>
            )}
            {quote.lines.map((line, i) => (
              <div className="quote-line" key={i}>
                <span>
                  {line.label}
                  {i === 0 &&
                    quote.kind !== "unpriced" &&
                    quote.lines[0].quantity !== 1 && (
                      <small
                        style={{ display: "block", color: "var(--muted)" }}
                      >
                        {Number(line.quantity.toFixed(2))} hours · minimum may
                        apply
                      </small>
                    )}
                </span>
                <span>
                  {line.totalPence === null
                    ? "To confirm"
                    : money(line.totalPence)}
                </span>
              </div>
            ))}
            <div className="quote-total">
              <span className="small">
                {quote.kind === "demo"
                  ? "Demonstration total"
                  : quote.kind === "approved"
                    ? "Complete quotation total"
                    : "Your price"}
              </span>
              <strong>{money(quote.totalPence)}</strong>
              <p className="small" style={{ marginTop: 10 }}>
                {quote.note}
              </p>
            </div>
          </>
        ) : !loading ? (
          <p className="small">Choose a service to see the summary.</p>
        ) : null}
      </div>
      <div className="summary-note">
        No payment is taken. Your request is subject to confirmation from Rose.
      </div>
    </aside>
  );
}
