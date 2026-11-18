import type { BookingDraft, Catalogue, Quote } from "./types";

export function calculateQuote(
  draft: BookingDraft,
  catalogue: Catalogue,
): Quote {
  const service = catalogue.services.find(
    (s) => s.id === draft.serviceId && s.kind === "service" && s.active,
  );
  if (!service)
    throw new Error(
      "This service is not currently offered. Please choose another.",
    );
  const extras = draft.extras.map((id) => {
    const extra = catalogue.services.find(
      (s) => s.id === id && s.kind === "extra" && s.active,
    );
    if (!extra)
      throw new Error("An extra has changed. Please review your selection.");
    return extra;
  });
  if (new Set(draft.extras).size !== draft.extras.length)
    throw new Error("Choose each extra once.");
  const { pricing } = catalogue;
  const rate = pricing.services[service.id];
  const priced =
    (pricing.demo || pricing.approved) &&
    rate &&
    extras.every((e) => pricing.extras[e.id]);
  const baseMinutes = priced
    ? rate.baseMinutes +
      draft.bedrooms * rate.bedroomMinutes +
      draft.bathrooms * rate.bathroomMinutes
    : service.duration_minutes;
  const durationMinutes =
    baseMinutes +
    extras.reduce(
      (sum, e) =>
        sum + (priced ? pricing.extras[e.id].minutes : e.duration_minutes),
      0,
    );
  const baseTotal = priced
    ? Math.max(
        rate.minimumPence,
        Math.ceil((baseMinutes * rate.hourlyPence) / 60),
      )
    : null;
  const lines: Quote["lines"] = [
    {
      label: service.name,
      quantity: priced ? baseMinutes / 60 : 1,
      unitPence: priced ? rate.hourlyPence : null,
      totalPence: baseTotal,
    },
    ...extras.map((e) => ({
      label: e.name,
      quantity: 1,
      unitPence: priced ? pricing.extras[e.id].pence : null,
      totalPence: priced ? pricing.extras[e.id].pence : null,
    })),
  ];
  if (priced)
    lines.push(
      ...pricing.adjustments.map((a) => ({
        label: a.label,
        quantity: 1,
        unitPence: a.pence,
        totalPence: a.pence,
      })),
    );
  const totalPence = priced
    ? lines.reduce((sum, l) => sum + (l.totalPence ?? 0), 0)
    : null;
  if (
    totalPence !== null &&
    (!Number.isSafeInteger(totalPence) ||
      totalPence < 0 ||
      totalPence > 10000000)
  )
    throw new Error("Please contact Rose for a tailored quotation.");
  if (durationMinutes > 720)
    throw new Error(
      "This property needs a tailored quotation. Please contact Rose.",
    );
  return {
    version: pricing.version,
    kind: !priced ? "unpriced" : pricing.demo ? "demo" : "approved",
    service: service.name,
    property: `${draft.bedrooms === 0 ? "Studio" : `${draft.bedrooms}-bedroom`} ${draft.propertyType} · ${draft.bathrooms} bathroom${draft.bathrooms === 1 ? "" : "s"}`,
    durationMinutes,
    teamSize: service.team_size,
    lines,
    totalPence,
    note: !priced ? "Price to be confirmed" : pricing.totalNote,
  };
}
export const money = (pence: number | null) =>
  pence === null
    ? "Price to be confirmed"
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: pence % 100 === 0 ? 0 : 2,
      }).format(pence / 100);
