"use client";
import { CleaningLoader } from "./cleaning-loader";
import Link from "@/components/app-link";
import { useEffect, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { Brand } from "./brand";
import { CleaningCompanion } from "./cleaning-companion";
import styles from "./auth-experience.module.css";
import { api, ActionButton, Message } from "./ui";
export type AuthKind = "login" | "signup" | "forgot" | "reset";
const copy = {
  login: {
    title: "Log in",
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
  const [googleBusy, setGoogleBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmationTouched, setConfirmationTouched] = useState(false);
  const [verification, setVerification] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const c = copy[kind];
  const isEntry = kind === "login" || kind === "signup";
  const unavailable = demo || !configured;
  const passwordError =
    kind === "signup" && passwordTouched && password.length < 12
      ? "Use at least 12 characters for your password."
      : "";
  const confirmationError =
    kind === "signup" && confirmationTouched
      ? !confirmPassword
        ? "Please re-enter your password."
        : password !== confirmPassword
          ? "Passwords do not match. Please try again."
          : ""
      : "";
  return (
    <div className={`${styles.layout}${isEntry ? "" : ` ${styles.compact}`}`}>
      <div className={styles.stage}>
        {isEntry && (
          <div className={styles.welcome}>
            <span className="eyebrow">A little more time for you</span>
            <h2>
              A fresh space
              <br /> <span>A clearer day</span>
            </h2>
            <p>
              Manage your cleaning, share the details and leave the rest with
              Rose.
            </p>
            <div className={styles.benefits}>
              <span>
                <CalendarDays size={18} aria-hidden="true" /> Your clean,
                organised
              </span>
              <span>
                <Sparkles size={18} aria-hidden="true" /> Care in every detail
              </span>
            </div>
          </div>
        )}
        <div className={`auth-form-wrap ${styles.form}`}>
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
              <Link className="btn secondary small action-link" href="/setup">
                View setup instructions
              </Link>
            </div>
          )}
          <form
            className="stack"
            onSubmit={async (event) => {
              event.preventDefault();
              if (unavailable || busy || verification) return;
              setError("");
              setMessage("");
              const form = new FormData(event.currentTarget);
              if (kind === "signup") {
                const enteredPassword = String(form.get("password") || "");
                const repeatedPassword = String(
                  form.get("confirmPassword") || "",
                );
                setPassword(enteredPassword);
                setConfirmPassword(repeatedPassword);
                setPasswordTouched(true);
                setConfirmationTouched(true);
                if (
                  enteredPassword.length < 12 ||
                  enteredPassword !== repeatedPassword
                ) {
                  const field = event.currentTarget.elements.namedItem(
                    enteredPassword.length < 12
                      ? "password"
                      : "confirmPassword",
                  );
                  if (field instanceof HTMLInputElement) field.focus();
                  return;
                }
              }
              setBusy(true);
              let navigating = false;
              try {
                const result = await api<{
                  redirect?: string;
                  message?: string;
                  verification?: boolean;
                }>("auth", {
                  action: kind,
                  email: form.get("email") || undefined,
                  password: form.get("password") || undefined,
                  name: form.get("name") || undefined,
                  next,
                });
                if (result.redirect) {
                  window.location.assign(result.redirect);
                  navigating = true;
                } else {
                  setMessage(result.message || "Your request was received.");
                  if (result.verification) {
                    setVerification(true);
                    setCooldown(60);
                  }
                }
              } catch (e) {
                setError((e as Error).message);
              } finally {
                if (!navigating) setBusy(false);
              }
            }}
          >
            <Message error={error} message={message} />
            <CleaningLoader active={busy} label="Preparing your account…" />
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
              {kind !== "forgot" && (
                <div className="field">
                  <label htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    onInvalid={() => setPasswordTouched(true)}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={
                      passwordError
                        ? "auth-password-error"
                        : kind !== "login"
                          ? "auth-password-hint"
                          : undefined
                    }
                    autoComplete={
                      kind === "login" ? "current-password" : "new-password"
                    }
                    minLength={kind === "login" ? 1 : 12}
                    maxLength={200}
                    required
                  />
                  {passwordError ? (
                    <small
                      id="auth-password-error"
                      className="auth-field-error"
                      role="alert"
                    >
                      {passwordError}
                    </small>
                  ) : kind !== "login" ? (
                    <small id="auth-password-hint">
                      At least 12 characters.
                    </small>
                  ) : null}
                </div>
              )}
              {kind === "signup" && (
                <div className="field">
                  <label htmlFor="auth-confirm-password">Repeat password</label>
                  <input
                    id="auth-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onBlur={() => setConfirmationTouched(true)}
                    onInvalid={() => setConfirmationTouched(true)}
                    aria-invalid={Boolean(confirmationError)}
                    aria-describedby={
                      confirmationError
                        ? "auth-confirm-password-error"
                        : undefined
                    }
                    maxLength={200}
                    required
                  />
                  {confirmationError && (
                    <small
                      id="auth-confirm-password-error"
                      className="auth-field-error"
                      role="alert"
                    >
                      {confirmationError}
                    </small>
                  )}
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
                <Link
                  href="/terms"
                  className="btn secondary small action-link inline-action"
                >
                  terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="btn secondary small action-link inline-action"
                >
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
                {busy && !googleBusy ? "Please wait…" : c.button}
              </button>
            )}
            {(kind === "login" || kind === "signup") && (
              <>
                <div className="auth-divider">
                  <span>or</span>
                </div>
                <button
                  type="button"
                  className="btn secondary auth-google"
                  disabled={unavailable || busy || verification}
                  onClick={async () => {
                    if (unavailable || busy || verification) return;
                    setBusy(true);
                    setGoogleBusy(true);
                    setError("");
                    setMessage("");
                    let navigating = false;
                    try {
                      const result = await api<{ redirect: string }>("auth", {
                        action: "google",
                        intent: kind,
                        next,
                      });
                      window.location.assign(result.redirect);
                      navigating = true;
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      if (!navigating) {
                        setBusy(false);
                        setGoogleBusy(false);
                      }
                    }
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 22c2.7 0 4.96-.9 6.61-2.41l-3.24-2.51c-.9.6-2.04.96-3.37.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.4 13.92a6.01 6.01 0 0 1 0-3.84V7.49H3.05a10 10 0 0 0 0 9.02l3.35-2.59Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.96c1.47 0 2.79.5 3.82 1.49l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59C7.19 7.72 9.4 5.96 12 5.96Z"
                    />
                  </svg>
                  {googleBusy
                    ? "Connecting to Google…"
                    : kind === "signup"
                      ? "Create account with Google"
                      : "Log in with Google"}
                </button>
              </>
            )}
          </form>
          {!unavailable && kind === "signup" && verification && (
            <div className="verification-help stack">
              {verification && (
                <p role="status">
                  Check <strong>{email}</strong> for a verification link. Open
                  it to activate your account.
                </p>
              )}
              <button
                type="button"
                className="btn secondary small action-link"
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
                  className="btn secondary small action-link"
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
                  className="text-link auth-create-account"
                >
                  Create account
                </Link>
              </>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="btn secondary small action-link"
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
        {isEntry && <CleaningCompanion />}
      </div>
    </div>
  );
}
