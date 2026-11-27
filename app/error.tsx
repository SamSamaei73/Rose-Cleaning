"use client";
import Link from "@/components/app-link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container section stack">
      <h1 style={{ fontSize: 36 }}>We couldn’t load this page</h1>
      <p>
        Your information has not been replaced with demo data. Please try again,
        or check the backend configuration if you are setting up Rose.
      </p>
      <div>
        <button className="btn" onClick={reset}>
          Try again
        </button>
      </div>
      <Link className="btn secondary small action-link" href="/setup">
        Setup instructions
      </Link>
    </div>
  );
}
