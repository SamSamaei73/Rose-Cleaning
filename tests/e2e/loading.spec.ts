import { expect, test, type Page } from "@playwright/test";

async function expectCenteredOverlay(page: Page) {
  const overlay = page.locator('[data-cleaning-loader="overlay"]');
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveCSS("opacity", "1");
  expect(await overlay.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  const box = (await overlay.boundingBox())!;
  const character = (await overlay
    .locator("[data-loading-spinner]")
    .boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeCloseTo(0, 0);
  expect(box.y).toBeCloseTo(0, 0);
  expect(box.width).toBeCloseTo(viewport.width, 0);
  expect(box.height).toBeCloseTo(viewport.height, 0);
  expect(character.x + character.width / 2).toBeCloseTo(viewport.width / 2, 0);
  expect(character.y + character.height / 2).toBeCloseTo(
    viewport.height / 2,
    0,
  );
  await expect
    .poll(() =>
      overlay.evaluate((element) => getComputedStyle(element).backdropFilter),
    )
    .toContain("blur(14px)");
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  return overlay;
}

test("slow actions share a centered spinner and restore focus on success and error", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/login");
  let finish!: () => void;
  let response = {
    status: 200,
    body: { message: "Demo ready." } as Record<string, string>,
  };
  await page.route("**/api/demo", async (route) => {
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    await route.fulfill({ status: response.status, json: response.body });
  });
  const trigger = page.getByRole("button", {
    name: "Customer demo",
    exact: true,
  });
  for (const status of [200, 503]) {
    response =
      status === 200
        ? { status, body: { message: "Demo ready." } }
        : { status, body: { error: "Please try again." } };
    await trigger.click();
    const overlay = await expectCenteredOverlay(page);
    await expect(overlay.locator("[data-loading-spinner]")).toBeVisible();
    await expect(overlay.locator("canvas")).toHaveCount(0);
    expect(await page.locator('canvas[data-animating="true"]').count()).toBe(0);
    await page.keyboard.press("Tab");
    await expect(overlay).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(overlay).toBeVisible();
    await page.mouse.click(50, 50);
    await expect(page).toHaveURL(/\/login$/);
    if (status === 200)
      await page.screenshot({
        path: test.info().outputPath("centered-loading.png"),
      });
    finish();
    await expect(overlay).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    await expect(trigger).toBeEnabled();
    await expect(trigger).toBeFocused();
    if (status === 200) expect(consoleErrors).toEqual([]);
    if (status === 503)
      await expect(
        page.getByRole("alert").filter({ hasText: "Please try again." }),
      ).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test("instant actions never mount an overlay", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("[data-cleaning-loader]")).toHaveCount(0);
  await page.evaluate(() => {
    const state = window as Window & { loadingShown?: boolean };
    state.loadingShown = false;
    new MutationObserver(() => {
      if (document.querySelector("[data-cleaning-loader]"))
        state.loadingShown = true;
    }).observe(document.body, { childList: true, subtree: true, attributes: true });
  });
  await page.route("**/api/demo", (route) =>
    route.fulfill({ json: { message: "Ready." } }),
  );
  await page
    .getByRole("button", { name: "Customer demo", exact: true })
    .click();
  await expect(page.getByText("Ready.", { exact: true })).toBeVisible();
  await expect(page.locator("[data-cleaning-loader]")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => (window as Window & { loadingShown?: boolean }).loadingShown,
    ),
  ).toBe(false);
});

test("slow navigation uses the same full-screen overlay and clears on arrival", async ({
  page,
}) => {
  await page.goto("/contact");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/services?*", async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Services", exact: true })
    .click();
  await expectCenteredOverlay(page);
  release();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.locator("[data-cleaning-loader]")).toHaveCount(0);
  await expect(page.locator("main h1")).toBeVisible();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 812, height: 375 },
]) {
  test(`overlay stays centered after scrolling at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/signup");
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/demo", async (route) => {
      await gate;
      await route.fulfill({ json: { message: "Ready." } });
    });
    await page
      .getByRole("button", { name: "Explore the customer demo" })
      .click();
    const scroll = await page.evaluate(() => scrollY);
    expect(scroll).toBeGreaterThan(0);
    const overlay = await expectCenteredOverlay(page);
    const message = (await overlay.getByRole("status").boundingBox())!;
    expect(message.y + message.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({
      path: test.info().outputPath("mobile-centered-loading.png"),
    });
    release();
    await expect(overlay).toHaveCount(0);
    expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
  });
}

test("overlapping operations cannot produce duplicate overlays or dismiss each other", async ({
  page,
}) => {
  await page.goto("/login");
  const finish: Record<string, () => void> = {};
  await page.route("**/api/demo", async (route) => {
    const role = route.request().postDataJSON().role;
    await new Promise<void>((resolve) => {
      finish[role] = resolve;
    });
    await route.fulfill({ json: { message: `${role} ready.` } });
  });
  // Start both actions within the threshold, as two quick user interactions can do.
  await page
    .locator(".role-controls button")
    .evaluateAll((buttons) =>
      buttons.forEach((button) => (button as HTMLButtonElement).click()),
    );
  const overlay = await expectCenteredOverlay(page);
  await expect.poll(() => Object.keys(finish).length).toBe(2);
  finish.customer();
  await expect(
    page.getByText("customer ready.", { exact: true }),
  ).toBeAttached();
  await expect(overlay).toHaveCount(1);
  finish.staff();
  await expect(overlay).toHaveCount(0);
});

test("account feedback covers the server refresh after saving", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore the customer demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/profile");
  await page.route("**/api/account/profile", (route) =>
    route.fulfill({ json: { message: "Profile saved." } }),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/dashboard/profile?*", async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  const save = page.getByRole("button", { name: "Save profile", exact: true });
  await save.click();
  await expectCenteredOverlay(page);
  await expect(page.locator("main")).toHaveAttribute("aria-busy", "true");
  release();
  await expect(page.locator("[data-cleaning-loader]")).toHaveCount(0);
  await expect(page.locator("main")).not.toHaveAttribute("aria-busy", "true");
  await expect(save).toBeEnabled();
});

test("the centered spinner needs no WebGL and respects reduced motion", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      return type === "webgl2"
        ? null
        : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/contact");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/demo", async (route) => {
    await gate;
    await route.fulfill({ json: { message: "Ready." } });
  });
  await page
    .getByRole("button", { name: "Customer demo", exact: true })
    .click();
  const overlay = await expectCenteredOverlay(page);
  await expect(overlay.locator("canvas, video, img")).toHaveCount(0);
  const ring = overlay.locator("[data-loading-spinner] > span").first();
  await expect(ring).not.toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(ring).toHaveCSS("animation-name", "none");
  await page.screenshot({
    path: test.info().outputPath("reduced-motion-spinner.png"),
  });
  release();
  await expect(overlay).toHaveCount(0);
});

test("homepage Request waits for the destination code and covers the footer", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/chunks/app/login/*.js", async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto("/");
  await page
    .locator(".hero")
    .getByRole("link", { name: "Request Cleaning", exact: true })
    .click();
  const overlay = await expectCenteredOverlay(page);
  await expect(overlay.locator("[data-loading-spinner]")).toBeVisible();
  await expect(page.locator(".hero")).toBeAttached();
  const footer = page.locator("footer");
  expect(
    await footer.evaluate(
      (element) => element.closest("#application") !== null,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("page-navigation-spinner.png"),
  });
  release();
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.locator(".auth-form-wrap")).toBeVisible();
  await expect(overlay).toHaveCount(0);
});

test("browser back and forward restore complete pages without stuck loading", async ({
  page,
}) => {
  await page.goto("/contact");
  await page
    .locator(".header-nav")
    .getByRole("link", { name: "Services", exact: true })
    .click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.locator("main h1")).toBeVisible();
  await page.locator(".header-login").click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator(".auth-form-wrap")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("[data-cleaning-loader]")).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator(".auth-form-wrap")).toBeVisible();
  await expect(page.locator("[data-cleaning-loader]")).toHaveCount(0);
});

test("stalled actions offer recovery and release the overlay when the request times out", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.clock.install();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/demo", async (route) => {
    await gate;
    await route.fulfill({ json: { message: "Ready." } }).catch(() => {});
  });
  await page
    .getByRole("button", { name: "Customer demo", exact: true })
    .click();
  await page.clock.runFor(500);
  const overlay = page.locator("[data-cleaning-loader]");
  await expect(overlay).toBeVisible();
  await page.clock.runFor(25000);
  await expect(
    overlay.getByRole("button", { name: "Reload page" }),
  ).toBeVisible();
  await expect(overlay.locator("[data-loading-spinner]")).toHaveCount(0);
  await page.clock.runFor(5000);
  await expect(overlay).toHaveCount(0);
  await expect(
    page.getByRole("alert").filter({ hasText: "The request timed out" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Customer demo", exact: true }),
  ).toBeEnabled();
  release();
});

test("the initial page is covered before its JavaScript hydrates, including reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/**/*.js", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/login", { waitUntil: "commit" });
  const overlay = page.locator("#global-loading-overlay");
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveAttribute("data-active", "false");
  await expect(overlay).toHaveCSS(
    "backdrop-filter",
    "blur(14px) saturate(0.8)",
  );
  const box = (await overlay.locator("[data-loading-spinner]").boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x + box.width / 2).toBeCloseTo(viewport.width / 2, 0);
  expect(box.y + box.height / 2).toBeCloseTo(viewport.height / 2, 0);
  await page.keyboard.press("Tab");
  expect(
    await page
      .locator("#application")
      .evaluate((element) => element.contains(document.activeElement)),
  ).toBe(false);
  release();
  await expect(overlay).toBeHidden();
  await page.locator(".auth-create-account").click();
  await expect(page).toHaveURL(/\/signup/);
});

test("Back cancels a pending navigation without waiting for its abandoned response", async ({
  page,
}) => {
  await page.goto("/contact");
  await page
    .locator(".header-nav")
    .getByRole("link", { name: "Services", exact: true })
    .click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.locator("main h1")).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/login?*", async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response }).catch(() => {});
  });
  await page.locator(".header-login").click();
  await expectCenteredOverlay(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.locator("[data-cleaning-loader]")).toHaveCount(0, {
    timeout: 5000,
  });
  release();
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page).toHaveURL(/\/contact$/);
});
