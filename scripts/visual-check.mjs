import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
const origin = process.argv[2] || "http://localhost:3005";
const browser = await chromium.launch({
  channel: existsSync(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  )
    ? "chrome"
    : undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await mkdir(".local/qa", { recursive: true });
await page.goto(origin, { waitUntil: "networkidle" });
if (!(await page.getByText("DEMO PREVIEW", { exact: true }).isVisible())) {
  await browser.close();
  throw new Error(
    "Visual fixtures require an explicitly enabled local demo server.",
  );
}
await page.screenshot({ path: ".local/qa/home-desktop.png", fullPage: true });
await page.setViewportSize({ width: 375, height: 812 });
await page.screenshot({ path: ".local/qa/home-mobile.png", fullPage: true });
await page.goto(`${origin}/book`, { waitUntil: "networkidle" });
await page.getByLabel("Property postcode").fill("SW1A 1AA");
await page.getByRole("button", { name: "Continue", exact: true }).click();
await page
  .getByLabel("Full property address", { exact: true })
  .fill("14 Fictional Test Lane, London");
await page.getByRole("button", { name: "Continue", exact: true }).click();
await page.getByRole("button", { name: "Continue", exact: true }).click();
await page.locator(".calendar").scrollIntoViewIfNeeded();
await page.screenshot({
  path: ".local/qa/calendar-mobile.png",
  fullPage: true,
});
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
);
const post = async (path, data) => {
  const response = await page.request.post(`${origin}/api/${path}`, {
    headers: { Origin: origin },
    data,
  });
  if (!response.ok())
    throw new Error(`Demo fixture ${path}: ${response.status()}`);
  return response.json();
};
await post("demo", { role: "customer" });
const day = new Date(Date.now() + 7 * 86400000);
if (day.getUTCDay() === 0) day.setUTCDate(day.getUTCDate() + 1);
const draft = {
  postcode: "SW1A 1AA",
  serviceId: "deep",
  propertyType: "flat",
  bedrooms: 2,
  bathrooms: 1,
  address: "Apartment 18, Fictional Test Building, 123 Example Road, London",
  extras: ["oven"],
  date: day.toISOString().slice(0, 10),
  windowId: "morning",
  notes: "Fictional visual-review request. Please focus on the kitchen.",
  pets: "One fictional cat",
  access: "Street parking; please discuss arrangements.",
};
const { quoteToken } = await post("estimate", draft);
const { booking } = await post("bookings", {
  draft,
  quoteToken,
  idempotencyKey: crypto.randomUUID(),
  policyVersion: null,
  acknowledged: true,
});
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(`${origin}/dashboard/bookings/${booking.id}`, {
  waitUntil: "networkidle",
});
await page.screenshot({
  path: ".local/qa/customer-request.png",
  fullPage: true,
});
await post("demo", { role: "staff" });
await page.goto(`${origin}/staff/bookings/${booking.id}`, {
  waitUntil: "networkidle",
});
await page.screenshot({ path: ".local/qa/staff-request.png", fullPage: true });
await page.setViewportSize({ width: 375, height: 812 });
await page.screenshot({
  path: ".local/qa/staff-request-mobile.png",
  fullPage: true,
});
const staffOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth,
);
await page.goto(origin, { waitUntil: "networkidle" });
await page.keyboard.press("Tab");
const keyboardSkip = await page
  .getByRole("link", { name: "Skip to content" })
  .evaluate((element) => element === document.activeElement);
await browser.close();
console.log(
  JSON.stringify({
    screenshots: ".local/qa",
    errors,
    calendarOverflow: overflow,
    staffOverflow,
    keyboardSkip,
  }),
);
if (errors.length || overflow || staffOverflow || !keyboardSkip)
  process.exitCode = 1;
