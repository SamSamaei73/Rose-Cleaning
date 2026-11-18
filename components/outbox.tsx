import type { Notification, Submission } from "@/lib/types";
import { ActionButton } from "./ui";
const label = {
  preview: "Development preview · not sent",
  queued: "Queued · not sent",
  sending: "Provider request in progress · check if stale",
  submitted: "Submitted to provider · delivery not verified",
  failed: "Provider request failed · check error",
  uncertain: "Uncertain · check provider before retrying",
};
export function Outbox({
  notifications,
  submissions,
}: {
  notifications: Notification[];
  submissions: Submission[];
}) {
  return (
    <div className="stack">
      <div className="notice">
        Request acknowledgements and booking confirmations are separate events.
        Previews never send messages. A provider submission is not proof of
        delivery. Stale “sending” or “uncertain” records require a provider
        check before any retry.
      </div>
      <section className="card stack">
        <h2 style={{ fontSize: 24 }}>Customer enquiries</h2>
        {submissions.length ? (
          submissions.map((s) => (
            <article key={s.id} className="card stack">
              <div className="actions">
                <span className="pill">
                  {s.kind === "office" ? "Office quote" : "Contact enquiry"}
                </span>
                <span className="small muted">
                  {new Date(s.created_at).toLocaleString("en-GB", {
                    timeZone: "Europe/London",
                  })}
                </span>
              </div>
              <h3>
                {s.name}
                {s.company ? ` · ${s.company}` : ""}
              </h3>
              <p className="small">
                <a className="text-link" href={`mailto:${s.email}`}>
                  {s.email}
                </a>
                {s.phone ? ` · ${s.phone}` : ""}
                <br />
                {s.postcode}
              </p>
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 13,
                  overflowWrap: "anywhere",
                }}
              >
                {s.message}
              </p>
            </article>
          ))
        ) : (
          <p className="small">No contact or office quote submissions yet.</p>
        )}
      </section>
      <section className="card">
        <div
          className="section-heading"
          style={{ alignItems: "center", marginBottom: 15 }}
        >
          <h2 style={{ fontSize: 24 }}>Notification outbox</h2>
          <ActionButton path="notifications/dispatch" body={{}}>
            Process queued messages
          </ActionButton>
        </div>
        {notifications.length ? (
          notifications.map((n) => (
            <details className="outbox-item" key={n.id}>
              <summary>{n.subject}</summary>
              <p className="small" style={{ marginTop: 12 }}>
                {n.recipient} ·{" "}
                {new Date(n.created_at).toLocaleString("en-GB", {
                  timeZone: "Europe/London",
                })}
              </p>
              <span className="pill" style={{ marginTop: 8 }}>
                {label[n.status]}
              </span>
              {n.error && (
                <p className="notice error" style={{ marginTop: 12 }}>
                  {n.error}
                </p>
              )}
              <pre>{n.body}</pre>
              {n.provider_id && (
                <p className="small">Provider reference: {n.provider_id}</p>
              )}
            </details>
          ))
        ) : (
          <p className="small">No notifications have been created yet.</p>
        )}
      </section>
    </div>
  );
}
