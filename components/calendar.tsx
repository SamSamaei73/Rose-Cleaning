"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { londonDate } from "@/lib/scheduling";
import type { Availability } from "@/lib/types";
export function Calendar({
  value,
  onChange,
  settings,
}: {
  value: string;
  onChange: (value: string) => void;
  settings: Availability;
}) {
  const [now] = useState(() => new Date());
  const today = londonDate(now);
  const [month, setMonth] = useState((value || today).slice(0, 7));
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const last = londonDate(
    new Date(now.getTime() + settings.horizonDays * 86400000),
  );
  const shift = (delta: number) =>
    setMonth(
      new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7),
    );
  return (
    <div className="calendar">
      <div className="calendar-head">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => shift(-1)}
          disabled={month <= today.slice(0, 7)}
        >
          <ChevronLeft size={17} />
        </button>
        <span aria-live="polite">
          {new Intl.DateTimeFormat("en-GB", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(first)}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shift(1)}
          disabled={month >= last.slice(0, 7)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
      <div className="calendar-grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span className="day-name" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const date = `${month}-${String(i + 1).padStart(2, "0")}`;
          const unavailable =
            date < today ||
            date > last ||
            (settings.configured &&
              (!settings.workingDays.includes(
                new Date(`${date}T12:00:00Z`).getUTCDay(),
              ) ||
                settings.blackoutDates.includes(date)));
          return (
            <button
              key={date}
              type="button"
              className={`calendar-day ${date === value ? "selected" : ""}`}
              aria-label={date}
              aria-pressed={date === value}
              disabled={unavailable}
              onClick={() => onChange(date)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <p className="small" style={{ marginTop: 15 }}>
        Times shown in Europe/London.{" "}
        {settings.configured
          ? "Full windows are disabled after selecting a date."
          : "Choose a preference; Rose will confirm the time."}
      </p>
    </div>
  );
}
