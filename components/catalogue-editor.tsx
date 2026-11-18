"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Catalogue, Pricing, Service } from "@/lib/types";
import { api, Message } from "./ui";
const rateFields = [
  ["hourlyPence", "Hourly rate (pence)"],
  ["baseMinutes", "Base duration (minutes)"],
  ["bedroomMinutes", "Minutes per bedroom"],
  ["bathroomMinutes", "Minutes per bathroom"],
  ["minimumPence", "Minimum price (pence)"],
] as const;
export function CatalogueEditor({
  catalogue,
  demo,
}: {
  catalogue: Catalogue;
  demo: boolean;
}) {
  const [tab, setTab] = useState("services"),
    [selected, setSelected] = useState<Service>(catalogue.services[0]),
    [pricing, setPricing] = useState<Pricing>(catalogue.pricing),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function save(kind: string, value: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await api<{ message: string }>("staff/settings", {
        kind,
        value,
      });
      setMessage(r.message);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="notice">
        Connected-mode pricing is published only when explicitly marked
        approved. Demonstration rates stay isolated from the connected
        catalogue.
      </div>
      <div className="tab-buttons">
        <button
          className={tab === "services" ? "active" : ""}
          onClick={() => setTab("services")}
        >
          Services & extras
        </button>
        <button
          className={tab === "pricing" ? "active" : ""}
          onClick={() => setTab("pricing")}
        >
          Pricing versions
        </button>
      </div>
      <Message error={error} message={message} />
      {tab === "services" ? (
        <div className="stack" style={{ marginTop: 20 }}>
          <div className="field">
            <label htmlFor="service-edit-select">Choose a catalogue item</label>
            <select
              id="service-edit-select"
              value={selected.id}
              onChange={(e) => {
                setSelected(
                  catalogue.services.find((s) => s.id === e.target.value)!,
                );
                setMessage("");
              }}
            >
              {catalogue.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.active ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn secondary"
            onClick={() =>
              setSelected({
                id: "new-extra",
                name: "",
                description: "",
                detail: "",
                kind: "extra",
                active: false,
                duration_minutes: 30,
                team_size: 1,
                sort_order: 10,
              })
            }
          >
            Add a draft extra
          </button>
          <form
            className="card stack"
            key={selected.id}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void save("service", {
                id: f.get("id"),
                name: f.get("name"),
                description: f.get("description"),
                detail: f.get("detail"),
                kind: f.get("kind"),
                active: f.get("active") === "on",
                duration_minutes: Number(f.get("duration")),
                team_size: Number(f.get("team")),
                sort_order: Number(f.get("sort")),
              });
            }}
          >
            <div className="grid-2">
              <div className="field">
                <label htmlFor="catalogue-id">Stable ID</label>
                <input
                  id="catalogue-id"
                  name="id"
                  defaultValue={selected.id}
                  readOnly={selected.id !== "new-extra"}
                  pattern="[a-z0-9-]+"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="catalogue-kind">Type</label>
                <select
                  id="catalogue-kind"
                  name="kind"
                  defaultValue={selected.kind}
                >
                  <option value="service">Household service</option>
                  <option value="extra">Optional extra</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="catalogue-name">Name</label>
              <input
                id="catalogue-name"
                name="name"
                defaultValue={selected.name}
                maxLength={120}
                minLength={2}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="catalogue-description">Short description</label>
              <input
                id="catalogue-description"
                name="description"
                defaultValue={selected.description}
                maxLength={300}
              />
            </div>
            <div className="field">
              <label htmlFor="catalogue-detail">Service details</label>
              <textarea
                id="catalogue-detail"
                name="detail"
                defaultValue={selected.detail}
                maxLength={2000}
              />
            </div>
            <div className="grid-3">
              <div className="field">
                <label htmlFor="catalogue-duration">
                  Fallback duration (minutes)
                </label>
                <input
                  id="catalogue-duration"
                  type="number"
                  name="duration"
                  defaultValue={selected.duration_minutes}
                  min={15}
                  max={720}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="catalogue-team">Team capacity units</label>
                <input
                  id="catalogue-team"
                  type="number"
                  name="team"
                  defaultValue={selected.team_size}
                  min={1}
                  max={10}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="catalogue-sort">Display order</label>
                <input
                  id="catalogue-sort"
                  type="number"
                  name="sort"
                  defaultValue={selected.sort_order}
                  min={0}
                  max={100}
                  required
                />
              </div>
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                name="active"
                defaultChecked={selected.active}
              />
              <span>
                Show this item in the public catalogue. Confirm that the
                description is approved before publishing it.
              </span>
            </label>
            <p className="small">
              Duration and team units are snapshotted with requests. Existing
              bookings retain their original agreed details.
            </p>
            <button className="btn" disabled={busy}>
              Save catalogue item
            </button>
          </form>
        </div>
      ) : (
        <form
          className="stack"
          style={{ marginTop: 20 }}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void save("pricing", {
              ...pricing,
              version: f.get("version"),
              approved: !demo && f.get("approved") === "on",
              demo,
              totalNote: f.get("totalNote"),
            });
          }}
        >
          <div className="card stack">
            <h2 style={{ fontSize: 23 }}>Create a pricing version</h2>
            <p className="small">
              Use integer pence. 100 pence = £1. The calculator adds the base
              time, bedroom time and bathroom time, multiplies by the hourly
              rate, applies the minimum and adds extras and configured
              adjustments. Versions are append-only.
            </p>
            <div className="field">
              <label htmlFor="pricing-version">New unique version name</label>
              <input
                id="pricing-version"
                name="version"
                placeholder="e.g. owner-review-2026-01"
                required
                maxLength={80}
              />
            </div>
            <div className="field">
              <label htmlFor="load-pricing">
                Load an existing pricing draft
              </label>
              <button
                id="load-pricing"
                type="button"
                className="btn secondary small"
                onClick={async () => {
                  try {
                    const r = await api<{
                      pricingDrafts: ({
                        config?: Pricing;
                      } & Partial<Pricing>)[];
                    }>("staff/data");
                    const latest = r.pricingDrafts[0];
                    if (latest) {
                      setPricing(latest.config ?? (latest as Pricing));
                      setMessage(
                        "Latest pricing version loaded. Enter a new version name to save changes.",
                      );
                    } else setMessage("No saved pricing drafts yet.");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Load latest saved version
              </button>
            </div>
          </div>
          {catalogue.services
            .filter((s) => s.kind === "service")
            .map((s) => (
              <fieldset className="card" key={s.id}>
                <legend style={{ fontSize: 16, padding: "0 8px" }}>
                  {s.name}
                </legend>
                <div className="grid-2">
                  {rateFields.map(([key, label]) => (
                    <div className="field" key={key}>
                      <label htmlFor={`${s.id}-${key}`}>{label}</label>
                      <input
                        id={`${s.id}-${key}`}
                        type="number"
                        min={0}
                        max={key.endsWith("Pence") ? 10000000 : 1440}
                        step={1}
                        required
                        value={pricing.services[s.id]?.[key] ?? ""}
                        onChange={(e) =>
                          setPricing((p) => ({
                            ...p,
                            services: {
                              ...p.services,
                              [s.id]: {
                                ...(p.services[s.id] ?? {
                                  hourlyPence: 0,
                                  baseMinutes: 0,
                                  bedroomMinutes: 0,
                                  bathroomMinutes: 0,
                                  minimumPence: 0,
                                }),
                                [key]: Number(e.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          {catalogue.services
            .filter((s) => s.kind === "extra")
            .map((s) => (
              <fieldset className="card" key={s.id}>
                <legend style={{ fontSize: 16, padding: "0 8px" }}>
                  {s.name}
                </legend>
                <div className="grid-2">
                  {(["pence", "minutes"] as const).map((key) => (
                    <div className="field" key={key}>
                      <label htmlFor={`${s.id}-${key}`}>
                        {key === "pence"
                          ? "Extra price (pence)"
                          : "Extra duration (minutes)"}
                      </label>
                      <input
                        id={`${s.id}-${key}`}
                        type="number"
                        min={0}
                        max={key === "pence" ? 10000000 : 720}
                        required
                        value={pricing.extras[s.id]?.[key] ?? ""}
                        onChange={(e) =>
                          setPricing((p) => ({
                            ...p,
                            extras: {
                              ...p.extras,
                              [s.id]: {
                                ...(p.extras[s.id] ?? { pence: 0, minutes: 0 }),
                                [key]: Number(e.target.value),
                              },
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          <div className="card stack">
            <h3>Charges & discounts</h3>
            <p className="small">
              Only add explicitly approved adjustments. Positive amounts add a
              charge; negative amounts subtract a discount. All amounts are
              integer pence.
            </p>
            {pricing.adjustments.map((a, i) => (
              <div className="grid-2" key={i}>
                <div className="field">
                  <label htmlFor={`adjust-label-${i}`}>Description</label>
                  <input
                    id={`adjust-label-${i}`}
                    required
                    value={a.label}
                    maxLength={100}
                    onChange={(e) =>
                      setPricing((p) => ({
                        ...p,
                        adjustments: p.adjustments.map((x, n) =>
                          n === i ? { ...x, label: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor={`adjust-price-${i}`}>Amount (pence)</label>
                  <input
                    id={`adjust-price-${i}`}
                    type="number"
                    step={1}
                    min={-1000000}
                    max={1000000}
                    value={a.pence}
                    onChange={(e) =>
                      setPricing((p) => ({
                        ...p,
                        adjustments: p.adjustments.map((x, n) =>
                          n === i ? { ...x, pence: Number(e.target.value) } : x,
                        ),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      setPricing((p) => ({
                        ...p,
                        adjustments: p.adjustments.filter((_, n) => n !== i),
                      }))
                    }
                  >
                    Remove adjustment
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn secondary small"
              onClick={() =>
                setPricing((p) => ({
                  ...p,
                  adjustments: [...p.adjustments, { label: "", pence: 0 }],
                }))
              }
            >
              Add adjustment
            </button>
            <div className="field">
              <label htmlFor="total-note">Customer-facing total note</label>
              <textarea
                id="total-note"
                name="totalNote"
                defaultValue={pricing.totalNote}
                maxLength={300}
              />
            </div>
            {!demo && (
              <label className="check-label">
                <input type="checkbox" name="approved" />
                <span>
                  These complete rates and mandatory charges are owner-approved.
                  Activate this version for new quotations.
                </span>
              </label>
            )}
            <div className="notice">
              {demo
                ? "Saving a demo version updates this temporary workspace only. "
                : "Saving without approval keeps connected prices unchanged. "}
              No VAT status, cancellation fee or promotion is assumed.
            </div>
            <button className="btn" disabled={busy}>
              {busy ? "Saving…" : "Save pricing version"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
