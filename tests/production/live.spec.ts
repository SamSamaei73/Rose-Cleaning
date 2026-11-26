import { test, expect, type Page } from "@playwright/test";
import { serviceCatalogue, serviceCategories } from "../../lib/service-catalogue";

const publicRoutes = ["/", "/about", "/services", "/contact", "/office-quote", "/book", "/login", "/signup", "/forgot-password", "/terms", "/privacy", "/cancellation"];

async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
}

test("01 production release identity and database readiness", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  const data = await health.json();
  expect(data.status).toBe("ok");
  if (process.env.ROSE_EXPECTED_SHA) expect(data.revision).toBe(process.env.ROSE_EXPECTED_SHA);
  const ready = await request.get("/api/ready");
  expect(ready.status()).toBe(200);
  expect((await ready.json()).status).toBe("ready");
});

test("02 HTTPS and canonical redirects", async ({ request }) => {
  for (const url of ["http://rosecleaning.uk/about", "http://www.rosecleaning.uk/about", "https://www.rosecleaning.uk/about"]) {
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(response.url()).toBe("https://rosecleaning.uk/about");
  }
});

test("03 homepage account entry preserves the destination", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Clean spaces Better every day" })).toBeVisible();
  await expect(page.locator(".header-login")).toHaveAttribute("href", "/login?next=%2Fdashboard");
  await page.locator(".hero").getByRole("link", { name: "Request Cleaning", exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: "Log in to Rose" })).toBeVisible();
});

test("04 public navigation and About content", async ({ page }) => {
  await page.goto("/");
  for (const name of ["About", "Services", "Contact", "Home"]) {
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name, exact: true }).click();
    await expect(page.locator("h1")).toBeVisible();
    if (name === "About") {
      await expect(page.getByRole("heading", { name: "Elevating the Art of Cleaning" })).toBeVisible();
      await expect(page.locator(".cinematic, .pin-spacer")).toHaveCount(0);
    }
  }
});

test("05 all service collections retain destinations and photographs", async ({ page }) => {
  await page.goto("/services");
  const explorer = page.locator(".service-explorer");
  for (const category of serviceCategories) {
    await page.getByRole("navigation", { name: "Service categories" }).getByRole("button", { name: category.name, exact: true }).click();
    for (const service of serviceCatalogue.filter(s => s.category === category.id)) {
      await explorer.getByRole("button", { name: new RegExp(service.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
      await page.mouse.move(0, 0);
      await expect(explorer.getByRole("link", { name: `Request: ${service.name}`, exact: true })).toHaveAttribute("href", `/login?next=${encodeURIComponent(`/dashboard?service=${service.id}`)}`);
      const photo = explorer.getByRole("img", { name: service.alt, exact: true });
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBeTruthy();
    }
  }
});

test("06 contact and office quote forms validate without sending", async ({ page }) => {
  for (const path of ["/contact", "/office-quote"]) {
    await page.goto(path);
    const form = page.locator("form").first();
    await expect(form).toBeVisible();
    expect(await form.evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
    await expect(form.getByLabel("Email address", { exact: true })).toBeVisible();
  }
});

test("07 public assets load with no application errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", response => {
    if (new URL(response.url()).origin === "https://rosecleaning.uk" && response.status() >= 400)
      errors.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  page.on("requestfailed", request => {
    if (request.url().startsWith("https://rosecleaning.uk/") && request.failure()?.errorText !== "net::ERR_ABORTED") errors.push(new URL(request.url()).pathname);
  });
  for (const path of ["/", "/about", "/services", "/contact"]) {
    await page.goto(path);
    for (const img of await page.locator("img").all()) {
      if (!(await img.isVisible())) continue;
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBeTruthy();
    }
  }
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768]) {
  test(`${width === 320 ? "08" : width === 390 ? "09" : "10"} public pages fit ${width}px screens`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of publicRoutes) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await fits(page);
      const sizes = await page.locator('input:not([type="checkbox"]):not([type="radio"]), select, textarea').evaluateAll(elements => elements.filter(e => e.getBoundingClientRect().width > 10).map(e => parseFloat(getComputedStyle(e).fontSize)));
      expect(sizes.every(size => size >= 16)).toBeTruthy();
    }
    if (width === 390) {
      await page.goto("/");
      await page.screenshot({ path: "test-results/production/mobile-home.png", fullPage: true });
    }
  });
}

test("11 mobile navigation traps focus and closes on navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByLabel("Open navigation").click();
  const dialog = page.getByRole("dialog", { name: "Rose navigation" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(e => e.contains(document.activeElement))).toBeTruthy();
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByLabel("Open navigation")).toBeFocused();
  await page.getByLabel("Open navigation").click();
  await dialog.getByRole("link", { name: "Services", exact: true }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(dialog).toBeHidden();
  await fits(page);
});

test("12 desktop animation and reduced-motion cleanup", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".cinematic")).toHaveAttribute("data-motion", "ready");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator(".signature-squeegee")).toBeHidden();
  await fits(page);
  await page.screenshot({ path: "test-results/production/desktop-home.png" });
});

