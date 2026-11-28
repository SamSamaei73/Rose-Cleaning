"use client";
import { CleaningLoader } from "./cleaning-loader";
import { useState, useTransition } from "react";
import { useRouter } from "./navigation-provider";
import { Download, Plus, Trash2 } from "lucide-react";
import type { Address, Profile } from "@/lib/types";
import { ActionButton, api, Message } from "./ui";
export function AccountSettings({
  profile,
  addresses,
  deletionStatus,
}: {
  profile: Profile;
  addresses: Address[];
  deletionStatus: string | null;
}) {
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [submitting, setBusy] = useState(false),
    [editing, setEditing] = useState<Address | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const busy = submitting || refreshing;
  const router = useRouter();
  return (
    <div className="stack">
      <Message error={error} message={message} />
      <CleaningLoader active={busy} label="Saving your account details…" />
      <div className="grid-2">
        <form
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            setMessage("");
            const form = new FormData(e.currentTarget);
            try {
              const r = await api<{ message: string }>("account/profile", {
                full_name: form.get("name"),
                phone: form.get("phone"),
              });
              setMessage(r.message);
              startRefresh(() => router.refresh());
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2 style={{ fontSize: 22 }}>Your details</h2>
          <div className="field">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              name="name"
              defaultValue={profile.full_name}
              minLength={2}
              maxLength={120}
              autoComplete="name"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="profile-email">Email address</label>
            <input
              id="profile-email"
              type="email"
              value={profile.email}
              readOnly
            />
            <small>
              Email changes require contacting Rose to protect your account.
            </small>
          </div>
          <div className="field">
            <label htmlFor="profile-phone">Contact phone</label>
            <input
              id="profile-phone"
              name="phone"
              defaultValue={profile.phone}
              type="tel"
              maxLength={30}
              autoComplete="tel"
            />
          </div>
          <button className="btn" disabled={busy}>
            Save profile
          </button>
        </form>
        <section className="card stack">
          <h2 style={{ fontSize: 22 }}>Your data, your account</h2>
          <p className="small">
            Download your profile, saved addresses, booking requests and status
            history as a JSON file.
          </p>
          <a className="btn secondary" href="/api/account/export" download>
            <Download size={16} /> Export account data
          </a>
          <hr style={{ border: 0, borderTop: "1px solid var(--border)" }} />
          <h3 style={{ fontSize: 17 }}>Request account deletion</h3>
          <p className="small">
            Rose will review the request and any records that need to be
            retained. Submitting this request does not immediately delete your
            account or booking records.
          </p>
          {deletionStatus ? (
            <div className="notice">
              Deletion status:{" "}
              <strong>{deletionStatus.replaceAll("_", " ")}</strong>. Records
              have not been erased.
            </div>
          ) : (
            <ActionButton
              path="account/deletion"
              body={{ acknowledged: true }}
              confirmMessage="Record an account deletion request? Your records will remain until Rose has reviewed the request."
              className="btn secondary"
            >
              Request deletion
            </ActionButton>
          )}
        </section>
      </div>
      <h2 className="sub-heading">Saved addresses</h2>
      {addresses.length ? (
        <div className="grid-2">
          {addresses.map((a) => (
            <div className="card stack" key={a.id}>
              <h3>{a.label}</h3>
              <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {a.address}
                <br />
                {a.postcode}
              </p>
              <div className="actions">
                <button
                  className="btn secondary small"
                  onClick={() => setEditing(a)}
                >
                  Edit address
                </button>
                <ActionButton
                  path="account/address/delete"
                  body={{ id: a.id }}
                  confirmMessage="Remove this saved address? Existing booking details will be kept."
                >
                  <Trash2 size={13} /> Remove
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>
          You haven’t saved an address yet. Add one to make your next request a
          little quicker.
        </p>
      )}
      <form
        className="card stack"
        key={editing?.id ?? "new-address"}
        onSubmit={async (e) => {
          e.preventDefault();
          const element = e.currentTarget,
            form = new FormData(element);
          setError("");
          setMessage("");
          setBusy(true);
          try {
            const r = await api<{ message: string }>("account/address", {
              id: editing?.id,
              label: form.get("label"),
              address: form.get("address"),
              postcode: form.get("postcode"),
            });
            setMessage(r.message);
            setEditing(null);
            element.reset();
            startRefresh(() => router.refresh());
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h3>{editing ? "Edit address" : "Add an address"}</h3>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="address-label">Address name</label>
            <input
              id="address-label"
              name="label"
              required
              maxLength={60}
              placeholder="e.g. Home"
              defaultValue={editing?.label}
            />
          </div>
          <div className="field">
            <label htmlFor="address-postcode">Postcode</label>
            <input
              id="address-postcode"
              name="postcode"
              required
              maxLength={12}
              defaultValue={editing?.postcode}
              autoComplete="postal-code"
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="saved-address-text">Full address</label>
          <textarea
            id="saved-address-text"
            name="address"
            required
            minLength={5}
            maxLength={300}
            autoComplete="street-address"
            defaultValue={editing?.address}
          />
        </div>
        <div className="actions">
          <button className="btn" disabled={busy}>
            <Plus size={15} />
            {editing ? "Save changes" : "Save address"}
          </button>
          {editing && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => setEditing(null)}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
