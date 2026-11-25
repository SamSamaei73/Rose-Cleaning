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
    await expect(page.locator(".header-login")).toHaveText("Dashboard");
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

test("desktop links and mobile navigation adapt, trap focus and restore scrolling on resize", async ({
  page,
}) => {
  for (const width of [1440, 1024, 851]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const navigation = page.getByRole("navigation", {
      name: "Main navigation",
    });
    for (const label of ["Home", "Services", "About", "Contact"])
      await expect(
        navigation.getByRole("link", { name: label, exact: true }),
      ).toBeVisible();
    await expect(page.getByLabel("Open navigation")).toBeHidden();
    await expect(
      page.locator("header").getByRole("link", { name: /Request/ }),
    ).toHaveCount(0);
    await expect(page.locator(".header-login")).toHaveText("Login");
    await fits(page);
  }
  for (const viewport of [
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
    await dialog.getByRole("link", { name: "Services", exact: true }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(dialog).toBeHidden();
    await fits(page);
  }
  await page.getByLabel("Open navigation").click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.getByRole("dialog", { name: "Rose navigation" }),
  ).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(
    page.locator('.header-nav a[aria-current="page"]'),
  ).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Open navigation").click();
  await expect(
    page.getByRole("dialog", { name: "Rose navigation" }),
  ).toBeVisible();
});

test("About is a separate static page with no homepage cleaning effects", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".header-nav")
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole("heading", { name: "Elevating the Art of Cleaning", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(
      ".cinematic, .rose-scene, [data-glass], [data-wipe], .pin-spacer",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".about-portrait.photo-frame img")).toBeVisible();
  await expect(page.locator(".footer-signature")).toHaveCount(0);
  await expect(
    page.locator("footer").getByRole("link", { name: "Privacy · draft" }),
  ).toHaveAttribute("href", "/privacy");
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto("/about");
  await fits(page);
});

test("the early glass sweep clears only the squeegee path and reduces to a clean static image", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const frames = page.locator(".rose-scene .scene-photo.photo-frame");
    await expect(frames).toHaveCount(4);
    for (const frame of await frames.all()) await expect(frame).toBeVisible();
    const surface = page.locator("[data-glass]");
    await expect(surface).toHaveAttribute("data-glass-ready", "true");
    await expect(surface.locator("img")).toHaveCount(1);
    const count = width < 641 ? 2 : 3;
    const duration = count * 1.08 + 0.55;
    for (let band = 0; band < count; band++) {
      await surface.evaluate(
        (element, progress) => {
          const rect = element.getBoundingClientRect();
          const start = rect.top + scrollY - innerHeight * 0.8;
          const end = rect.bottom + scrollY - innerHeight * 0.65;
          window.scrollTo({
            top: start + (end - start) * progress,
            behavior: "instant",
          });
        },
        (band * 1.08 + 0.5) / duration,
      );
      const mist = surface.locator(".glass-mist-band").nth(band);
      await expect
        .poll(() =>
          mist.evaluate((element) =>
            parseFloat(getComputedStyle(element).getPropertyValue("--clear")),
          ),
        )
        .toBeGreaterThan(40);
      await expect
        .poll(() =>
          surface.evaluate((element, band) => {
            const surface = element.getBoundingClientRect();
            const mist = element.querySelectorAll(".glass-mist-band")[band];
            const clear = parseFloat(
              getComputedStyle(mist).getPropertyValue("--clear"),
            );
            const blade = element
              .querySelector(".glass-squeegee > rect")!
              .getBoundingClientRect();
            return Math.abs(
              blade.left - (surface.left + (surface.width * clear) / 100),
            );
          }, band),
        )
        .toBeLessThan(2);
      await expect(surface.locator(".glass-tool-track")).toHaveCSS(
        "opacity",
        "1",
      );
      await expect(surface.locator(".glass-tool-track")).toHaveCSS(
        "pointer-events",
        "none",
      );
      if (band + 1 < count)
        await expect(
          surface.locator(".glass-mist-band").nth(band + 1),
        ).toHaveCSS("--clear", "-10%");
    }
    await surface.evaluate((element) =>
      window.scrollTo({
        top: element.getBoundingClientRect().bottom + scrollY,
        behavior: "instant",
      }),
    );
    await expect
      .poll(() =>
        surface
          .locator(".glass-mist-band")
          .nth(count - 1)
          .evaluate((element) =>
            parseFloat(getComputedStyle(element).getPropertyValue("--clear")),
          ),
      )
      .toBeGreaterThan(99);
    await expect(surface.locator(".glass-tool-track")).toHaveCSS(
      "opacity",
      "0",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(surface.locator(".glass-condensation")).toBeHidden();
    await expect(surface.locator(".glass-tool-track")).toBeHidden();
    await expect(surface.locator(".glass-polish")).toBeHidden();
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await fits(page);
  }
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
