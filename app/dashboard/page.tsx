import Link from "@/components/app-link";
import {
  ArrowRight,
  CalendarDays,
  CheckCheck,
  Clock3,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import { requirePageSession } from "@/lib/server/auth";
import {
  getAddresses,
  getCatalogue,
  listBookings,
} from "@/lib/server/repository";
import { dateLabel } from "@/lib/scheduling";
import { Status } from "@/components/booking-list";
import { isDemo } from "@/lib/server/config";
export const metadata = { title: "Your dashboard" };
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const session = await requirePageSession();
  const [all, addresses, catalogue, params] = await Promise.all([
    listBookings(session),
    getAddresses(session),
    getCatalogue(),
    searchParams,
  ]);
  const own = all.filter((b) => b.customer_id === session.user.id);
  const now = new Date().getTime();
  const upcoming = own
    .filter(
      (b) =>
        b.status === "confirmed" &&
        b.reserved_start &&
        Date.parse(b.reserved_start) >= now,
    )
    .sort((a, b) => a.reserved_start!.localeCompare(b.reserved_start!))[0];
  const requestBase = isDemo() ? "/dashboard/book" : "/dashboard/requests/new";
  const requestHref = params.service
    ? `${requestBase}?service=${encodeURIComponent(params.service)}`
    : requestBase;
  const selectedService = catalogue.services.find((service) => service.id === params.service);
  const timeLabel = (id: string) =>
    id === "flexible"
      ? "Flexible time"
      : catalogue.availability.windows.find((w) => w.id === id)?.label || id;
  const summaries = [
    {
      label: "Awaiting Rose",
      value: own.filter((b) =>
        ["pending", "pending_confirmation", "alternative_proposed"].includes(
          b.status,
        ),
      ).length,
      icon: Clock3,
    },
    {
      label: "Confirmed",
      value: own.filter((b) => b.status === "confirmed").length,
      icon: CalendarDays,
    },
    {
      label: "Completed",
      value: own.filter((b) => b.status === "completed").length,
      icon: CheckCheck,
    },
  ];
  return (
    <div className="customer-overview">
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Your Rose account</span>
          <h1>
            Hello, {session.user.full_name.trim().split(/\s+/)[0] || "there"}
          </h1>
          <p>A little less to do. A little more time for you.</p>
          {selectedService && <p>Selected service: {selectedService.name}</p>}
        </div>
        <Link href={requestHref} className="btn">
          <Plus size={18} />
          Request a clean
        </Link>
      </div>
      <div className="request-stats" aria-label="Your request summary">
        {summaries.map(({ label, value, icon: Icon }) => (
          <div className="request-stat" key={label}>
            <span className="stat-icon">
              <Icon size={20} strokeWidth={1.5} />
            </span>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <section
          className="dashboard-card recent-requests"
          aria-labelledby="recent-title"
        >
          <div className="dashboard-card-heading">
            <div>
              <span className="eyebrow">All in one place</span>
              <h2 id="recent-title">Recent requests</h2>
            </div>
            {own.length > 0 && (
              <Link className="btn secondary small action-link" href="/dashboard/requests">
                View all <ArrowRight size={15} />
              </Link>
            )}
          </div>
          {own.length ? (
            <div className="recent-request-list">
              {own.slice(0, 4).map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/requests/${b.id}`}
                  className="recent-request"
                >
                  <span className="request-row-icon">
                    <CalendarDays size={20} strokeWidth={1.4} />
                  </span>
                  <div className="request-row-copy">
                    <h3>{b.quote.service}</h3>
                    <p>
                      {dateLabel(b.draft.date)} · {timeLabel(b.draft.windowId)}
                    </p>
                    <small>
                      {b.status === "confirmed"
                        ? "Confirmed visit"
                        : "Preferred date"}{" "}
                      · {b.draft.postcode}
                    </small>
                  </div>
                  <div className="request-row-end">
                    <Status status={b.status} />
                    <ArrowRight size={17} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              <span className="empty-emblem">
                <Sparkles size={32} strokeWidth={1.2} />
              </span>
              <h3>Your first fresh start awaits</h3>
              <p>
                Tell us what needs a little care.
                <br />
                Rose will review your request and confirm the details with you.
              </p>
              <Link href={requestHref} className="btn secondary">
                Request your first clean <ArrowRight size={16} />
              </Link>
            </div>
          )}
          <div className="dashboard-card-foot">
            <Clock3 size={15} />
            <p>A request becomes a booking once Rose confirms it.</p>
          </div>
        </section>
        <div className="dashboard-sidecards">
          {upcoming && (
            <section className="dashboard-card upcoming-card">
              <span className="eyebrow">In the diary</span>
              <h2>Your next visit</h2>
              <Status status="confirmed" />
              <strong className="upcoming-date">
                {dateLabel(upcoming.draft.date)}
              </strong>
              <p>
                {upcoming.quote.service}
                <br />
                {timeLabel(upcoming.draft.windowId)}
              </p>
              <Link
                className="btn secondary small action-link"
                href={`/dashboard/requests/${upcoming.id}`}
              >
                View visit <ArrowRight size={15} />
              </Link>
            </section>
          )}
          <section className="dashboard-card profile-card">
            <span className="profile-icon">
              <MapPin size={22} strokeWidth={1.4} />
            </span>
            <h2>Make yourself at home</h2>
            <p>
              {addresses.length
                ? "Your saved address is ready for your next request."
                : "Save your address to make your next request a little quicker."}
            </p>
            {addresses[0] && (
              <div className="saved-address">
                <strong>{addresses[0].label}</strong>
                <span>{addresses[0].address}</span>
                <span>{addresses[0].postcode}</span>
              </div>
            )}
            <Link className="btn secondary small action-link" href="/dashboard/profile">
              Profile & address <ArrowRight size={15} />
            </Link>
          </section>
          <div className="dashboard-contact">
            <p>A question before you request?</p>
            <Link href="/contact" className="btn secondary small action-link">
              Talk to Rose <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
