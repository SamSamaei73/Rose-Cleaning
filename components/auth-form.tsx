"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, LockKeyhole, Sparkles } from "lucide-react";
import { api, ActionButton, Message } from "./ui";
export type AuthKind = "login" | "signup" | "forgot" | "reset";
const copy = {
  login: {
    title: "Welcome back.",
    subtitle: "A fresh start is just a sign-in away.",
    button: "Log in",
  },
  signup: {
    title: "Make yourself at home.",
    subtitle: "Create your free Rose account.",
    button: "Create account",
  },
  forgot: {
    title: "Forgot your password?",
    subtitle: "We’ll help you get back into your account.",
    button: "Request reset link",
  },
  reset: {
    title: "Choose a new password.",
    subtitle: "Use at least 12 characters to keep your account secure.",
    button: "Update password",
  },
};
export function AuthForm({
  kind,
  demo,
  configured,
  next,
  error: initialError,
}: {
  kind: AuthKind;
  demo: boolean;
  configured: boolean;
  next: string;
  error?: string;
}) {
  const [error, setError] = useState(initialError || ""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [magic, setMagic] = useState(false);
  const c = copy[kind];
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <span className="eyebrow">Your home, in good hands</span>
        <h2>
          A little less to do.
          <br />
          <span className="serif" style={{ color: "var(--rose)" }}>
            A little more you.
          </span>
        </h2>
        <p>
          Request your clean, keep track of the details and stay in touch with
          Rose. All in one place.
        </p>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: 30,
            fontSize: 12,
            color: "var(--berry)",
          }}
        >
          <Sparkles size={18} /> Free to register. Cleaning services are paid.
        </div>
      </div>
      <div className="auth-form-wrap">
        <h1>{c.title}</h1>
        <p>{c.subtitle}</p>
        {demo ? (
          <div className="stack" style={{ marginTop: 28 }}>
            <div className="notice">
              <strong>This is a demonstration.</strong>
              <br />
              Explore as Jamie Morgan, a fictional customer. No real password or
              email is needed. This is an isolated demo session, not production
              authentication.
            </div>
            <ActionButton
              path="demo"
              body={{
                role: next.startsWith("/staff") ? "staff" : "customer",
                next,
              }}
              className="btn"
            >
              {next.startsWith("/staff")
                ? "Explore the staff demo"
                : "Explore the customer demo"}{" "}
              <ArrowUpRight size={17} />
            </ActionButton>
            <p className="small">
              Demo state is temporary on this server and expires after 24 hours
              or a restart. Your booking draft stays in this browser tab until
              submitted or cleared.
            </p>
          </div>
        ) : !configured ? (
          <div className="stack" style={{ marginTop: 25 }}>
            <div className="notice">
              Account access requires Supabase configuration. No demonstration
              sign-in is active in connected mode.
            </div>
            <Link href="/setup" className="btn">
              View setup instructions
            </Link>
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              setMessage("");
              const form = new FormData(e.currentTarget);
              try {
                const result = await api<{
                  message?: string;
                  redirect?: string;
                }>("auth", {
                  action: magic ? "magic" : kind,
                  email: form.get("email") || undefined,
                  password: form.get("password") || undefined,
                  name: form.get("name") || undefined,
                  next,
                });
                if (result.redirect) {
                  window.location.assign(result.redirect);
                } else
                  setMessage(result.message || "Your request was received.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Message error={error} message={message} />
            {kind === "signup" && (
              <div className="field">
                <label htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>
            )}
            {kind !== "reset" && (
              <div className="field">
                <label htmlFor="auth-email">Email address</label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </div>
            )}
            {kind !== "forgot" && !magic && (
              <div className="field">
                <label htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete={
                    kind === "login" ? "current-password" : "new-password"
                  }
                  minLength={kind === "login" ? 1 : 12}
                  maxLength={200}
                  required
                />
                {kind !== "login" && <small>At least 12 characters.</small>}
              </div>
            )}
            {kind === "login" && (
              <Link href="/forgot-password" className="text-link">
                Forgotten your password?
              </Link>
            )}
            {kind === "signup" && (
              <p className="small">
                Registration is free. The{" "}
                <Link href="/terms" className="text-link">
                  terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-link">
                  privacy notice
                </Link>{" "}
                are drafts awaiting approval.
              </p>
            )}
            <button className="btn" disabled={busy}>
              {busy
                ? "Please wait…"
                : magic
                  ? "Email a sign-in link"
                  : c.button}
              <ArrowUpRight size={16} />
            </button>
            {kind === "login" && (
              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  setMagic(!magic);
                  setError("");
                  setMessage("");
                }}
              >
                {magic ? "Use my password instead" : "Email me a sign-in link"}
              </button>
            )}
          </form>
        )}
        <div className="auth-bottom">
          {kind === "login" ? (
            <>
              New to Rose?{" "}
              <Link
                href={`/signup?next=${encodeURIComponent(next)}`}
                className="text-link"
              >
                Create an account
              </Link>
            </>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="text-link"
            >
              Back to log in
            </Link>
          )}
        </div>
        <p
          className="small"
          style={{
            marginTop: 25,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <LockKeyhole size={14} /> Your details are kept in your own account.
        </p>
      </div>
    </div>
  );
}
