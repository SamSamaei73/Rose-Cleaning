"use client";
import Link from "@/components/app-link";
import { useState } from "react";
import type { Booking, Service } from "@/lib/types";
import { statusLabels } from "@/lib/status";
import { dateLabel } from "@/lib/scheduling";
import { money } from "@/lib/pricing";
import { Status } from "./booking-list";
export function StaffBookings({
  bookings,
  services,
}: {
  bookings: Booking[];
  services: Service[];
}) {
  const [status, setStatus] = useState(""),
    [service, setService] = useState(""),
    [date, setDate] = useState("");
  const filtered = bookings.filter(
    (b) =>
      (!status || b.status === status) &&
      (!service || b.draft.serviceId === service) &&
      (!date || b.draft.date === date),
  );
  return (
    <>
      <div className="filter-bar">
        <div className="field">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-service">Service</label>
          <select
            id="filter-service"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            <option value="">All services</option>
            {services
              .filter((s) => s.kind === "service")
              .map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-date">Requested date</label>
          <input
            id="filter-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button
          className="btn secondary small"
          style={{ alignSelf: "end" }}
          onClick={() => {
            setStatus("");
            setService("");
            setDate("");
          }}
        >
          Clear filters
        </button>
      </div>
      <p className="small" style={{ marginBottom: 14 }}>
        {filtered.length} request{filtered.length === 1 ? "" : "s"}
      </p>
      {filtered.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer & request</th>
                <th>Requested visit</th>
                <th>Service</th>
                <th>Status</th>
                <th>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link className="btn secondary small" href={`/staff/bookings/${b.id}`}>
                      {b.customer_name}
                    </Link>
                    <small>
                      {b.id.slice(0, 8)} · {b.draft.postcode}
                    </small>
                  </td>
                  <td>
                    {dateLabel(b.draft.date)}
                    <small>{b.draft.windowId}</small>
                  </td>
                  <td>
                    {b.quote.service}
                    <small>{b.quote.property}</small>
                  </td>
                  <td>
                    <Status status={b.status} />
                  </td>
                  <td>
                    {money(b.quote.totalPence)}
                    <small>
                      {b.quote.kind === "demo"
                        ? "Demo estimate"
                        : b.quote.kind === "approved"
                          ? "Approved quote"
                          : "Unpriced"}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <h3>No requests match these filters</h3>
          <p>
            New requests will appear here after a customer submits their clean.
          </p>
        </div>
      )}
    </>
  );
}
