"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./brand";
import { api, ActionButton, Message } from "./ui";
export type AuthKind = "login" | "signup" | "forgot" | "reset";
const copy = {
  login: {
    title: "Log in to Rose",
    subtitle: null,
    button: "Log in",
  },
  signup: {
    title: "Create your account",
    subtitle: "Registration is free; cleaning services are paid.",
    button: "Create account",
  },
  forgot: {
    title: "Reset your password",
    subtitle: "Enter your email to request a reset link.",
    button: "Request reset link",
  },
  reset: {
    title: "Choose a new password",
    subtitle: "Use at least 12 characters.",
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
  const [error, setError] = useState(initialError || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [magic, setMagic] = useState(false);
  const [email, setEmail] = useState("");
  const [verification, setVerification] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const c = copy[kind];
  const unavailable = demo || !configured;
  return (
    <div className="auth-layout">
      <div className="auth-form-wrap">
        <div className="auth-brand">
          <Brand compact />
        </div>
        <h1>{c.title}</h1>
        {c.subtitle && <p className="auth-subtitle">{c.subtitle}</p>}
        {demo && (
          <div className="notice auth-notice">
            Demo preview · Explore a fictional account below. Real sign-in
            fields are disabled.
          </div>
        )}
        {!demo && !configured && (
          <div className="notice auth-notice">
            Sign-in needs backend configuration.{" "}
            <Link className="text-link" href="/setup">
              View setup instructions
            </Link>
          </div>
        )}
        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            if (unavailable || busy) return;
            setBusy(true);
            setError("");
            setMessage("");
            const form = new FormData(event.currentTarget);
            try {
              const result = await api<{
                redirect?: string;
                message?: string;
                verification?: boolean;
              }>("auth", {
                action: magic ? "magic" : kind,
                email: form.get("email") || undefined,
                password: form.get("password") || undefined,
                name: form.get("name") || undefined,
                next,
              });
              if (result.redirect) window.location.assign(result.redirect);
              else {
                setMessage(result.message || "Your request was received.");
                if (result.verification) {
                  setVerification(true);
                  setCooldown(60);
                }
              }
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Message error={error} message={message} />
          <fieldset
            className="stack"
            disabled={unavailable || busy || verification}
          >
            <legend className="sr-only">
              {kind === "signup" ? "Account registration" : "Account access"}
            </legend>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
          </fieldset>
          {kind === "login" && (
            <Link href="/forgot-password" className="text-link auth-recovery">
              Forgotten your password?
            </Link>
          )}
          {kind === "signup" && (
            <p className="small">
              Registration is free; cleaning services are paid. Our{" "}
              <Link href="/terms" className="text-link">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-link">
                privacy notice
              </Link>{" "}
              remain drafts awaiting approval.
            </p>
          )}
          {demo ? (
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
                : "Explore the customer demo"}
            </ActionButton>
          ) : (
            <button
              className="btn"
              disabled={busy || !configured || verification}
            >
              {busy
                ? "Please wait…"
                : magic
                  ? "Email a sign-in link"
                  : c.button}
            </button>
          )}
          {kind === "login" && !unavailable && (
            <button
              className="auth-magic"
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
        {!unavailable && (kind === "signup" || kind === "login") && (
          <div className="verification-help stack">
            {verification && (
              <p role="status">
                Check <strong>{email}</strong> for a verification link. Open it
                to activate your account.
              </p>
            )}
            <button
              type="button"
              className="text-link"
              disabled={busy || cooldown > 0 || !email}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await api<{ message: string }>("auth", {
                    action: "resend",
                    email,
                  });
                  setMessage(result.message);
                  setCooldown(60);
                } catch (e) {
                  setError((e as Error).message);
                  setCooldown(60);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {cooldown > 0
                ? `Resend available in ${cooldown}s`
                : "Resend verification email"}
            </button>
            {verification && (
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setVerification(false);
                  setMessage("");
                }}
              >
                Use a different email
              </button>
            )}
          </div>
        )}
        <div className="auth-bottom">
          {kind === "login" ? (
            <>
              New to Rose?{" "}
              <Link
                href={`/signup?next=${encodeURIComponent(next)}`}
                className="text-link"
              >
                Create account
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
        {demo && (
          <p className="auth-footnote">
            Temporary demo data. No messages or payments. Your request draft
            stays in this browser tab.
          </p>
        )}
      </div>
    </div>
  );
}
