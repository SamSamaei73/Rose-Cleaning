import { test, expect, type Page } from "@playwright/test";

async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  const logo = await page.locator(".header-inner > .brand").boundingBox();
  expect(
    Math.abs(logo!.x + logo!.width / 2 - page.viewportSize()!.width / 2),
  ).toBeLessThan(2);
}

test("mobile pages, account navigation and form fields fit narrow screens", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      "/",
      "/about",
      "/services",
      "/contact",
      "/office-quote",
      "/login",
      "/signup",
      "/book",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await fits(page);
      const sizes = await page
        .locator(
          'input:not([type="checkbox"]):not([type="radio"]), select, textarea',
        )
        .evaluateAll((elements) =>
          elements
            .filter((e) => e.getBoundingClientRect().width > 10)
            .map((e) => parseFloat(getComputedStyle(e).fontSize)),
        );
      expect(sizes.every((size) => size >= 16)).toBeTruthy();
    }
  }
  await page.request.post("/api/demo", {
    headers: { Origin: "http://localhost:3005" },
    data: { role: "customer" },
  });
  await page.setViewportSize({ width: 320, height: 812 });
  for (const path of ["/dashboard", "/dashboard/book", "/dashboard/settings"]) {
    await page.goto(path);
    await expect(page.locator(".header-login")).toHaveText("My account");
    await fits(page);
  }
  await page.request.post("/api/demo", {
    headers: { Origin: "http://localhost:3005" },
    data: { role: "staff" },
  });
  for (const path of [
    "/staff",
    "/staff/bookings",
    "/staff/catalogue",
    "/staff/settings",
  ]) {
    await page.goto(path);
    await fits(page);
  }
});

test("floating navigation remains usable, traps focus and restores it after closing", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 320, height: 640 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() =>
      window.scrollTo({ top: 800, behavior: "instant" }),
    );
    await expect(page.getByLabel("Open navigation")).toBeInViewport();
    await page.getByLabel("Open navigation").click();
    const dialog = page.getByRole("dialog", { name: "Rose navigation" });
    await expect(dialog).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((e) => e.contains(document.activeElement)),
      ).toBeTruthy();
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel("Open navigation")).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await page.getByLabel("Open navigation").click();
    await dialog
      .getByRole("link", { name: "Our services", exact: true })
      .click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(dialog).toBeHidden();
    await fits(page);
  }
});

test("photographic aperture follows scroll and restores the clean static state for reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/about");
  await expect(page.locator(".cinematic")).toHaveAttribute(
    "data-motion",
    "ready",
  );
  const frame = page.locator("[data-aperture]");
  const initial = await frame.evaluate((e) => getComputedStyle(e).clipPath);
  await frame.evaluate((e) =>
    window.scrollTo({
      top: e.getBoundingClientRect().top + scrollY,
      behavior: "instant",
    }),
  );
  await expect
    .poll(() => frame.evaluate((e) => getComputedStyle(e).clipPath))
    .not.toBe(initial);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(frame).toHaveCSS("clip-path", "none");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(frame.locator("img")).toHaveCSS("transform", "none");
});

test("a narrow-screen customer can complete the request form and calendar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.request.post("/api/demo", {
    headers: { Origin: "http://localhost:3005" },
    data: { role: "customer" },
  });
  await page.goto("/dashboard/book");
  await page.getByLabel("Property postcode").fill("SW1A 1AA");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Full property address", { exact: true })
    .fill(
      "Flat 14, A Very Long Fictional Building Name, 123 Example Street, London",
    );
  await fits(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next month" })).toBeVisible();
  await fits(page);
  const date = new Date(Date.now() + 7 * 86400000);
  if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  const dateLabel = date.toISOString().slice(0, 10);
  if (dateLabel.slice(0, 7) !== new Date().toISOString().slice(0, 7))
    await page.getByRole("button", { name: "Next month" }).click();
  const estimateReady = page.waitForResponse((response) => {
    if (!response.url().endsWith("/api/estimate")) return false;
    const draft = response.request().postDataJSON();
    return draft?.date === dateLabel && draft?.windowId === "morning";
  });
  await page.getByRole("button", { name: dateLabel, exact: true }).click();
  await page.getByRole("button", { name: /Morning.*09:00/ }).click();
  expect((await estimateReady).ok()).toBeTruthy();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await fits(page);
  await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page.getByRole("button", { name: "Send cleaning request" }).click();
  await expect(
    page.getByText("Request received — awaiting confirmation from Rose.", {
      exact: true,
    }),
  ).toBeVisible();
  await fits(page);
});
