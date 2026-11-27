import { expect, test } from "@playwright/test";

for (const width of [1440, 1024, 768, 390, 320]) {
  test(`authentication stays readable and the cleaner stays outside the form at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of ["/login", "/signup"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const card = page.locator(".auth-form-wrap");
      const scene = page.locator("[data-cleaning-scene]");
      await expect(card).toBeVisible();
      await expect(scene).toBeVisible();
      const cardBox = (await card.boundingBox())!;
      const sceneBox = (await scene.boundingBox())!;
      expect(
        sceneBox.x + sceneBox.width <= cardBox.x ||
          sceneBox.y >= cardBox.y + cardBox.height,
      ).toBeTruthy();
      const audit = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        font: getComputedStyle(document.body).fontFamily,
        smallInputs: [...document.querySelectorAll("input")].filter(
          (input) => parseFloat(getComputedStyle(input).fontSize) < 16,
        ).length,
        underlines: [...document.querySelectorAll("a, button")].filter((link) =>
          getComputedStyle(link).textDecorationLine.includes("underline"),
        ).length,
      }));
      expect(audit.overflow).toBeFalsy();
      expect(audit.font.toLowerCase()).toContain("manrope");
      expect(audit.smallInputs).toBe(0);
      expect(audit.underlines).toBe(0);
    }
    expect(errors).toEqual([]);
  });
}

test("the real 3D cleaner animates, pauses, resumes and respects reduced motion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/login");
  const scene = page.locator("[data-cleaning-scene]");
  const renderer = scene.locator("[data-cleaner-renderer]");
  const canvas = renderer.locator("canvas");
  await expect(renderer).toHaveAttribute("data-cleaner-renderer", "webgl", {
    timeout: 30000,
  });
  await expect(canvas).toHaveAttribute("data-animating", "true");
  const started = Date.now();
  const firstFrame = Number(await canvas.getAttribute("data-frame"));
  await page.waitForTimeout(1050);
  const frameCount =
    Number(await canvas.getAttribute("data-frame")) - firstFrame;
  expect(frameCount).toBeGreaterThan(0);
  expect(frameCount).toBeLessThanOrEqual(
    Math.ceil(((Date.now() - started) / 1000) * 31),
  );
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.locator(".footer-bottom").scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-animating", "false");
  await scene.scrollIntoViewIfNeeded();
  await expect(canvas).toHaveAttribute("data-animating", "true");
  const initial = await canvas.getAttribute("data-frame");
  await expect.poll(() => canvas.getAttribute("data-frame")).not.toBe(initial);
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect(canvas).toHaveAttribute("data-animating", "false");
  const pausedFrame = await canvas.getAttribute("data-frame");
  await page.waitForTimeout(200);
  expect(await canvas.getAttribute("data-frame")).toBe(pausedFrame);
  await page.getByRole("button", { name: "Play animation" }).click();
  await expect(canvas).toHaveAttribute("data-animating", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-animating", "false");
  await expect(
    page.getByRole("button", { name: "Pause animation" }),
  ).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Log in", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("WebGL failure uses the matching rendered 3D animation and keeps forms usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2") return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/login");
  await expect(
    page.locator("[data-cleaning-scene] [data-cleaner-renderer]"),
  ).toHaveAttribute("data-cleaner-renderer", "fallback");
  await expect(
    page.getByRole("button", { name: "Explore the customer demo" }),
  ).toBeEnabled();
  const video = page.locator("[data-cleaning-scene] video");
  await expect(video).toHaveAttribute("data-ready", "true");
  await expect
    .poll(() =>
      video.evaluate((element) => (element as HTMLVideoElement).paused),
    )
    .toBe(false);
  await page.getByRole("button", { name: "Pause animation" }).click();
  await expect
    .poll(() =>
      video.evaluate((element) => (element as HTMLVideoElement).paused),
    )
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).toBeHidden();
  await expect(
    page.locator('[data-cleaning-scene] img[src$="companion.webp"]'),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('[data-cleaning-scene] img[src$="companion.webp"]')
        .evaluate((element) => (element as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("larger typography does not overflow public pages or account navigation on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/services",
    "/about",
    "/contact",
    "/office-quote",
    "/privacy",
    "/forgot-password",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow, route).toBeFalsy();
    await expect(page.locator("body")).toHaveCSS("font-size", "16px");
  }
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore the customer demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("navigation", { name: "Account navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page
    .getByRole("link", { name: "Profile & address", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