test("13 readable homepage when enhancement scripts fail", async ({ page }) => {
  await page.route("**/_next/static/**/*.js", route => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Clean spaces Better every day" })).toBeVisible();
  await expect(page.locator(".process-step")).toHaveCount(3);
  for (const step of await page.locator(".process-step").all()) await expect(step).toBeVisible();
});

test("14 anonymous account and staff routes require login", async ({ page, request }) => {
  for (const path of ["/dashboard", "/dashboard/requests", "/dashboard/profile", "/staff", "/staff/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.getByRole("heading", { name: "Log in to Rose" })).toBeVisible();
  }
  for (const path of ["/api/bookings", "/api/account/export", "/api/staff/data"]) expect((await request.get(path)).status()).toBe(401);
});

test("15 registration and recovery forms enforce input constraints", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("minlength", "12");
  expect(await page.locator("form").evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
  await page.goto("/forgot-password");
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  expect(await page.locator("form").evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(false);
});

test("16 expired authentication links fail safely", async ({ page }) => {
  await page.goto("/auth/callback?next=https%3A%2F%2Fexample.invalid");
  await expect(page).toHaveURL(/\/login\?error=link-expired$/);
  await expect(page.getByRole("heading", { name: "Log in to Rose" })).toBeVisible();
  await page.goto("/rose-production-missing-page");
  await expect(page.getByRole("heading", { name: "We can’t find that page", exact: true })).toBeVisible();
});

test("17 API rejects cross-origin writes and production demo access", async ({ request }) => {
  expect((await request.post("/api/contact", { headers: { Origin: "https://example.invalid" }, data: {} })).status()).toBe(403);
  expect((await request.post("/api/demo", { headers: { Origin: "https://rosecleaning.uk" }, data: { role: "staff" } })).status()).toBe(404);
  const invalid = await request.post("/api/contact", { headers: { Origin: "https://rosecleaning.uk" }, data: {} });
  expect(invalid.status()).toBe(400);
  expect(await invalid.text()).not.toMatch(/service_role|sb_secret_|stack|postgresql:\/\//i);
});

test("18 synthetic customer login, isolation and logout", async ({ page, context }) => {
  const email = process.env.ROSE_TEST_EMAIL;
  const password = process.env.ROSE_TEST_PASSWORD;
  test.skip(!email || !password, "Requires an explicitly provisioned synthetic account; never use a customer account.");
  expect(email).toMatch(/\+rose-qa-/);
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill(email!);
  await page.getByLabel("Password", { exact: true }).fill(password!);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const sessions = (await context.cookies()).filter(cookie => /^sb-.*-auth-token/.test(cookie.name));
  expect(sessions.length).toBeGreaterThan(0);
  expect(sessions.every(cookie => cookie.httpOnly && cookie.secure && cookie.sameSite === "Lax")).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Hello, Rose" })).toBeVisible();
  const data = await page.request.get("/api/account/export");
  expect(data.status()).toBe(200);
  const own = await data.json();
  expect(own.profile.email).toBe(email);
  expect(own.bookings.every((b: {customer_id: string}) => b.customer_id === own.profile.id)).toBeTruthy();
  expect((await page.request.get("/api/staff/data")).status()).toBe(403);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/profile");
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  await fits(page);
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get("/api/account/export")).status()).toBe(401);
});
