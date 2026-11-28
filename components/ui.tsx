"use client";
import { useState, useTransition } from "react";
import { useRouter } from "./navigation-provider";
import type { ReactNode } from "react";
import { CleaningLoader } from "./cleaning-loader";
import { api } from "@/lib/client/api";
export { api } from "@/lib/client/api";
export function ActionButton({
  path,
  body,
  children,
  className = "btn secondary small",
  refresh = true,
  confirmMessage,
}: {
  path: string;
  body: unknown;
  children: ReactNode;
  className?: string;
  refresh?: boolean;
  confirmMessage?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  return (
    <div>
      <button
        type="button"
        className={className}
        disabled={busy || refreshing}
        aria-busy={busy || refreshing}
        onClick={async () => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          setBusy(true);
          setError("");
          setMessage("");
          let navigating = false;
          try {
            const result = await api<{ redirect?: string; message?: string }>(
              path,
              body,
            );
            if (result.redirect) {
              // An identity change must discard prefetched account pages and
              // redirects that were rendered for the previous session.
              window.location.assign(result.redirect);
              navigating = true;
            } else {
              setMessage(result.message || "Saved.");
              if (refresh) startRefresh(() => router.refresh());
            }
          } catch (e) {
            setError((e as Error).message);
          } finally {
            if (!navigating) setBusy(false);
          }
        }}
      >
        {busy ? "Please wait…" : children}
      </button>
      <CleaningLoader
        active={busy || refreshing}
        label="Taking care of your request…"
      />
      {error && (
        <p
          role="alert"
          className="small"
          style={{ color: "#A12F46", marginTop: 8 }}
        >
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="small" style={{ marginTop: 8 }}>
          {message}
        </p>
      )}
    </div>
  );
}
export function Message({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
    </>
  );
}
