import type { Availability, Booking, Quote } from "./types";
export const londonDate = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
export function londonInstant(date: string, time: string): number {
  const naive = Date.parse(`${date}T${time}:00Z`);
  const londonHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(naive)),
  );
  const offset = (londonHour - Number(time.slice(0, 2)) + 24) % 24;
  return naive - offset * 3600000;
}
export function reservationRange(
  date: string,
  windowId: string,
  quote: Quote,
  settings: Availability,
): [number, number] {
  const window = settings.windows.find((w) => w.id === windowId);
  if (!window) throw new Error("Please choose an arrival window.");
  return [
    londonInstant(date, window.start),
    londonInstant(date, window.end) + quote.durationMinutes * 60000,
  ];
}
export function slotReason(
  date: string,
  windowId: string,
  quote: Quote,
  settings: Availability,
  bookings: Booking[] = [],
  excludeId?: string,
  now = new Date(),
): string | null {
  if (date < londonDate(now)) return "Choose today or a future date.";
  if (
    date > londonDate(new Date(now.getTime() + settings.horizonDays * 86400000))
  )
    return "That date is outside the request calendar.";
  const [start, end] = reservationRange(date, windowId, quote, settings);
  if (!settings.configured)
    return date === londonDate(now) && start < now.getTime()
      ? "That preferred window has passed."
      : null;
  if (
    !settings.workingDays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()) ||
    settings.blackoutDates.includes(date)
  )
    return "Rose is not taking visits on this date.";
  if (start < now.getTime() + settings.leadHours * 3600000)
    return "This window is inside the required notice period.";
  const ranges = bookings
    .filter((b) => b.id !== excludeId && b.reserved_start && b.reserved_end)
    .map((b) => ({
      range: [Date.parse(b.reserved_start!), Date.parse(b.reserved_end!)],
      units: b.quote.teamSize,
    }));
  // Sweep all endpoints: counting every overlap together would incorrectly block non-overlapping visits.
  const points: [number, number][] = [
    [start, quote.teamSize],
    [end, -quote.teamSize],
  ];
  for (const {
    range: [a, b],
    units,
  } of ranges)
    if (a < end && b > start)
      points.push([Math.max(start, a), units], [Math.min(end, b), -units]);
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let used = 0;
  for (const [, delta] of points) {
    used += delta;
    if (used > settings.capacity)
      return "This window is full. Please choose another.";
  }
  return null;
}
export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(`${value}T12:00:00Z`));
