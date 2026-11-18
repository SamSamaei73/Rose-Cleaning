"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountRequest, Availability, Cleaner } from "@/lib/types";
import { ActionButton, api, Message } from "./ui";
export function OperationsSettings({
  availability,
  cleaners,
  requests,
}: {
  availability: Availability;
  cleaners: Cleaner[];
  requests: (AccountRequest & {
    profiles?: { full_name: string; email: string };
  })[];
}) {
  const [value, setValue] = useState(availability),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div className="stack">
      <Message error={error} message={message} />
      <form
        className="card stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          try {
            await api("staff/settings", { kind: "availability", value });
            setMessage("Operational settings saved.");
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 style={{ fontSize: 24 }}>Working hours & capacity</h2>
        <div className="notice">
          Until enabled, the calendar collects preferred dates and times only.
          Review durations, team size and working windows before enabling
          availability. Resolve upcoming reservations before changing these
          settings.
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={value.configured}
            onChange={(e) =>
              setValue((v) => ({ ...v, configured: e.target.checked }))
            }
          />
          <span>
            Operational availability is approved and configured. Allow
            confirmations against these working hours and capacity.
          </span>
        </label>
        <fieldset>
          <legend>Working days</legend>
          <div className="actions">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <label className="check-label" key={day}>
                <input
                  type="checkbox"
                  checked={value.workingDays.includes(i)}
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      workingDays: e.target.checked
                        ? [...v.workingDays, i]
                        : v.workingDays.filter((d) => d !== i),
                    }))
                  }
                />
                {day}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid-3">
          <div className="field">
            <label htmlFor="lead-hours">Notice required (hours)</label>
            <input
              id="lead-hours"
              type="number"
              min={0}
              max={720}
              value={value.leadHours}
              onChange={(e) =>
                setValue((v) => ({ ...v, leadHours: Number(e.target.value) }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="capacity">Concurrent team capacity units</label>
            <input
              id="capacity"
              type="number"
              min={1}
              max={100}
              value={value.capacity}
              onChange={(e) =>
                setValue((v) => ({ ...v, capacity: Number(e.target.value) }))
              }
            />
          </div>
          <div className="field">
            <label htmlFor="horizon">Calendar horizon (days)</label>
            <input
              id="horizon"
              type="number"
              min={1}
              max={365}
              value={value.horizonDays}
              onChange={(e) =>
                setValue((v) => ({ ...v, horizonDays: Number(e.target.value) }))
              }
            />
          </div>
        </div>
        <p className="small">
          A reservation conservatively covers the arrival window plus the
          service duration. Each service consumes its configured team units.
          Pending requests consume no capacity. Confirmed reservations remain
          held while an alternative is considered.
        </p>
        <h3>Arrival windows · Europe/London</h3>
        {value.windows.map((w, i) => (
          <div className="card stack" key={i} style={{ padding: 20 }}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor={`window-id-${i}`}>Stable window ID</label>
                <input
                  id={`window-id-${i}`}
                  value={w.id}
                  pattern="[a-z0-9-]+"
                  maxLength={30}
                  required
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      windows: v.windows.map((x, n) =>
                        n === i ? { ...x, id: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor={`window-label-${i}`}>
                  Customer-facing label
                </label>
                <input
                  id={`window-label-${i}`}
                  value={w.label}
                  required
                  maxLength={50}
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      windows: v.windows.map((x, n) =>
                        n === i ? { ...x, label: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor={`window-start-${i}`}>Earliest arrival</label>
                <input
                  id={`window-start-${i}`}
                  type="time"
                  value={w.start}
                  required
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      windows: v.windows.map((x, n) =>
                        n === i ? { ...x, start: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor={`window-end-${i}`}>Latest arrival</label>
                <input
                  id={`window-end-${i}`}
                  type="time"
                  value={w.end}
                  required
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      windows: v.windows.map((x, n) =>
                        n === i ? { ...x, end: e.target.value } : x,
                      ),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <button
                type="button"
                className="text-link"
                disabled={value.windows.length <= 1}
                onClick={() =>
                  setValue((v) => ({
                    ...v,
                    windows: v.windows.filter((_, n) => n !== i),
                  }))
                }
              >
                Remove window
              </button>
            </div>
          </div>
        ))}
        <div>
          <button
            type="button"
            className="btn secondary small"
            onClick={() =>
              setValue((v) => ({
                ...v,
                windows: [
                  ...v.windows,
                  {
                    id: `window-${v.windows.length + 1}`,
                    label: "",
                    start: "09:00",
                    end: "11:00",
                  },
                ],
              }))
            }
          >
            Add arrival window
          </button>
        </div>
        <div className="field">
          <label htmlFor="blackouts">Unavailable dates</label>
          <textarea
            id="blackouts"
            defaultValue={value.blackoutDates.join("\n")}
            placeholder="YYYY-MM-DD, one date per line"
            onChange={(e) =>
              setValue((v) => ({
                ...v,
                blackoutDates: e.target.value
                  .split(/[,\n]/)
                  .map((v) => v.trim())
                  .filter(Boolean),
              }))
            }
          />
          <small>One date per line, in YYYY-MM-DD format.</small>
        </div>
        <button className="btn" disabled={busy}>
          Save availability settings
        </button>
      </form>
      <section className="card stack">
        <h2 style={{ fontSize: 24 }}>Internal cleaner records</h2>
        <p className="small">
          These are managed staff records for manual assignments. No cleaner
          accounts, public profiles or job boards are created.
        </p>
        {cleaners.length ? (
          <ul>
            {cleaners.map((c) => (
              <li key={c.id}>
                {c.name} · {c.active ? "Active" : "Inactive"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="small">No internal cleaner records yet.</p>
        )}
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const element = e.currentTarget;
            setError("");
            setBusy(true);
            try {
              await api("staff/cleaner", {
                name: new FormData(element).get("name"),
              });
              element.reset();
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="field">
            <label htmlFor="cleaner-name">Cleaner name</label>
            <input
              id="cleaner-name"
              name="name"
              minLength={2}
              maxLength={100}
              required
            />
          </div>
          <div>
            <button className="btn secondary" disabled={busy}>
              Add internal record
            </button>
          </div>
        </form>
      </section>
      <section className="card stack">
        <h2 style={{ fontSize: 24 }}>Account deletion requests</h2>
        <p className="small">
          Review identity, open visits and retention requirements before any
          deletion. This panel records review status; it does not claim that
          retained records have been erased. The README contains the operator
          procedure.
        </p>
        {requests.length ? (
          requests.map((r) => (
            <div className="card stack" key={r.id}>
              <strong>
                {r.profiles?.full_name ??
                  `Customer ${r.customer_id.slice(0, 8)}`}
              </strong>
              <p className="small">
                {r.profiles?.email}
                <br />
                {new Date(r.created_at).toLocaleString("en-GB", {
                  timeZone: "Europe/London",
                })}{" "}
                · {r.status.replaceAll("_", " ")}
              </p>
              {r.status === "requested" && (
                <ActionButton
                  path="staff/account-request"
                  body={{ id: r.id, status: "in_review" }}
                >
                  Mark as under review
                </ActionButton>
              )}
            </div>
          ))
        ) : (
          <p className="small">No account deletion requests.</p>
        )}
      </section>
    </div>
  );
}
