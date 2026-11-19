import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container section stack">
      <h1>We can’t find that page</h1>
      <p>
        The link may have changed, or this record is not available to your
        account.
      </p>
      <div>
        <Link className="btn" href="/">
          Back to Rose
        </Link>
      </div>
    </div>
  );
}
