"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, MapPin, RefreshCw } from "lucide-react";
import type {
  Address,
  ArrivalWindow,
  BookingDraft,
  Catalogue,
  Quote,
} from "@/lib/types";
import { draftSchema, estimateSchema, postcodeSchema } from "@/lib/validation";
import { dateLabel } from "@/lib/scheduling";
import { money } from "@/lib/pricing";
import { api, Message } from "./ui";
import { Calendar } from "./calendar";
import { QuoteSummary } from "./quote-summary";
const storageKey = "rose-request-draft-v1";
const stepNames = [
  "Your clean",
  "Your home",
  "Extras",
  "Date & time",
  "Review",
];
export function BookingFlow({
  catalogue,
  signedIn,
  demo,
  initialService,
  addresses = [],
}: {
  catalogue: Catalogue;
  signedIn: boolean;
  demo: boolean;
  initialService?: string;
  addresses?: Address[];
}) {
  const [draft, setDraft] = useState<BookingDraft>({
    postcode: "",
    serviceId:
      initialService ||
      catalogue.services.find((s) => s.kind === "service")?.id ||
      "",
    propertyType: "flat",
    bedrooms: 1,
    bathrooms: 1,
    address: "",
    extras: [],
    date: "",
    windowId: "",
    notes: "",
    pets: "",
    access: "",
  });
  const [step, setStep] = useState(0),
    [loaded, setLoaded] = useState(false),
    [quote, setQuote] = useState<Quote | null>(null),
    [token, setToken] = useState(""),
    [estimating, setEstimating] = useState(false),
    [windows, setWindows] = useState<
      (ArrivalWindow & { reason: string | null })[]
    >([]),
    [loadingWindows, setLoadingWindows] = useState(false),
    [error, setError] = useState(""),
    [quoteError, setQuoteError] = useState(""),
    [busy, setBusy] = useState(false),
    [acknowledged, setAcknowledged] = useState(false);
  const idempotencyKey = useRef(""),
    router = useRouter(),
    headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const restore = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const stored = JSON.parse(raw);
          const parsed = estimateSchema.safeParse(stored.draft);
          if (parsed.success) {
            setDraft({
              ...parsed.data,
              ...(initialService ? { serviceId: initialService } : {}),
            });
            setStep(
              Number.isInteger(stored.step)
                ? Math.min(4, Math.max(0, stored.step))
                : 0,
            );
            idempotencyKey.current = stored.key || crypto.randomUUID();
          }
        }
      } catch {
        /* A malformed or blocked browser store does not block the request flow. */
      }
      idempotencyKey.current ||= crypto.randomUUID();
      setLoaded(true);
    }, 0);
    return () => clearTimeout(restore);
  }, [initialService]);
  useEffect(() => {
    if (loaded)
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ draft, step, key: idempotencyKey.current }),
        );
      } catch {}
  }, [draft, step, loaded]);
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setEstimating(true);
      setQuoteError("");
      try {
        const result = await api<{ quote: Quote; quoteToken: string }>(
          "estimate",
          draft,
        );
        if (!cancelled) {
          setQuote(result.quote);
          setToken(result.quoteToken);
        }
      } catch (e) {
        if (!cancelled) {
          setQuoteError((e as Error).message);
          setToken("");
        }
      } finally {
        if (!cancelled) setEstimating(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft, loaded]);
  useEffect(() => {
    if (!draft.date) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingWindows(true);
      try {
        const result = await api<(ArrivalWindow & { reason: string | null })[]>(
          "availability",
          draft,
        );
        if (!cancelled) setWindows(result);
      } catch (e) {
        if (!cancelled) {
          setWindows([]);
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) setLoadingWindows(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft]);
  function update<K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) {
    setDraft((d) => ({ ...d, [key]: value }));
    setAcknowledged(false);
    setError("");
  }
  function go(next: number) {
    setStep(next);
    setError("");
    setAcknowledged(false);
    setTimeout(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    }, 0);
  }
  function next() {
    if (step === 0) {
      const result = postcodeSchema.safeParse(draft.postcode);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      update("postcode", result.data);
    }
    if (step === 1) {
      const result = draftSchema
        .pick({
          address: true,
          propertyType: true,
          bedrooms: true,
          bathrooms: true,
          pets: true,
          access: true,
        })
        .strip()
        .safeParse(draft);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }
    if (step === 2) {
      const result = draftSchema
        .pick({ notes: true, extras: true })
        .strip()
        .safeParse(draft);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }
    if (step === 3) {
      const result = draftSchema.safeParse(draft);
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      const window = windows.find((w) => w.id === draft.windowId);
      if (!window || window.reason) {
        setError(window?.reason || "Choose a date and arrival window.");
        return;
      }
    }
    go(step + 1);
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const parsed = draftSchema.parse(draft);
      const result = await api<{ booking: { id: string } }>("bookings", {
        draft: parsed,
        quoteToken: token,
        idempotencyKey: idempotencyKey.current,
        policyVersion: catalogue.policy?.id ?? null,
        acknowledged,
      });
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
      router.push(`/dashboard/bookings/${result.booking.id}?received=1`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      const details = (
        e as Error & { details?: { quote: Quote; quoteToken: string } }
      ).details;
      if (details?.quote) {
        setQuote(details.quote);
        setToken(details.quoteToken);
        setAcknowledged(false);
      }
    } finally {
      setBusy(false);
    }
  }
  const selectedWindow = catalogue.availability.windows.find(
    (w) => w.id === draft.windowId,
  );
  const extras = catalogue.services.filter(
    (s) => s.kind === "extra" && s.active,
  );
  return (
    <div className="booking-flow">
      <div className="flow-heading">
        <div>
          <h1>Request your clean</h1>
        </div>
      </div>
      {demo && (
        <div className="notice" style={{ marginBottom: 24 }}>
          Demo estimate — final pricing to be confirmed. Calendar slots and
          extras are demonstrations. Please use fictional property details.
        </div>
      )}
      <div className="progress-steps" aria-label={`Step ${step + 1} of 5`}>
        {stepNames.map((name, i) => (
          <div
            className={`progress-step ${i === step ? "current" : i < step ? "done" : ""}`}
            key={name}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i < step ? <Check size={12} /> : i + 1}</span>
            {name}
          </div>
        ))}
      </div>
      <div className="booking-layout">
        <div className="form-panel flow-content">
          <h2 ref={headingRef} tabIndex={-1}>
            {
              [
                "Let’s find your kind of clean",
                "A few details about your home",
                "Make the clean your own",
                "A time that works for you",
                "Your fresh start, all set out",
              ][step]
            }
          </h2>
          <p className="muted">
            {
              [
                "Start with your postcode and the service you have in mind.",
                "Help Rose understand the space and prepare for your visit.",
                "Optional details help Rose agree the right scope with you.",
                catalogue.availability.configured
                  ? "Choose a date, then an arrival window. Pending requests do not reserve a slot."
                  : "Choose a preferred date and time. Rose will review and confirm availability.",
                "Check your details and estimate before sending your request.",
              ][step]
            }
          </p>
          <Message error={error || quoteError} />
          <div style={{ height: error || quoteError ? 18 : 0 }} />
          {step === 0 && (
            <div className="stack">
              <div className="field" style={{ maxWidth: 310 }}>
                <label htmlFor="postcode">Property postcode</label>
                <input
                  id="postcode"
                  value={draft.postcode}
                  onChange={(e) => update("postcode", e.target.value)}
                  autoComplete="postal-code"
                  maxLength={12}
                  placeholder="e.g. SW1A 1AA"
                />
                <small
                  style={{ display: "flex", gap: 5, alignItems: "center" }}
                >
                  <MapPin size={12} /> London · Exact coverage subject to review
                </small>
              </div>
              <fieldset>
                <legend>Which service feels right?</legend>
                <div className="choice-grid">
                  {catalogue.services
                    .filter((s) => s.kind === "service" && s.active)
                    .map((s) => (
                      <label
                        className={`choice ${draft.serviceId === s.id ? "selected" : ""}`}
                        key={s.id}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={s.id}
                          checked={draft.serviceId === s.id}
                          onChange={() => update("serviceId", s.id)}
                        />
                        <div>
                          <strong>{s.name}</strong>
                          <p>{s.description}</p>
                        </div>
                      </label>
                    ))}
                </div>
              </fieldset>
              <p className="small">
                For a workspace, use our{" "}
                <Link className="text-link" href="/office-quote">
                  office quote request
                </Link>
                .
              </p>
            </div>
          )}
          {step === 1 && (
            <div className="stack">
              {addresses.length > 0 && (
                <div className="field">
                  <label htmlFor="saved-address">Use a saved address</label>
                  <select
                    id="saved-address"
                    defaultValue=""
                    onChange={(e) => {
                      const a = addresses.find((a) => a.id === e.target.value);
                      if (a) {
                        setDraft((d) => ({
                          ...d,
                          address: a.address,
                          postcode: a.postcode,
                        }));
                        setAcknowledged(false);
                      }
                    }}
                  >
                    <option value="">Enter a new address</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} · {a.postcode}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <fieldset>
                <legend>Property type</legend>
                <div
                  className="choice-grid"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  {(["flat", "house"] as const).map((type) => (
                    <label
                      className={`choice ${draft.propertyType === type ? "selected" : ""}`}
                      key={type}
                    >
                      <input
                        type="radio"
                        name="propertyType"
                        checked={draft.propertyType === type}
                        onChange={() => update("propertyType", type)}
                      />
                      <strong style={{ textTransform: "capitalize" }}>
                        {type}
                      </strong>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="bedrooms">Bedrooms</label>
                  <select
                    id="bedrooms"
                    value={draft.bedrooms ?? ""}
                    onChange={(e) => update("bedrooms", Number(e.target.value))}
                  >
                    {Array.from({ length: 11 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? "Studio" : i}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="bathrooms">Bathrooms</label>
                  <select
                    id="bathrooms"
                    value={draft.bathrooms ?? ""}
                    onChange={(e) =>
                      update("bathrooms", Number(e.target.value))
                    }
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="address">Full property address</label>
                <textarea
                  id="address"
                  autoComplete="street-address"
                  value={draft.address}
                  onChange={(e) => update("address", e.target.value)}
                  maxLength={300}
                  placeholder="Flat number, building, street and London"
                  style={{ minHeight: 85 }}
                />
              </div>
              <div className="field">
                <label htmlFor="pets">
                  Pets <span className="muted">(optional)</span>
                </label>
                <input
                  id="pets"
                  value={draft.pets}
                  onChange={(e) => update("pets", e.target.value)}
                  maxLength={300}
                  placeholder="e.g. One cat at home"
                />
              </div>
              <div className="field">
                <label htmlFor="access">
                  Parking & access considerations{" "}
                  <span className="muted">(optional)</span>
                </label>
                <textarea
                  id="access"
                  value={draft.access}
                  onChange={(e) => update("access", e.target.value)}
                  maxLength={500}
                  placeholder="e.g. Second floor, lift available, resident parking"
                />
                <small>
                  Do not enter door codes or key-safe codes. Arrange secure
                  access directly with Rose.
                </small>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="stack">
              {extras.length ? (
                <fieldset>
                  <legend>Optional extras</legend>
                  <div className="stack" style={{ gap: 12 }}>
                    {extras.map((extra) => (
                      <label
                        className={`choice ${draft.extras.includes(extra.id) ? "selected" : ""}`}
                        key={extra.id}
                      >
                        <input
                          type="checkbox"
                          checked={draft.extras.includes(extra.id)}
                          onChange={(e) =>
                            update(
                              "extras",
                              e.target.checked
                                ? [...draft.extras, extra.id]
                                : draft.extras.filter((x) => x !== extra.id),
                            )
                          }
                        />
                        <div>
                          <strong>{extra.name}</strong>
                          <p>{extra.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <div className="notice">
                  The final extras catalogue is being prepared. You can describe
                  any additional requirements below; Rose will review them with
                  you.
                </div>
              )}
              <div className="field">
                <label htmlFor="notes">
                  Anything you’d like Rose to know?{" "}
                  <span className="muted">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  value={draft.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  maxLength={1500}
                  placeholder="Tell us about your priorities or any areas needing extra attention."
                />
                <small>
                  No door codes, key-safe codes or payment details, please.
                </small>
              </div>
            </div>
          )}
          {step === 3 && (
            <>
              <div className="pill" style={{ marginBottom: 17 }}>
                {demo
                  ? "Demonstration availability"
                  : catalogue.availability.configured
                    ? "Configured arrival windows"
                    : "Preferred date & time"}
              </div>
              <Calendar
                value={draft.date}
                onChange={(date) => {
                  setDraft((d) => ({ ...d, date, windowId: "" }));
                  setAcknowledged(false);
                  setError("");
                }}
                settings={catalogue.availability}
              />
              {draft.date && (
                <div style={{ marginTop: 25 }}>
                  <label>
                    {catalogue.availability.configured
                      ? "Arrival windows"
                      : "Preferred arrival window"}{" "}
                    · {dateLabel(draft.date)}
                  </label>
                  {loadingWindows ? (
                    <p className="small" role="status">
                      Checking the selected date…
                    </p>
                  ) : (
                    <div className="window-grid">
                      {windows.map((w) => (
                        <button
                          type="button"
                          key={w.id}
                          className={`window-choice ${draft.windowId === w.id ? "selected" : ""}`}
                          aria-pressed={draft.windowId === w.id}
                          disabled={Boolean(w.reason)}
                          title={w.reason || undefined}
                          onClick={() => update("windowId", w.id)}
                        >
                          {w.label}
                          <small>
                            {w.start}–{w.end}
                          </small>
                          {w.reason && <small>{w.reason}</small>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {step === 4 && (
            <div className="stack">
              <dl>
                <div className="review-row">
                  <dt>Service</dt>
                  <dd>{quote?.service}</dd>
                </div>
                <div className="review-row">
                  <dt>Property</dt>
                  <dd>{quote?.property}</dd>
                </div>
                <div className="review-row">
                  <dt>Address</dt>
                  <dd>
                    {draft.address}
                    <br />
                    {draft.postcode}
                  </dd>
                </div>
                <div className="review-row">
                  <dt>Requested time</dt>
                  <dd>
                    {draft.date && dateLabel(draft.date)}
                    <br />
                    {selectedWindow?.label} · {selectedWindow?.start}–
                    {selectedWindow?.end}
                  </dd>
                </div>
                {draft.notes && (
                  <div className="review-row">
                    <dt>Notes</dt>
                    <dd>{draft.notes}</dd>
                  </div>
                )}
                {draft.pets && (
                  <div className="review-row">
                    <dt>Pets</dt>
                    <dd>{draft.pets}</dd>
                  </div>
                )}
                {draft.access && (
                  <div className="review-row">
                    <dt>Access</dt>
                    <dd>{draft.access}</dd>
                  </div>
                )}
              </dl>
              <div className="notice">
                Your submission is a request. Rose will review and confirm the
                details. No payment will be taken.
              </div>
              {catalogue.policy ? (
                <details className="card">
                  <summary>{catalogue.policy.title}</summary>
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: 13,
                      marginTop: 12,
                    }}
                  >
                    {catalogue.policy.content}
                  </p>
                </details>
              ) : (
                <p className="small">
                  Booking terms and policies are drafts awaiting approval. This
                  records your request and acknowledgement, not acceptance of
                  unapproved legal terms.
                </p>
              )}
              {signedIn ? (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                  />
                  <span>
                    I have reviewed the details and{" "}
                    {quote?.kind === "unpriced"
                      ? "understand the price is to be confirmed"
                      : "the complete estimate"}
                    . I understand this request is awaiting confirmation from
                    Rose.
                    {catalogue.policy
                      ? " I have read the booking information above."
                      : ""}
                  </span>
                </label>
              ) : (
                <div
                  className="card stack"
                  style={{ background: "var(--pale)" }}
                >
                  <h3>Keep your request together</h3>
                  <p className="small">
                    Sign in or create a free account to send your request. Your
                    draft will be kept in this browser tab.
                  </p>
                  <div className="actions">
                    <Link href="/signup?next=/book" className="btn">
                      Create free account
                    </Link>
                    <Link href="/login?next=/book" className="btn secondary">
                      Log in
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          <div
            className="mobile-estimate"
            aria-live="polite"
            aria-busy={estimating}
          >
            <span>
              {quote?.kind === "demo" ? "Demo estimate" : "Your estimate"}
              <small>{estimating ? "Updating…" : "Full breakdown below"}</small>
            </span>
            <strong>{money(quote?.totalPence ?? null)}</strong>
          </div>
          <div className="flow-buttons">
            {step > 0 ? (
              <button
                className="btn secondary"
                type="button"
                onClick={() => go(step - 1)}
                disabled={busy}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <span className="small muted">Step 1 of 5</span>
            )}
            {step < 4 ? (
              <button
                className="btn"
                type="button"
                onClick={next}
                disabled={!loaded || busy}
              >
                Continue
              </button>
            ) : signedIn ? (
              <button
                className="btn"
                type="button"
                disabled={!acknowledged || busy || estimating || !token}
                onClick={submit}
              >
                {busy ? "Sending request…" : "Send cleaning request"}
              </button>
            ) : (
              <span className="small muted">Sign in to send</span>
            )}
          </div>
          <p className="small" style={{ marginTop: 16 }}>
            Draft saved in this browser tab.{" "}
            <button
              type="button"
              style={{
                background: "none",
                border: 0,
                padding: 0,
                color: "var(--berry)",
                textDecoration: "underline",
              }}
              onClick={() => {
                if (
                  window.confirm("Clear this request draft and start again?")
                ) {
                  sessionStorage.removeItem(storageKey);
                  idempotencyKey.current = crypto.randomUUID();
                  setDraft({
                    postcode: "",
                    serviceId:
                      catalogue.services.find((s) => s.kind === "service")
                        ?.id || "",
                    propertyType: "flat",
                    bedrooms: 1,
                    bathrooms: 1,
                    address: "",
                    extras: [],
                    date: "",
                    windowId: "",
                    notes: "",
                    pets: "",
                    access: "",
                  });
                  go(0);
                }
              }}
            >
              Clear draft
            </button>
          </p>
        </div>
        <div>
          <QuoteSummary quote={quote} loading={estimating} />
          <p
            className="small"
            style={{
              padding: "18px 8px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <RefreshCw size={14} style={{ marginTop: 3 }} />
            Recalculated securely before you submit. Changed totals always need
            another review.
          </p>
        </div>
      </div>
    </div>
  );
}
