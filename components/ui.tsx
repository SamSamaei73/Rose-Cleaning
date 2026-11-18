"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
export async function api<T = Record<string, unknown>>(
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(
      data.error || "Something went wrong. Please try again.",
    ) as Error & { details?: unknown };
    error.details = data.details;
    throw error;
  }
  return data;
}
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
  return (
    <div>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={async () => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          setBusy(true);
          setError("");
          setMessage("");
          try {
            const result = await api<{ redirect?: string; message?: string }>(
              path,
              body,
            );
            if (result.redirect) {
              // An identity change must discard prefetched account pages and
              // redirects that were rendered for the previous session.
              window.location.assign(result.redirect);
            } else {
              setMessage(result.message || "Saved.");
              if (refresh) router.refresh();
            }
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Please wait…" : children}
      </button>
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
