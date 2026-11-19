import { test, expect } from "@playwright/test";
import {
  serviceCatalogue,
  serviceCategories,
  serviceDestination,
} from "../../lib/service-catalogue";

test("all service collections retain their request destinations and photography", async ({
  page,
}) => {
  await page.goto("/services");
  const explorer = page.locator(".service-explorer");
  for (const category of serviceCategories) {
    await page
      .getByRole("navigation", { name: "Service categories" })
      .getByRole("button", { name: category.name, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: category.name, exact: true }),
    ).toBeVisible();
    for (const service of serviceCatalogue.filter(
      (item) => item.category === category.id,
    )) {
      await explorer
        .getByRole("button", {
          name: new RegExp(service.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        })
        .click();
      const action = explorer.getByRole("link", {
        name: `${service.journey === "booking" ? "Request a clean" : "Get a quote"}: ${service.name}`,
        exact: true,
      });
      await expect(action).toHaveAttribute("href", serviceDestination(service));
      const photo = explorer.getByRole("img", {
        name: service.alt,
        exact: true,
      });
      await photo.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          photo.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBeTruthy();
    }
  }
  await explorer
    .getByRole("link", { name: "Get a quote: Mobile Car Wash", exact: true })
    .click();
  await expect(page).toHaveURL(/\/contact\?service=mobile-car-wash/);
  await expect(page.getByText(/Ask Rose about mobile car wash/)).toBeVisible();
  await page.getByLabel("Your name").fill("Service Link Fixture");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("service-link@example.test");
  await page
    .getByLabel("How can we help?")
    .fill("A fictional mobile car wash enquiry from the catalogue.");
  await page.getByRole("button", { name: "Send quote request" }).click();
  await expect(page.getByRole("status")).toContainText("No email was sent.");
});

test("scroll story enhances the page and cleans up for reduced motion, mobile and navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".cinematic")).toHaveAttribute(
    "data-motion",
    "ready",
  );
  const hero = page.locator(".cinematic-hero-image");
  const firstTransform = await hero.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.evaluate(() => window.scrollTo({ top: 650, behavior: "instant" }));
  await expect
    .poll(() => hero.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(firstTransform);
  const wipe = page.locator("[data-wipe]");
  const scrollWipeTo = (progress: number) =>
    wipe.evaluate((element, progress) => {
      const rect = element.getBoundingClientRect();
      const top = rect.top + scrollY;
      const start = top - innerHeight * 0.85;
      const end = top + rect.height / 2 - innerHeight * 0.42;
      window.scrollTo({
        top: start + (end - start) * progress,
        behavior: "instant",
      });
    }, progress);
  await scrollWipeTo(0.4);
  await expect
    .poll(() =>
      wipe.evaluate((element) =>
        parseFloat(getComputedStyle(element).getPropertyValue("--wipe")),
      ),
    )
    .toBeGreaterThan(40);
  await expect(page.locator(".signature-squeegee")).toBeVisible();
  const tool = await page.locator(".signature-squeegee").boundingBox();
  const photo = await wipe.boundingBox();
  expect(tool!.x).toBeGreaterThan(photo!.x);
  expect(tool!.x + tool!.width).toBeLessThan(photo!.x + photo!.width);
  await expect(page.locator(".signature-sweep")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await scrollWipeTo(0.86);
  await expect
    .poll(() =>
      page
        .locator(".signature-sheen")
        .evaluate((element) => Number(getComputedStyle(element).opacity)),
    )
    .toBeGreaterThan(0.1);
  await wipe.evaluate((element) =>
    window.scrollTo({
      top: element.getBoundingClientRect().top + scrollY,
      behavior: "instant",
    }),
  );
  await expect
    .poll(() =>
      wipe.evaluate((element) =>
        parseFloat(getComputedStyle(element).getPropertyValue("--wipe")),
      ),
    )
    .toBeGreaterThan(95);
  await expect(page.locator(".signature-sweep")).toHaveCSS("opacity", "0");
  await expect(page.locator(".signature-sheen")).toHaveCSS("opacity", "0");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await page.locator(".process-step").nth(1).scrollIntoViewIfNeeded();
  await expect(page.locator(".process-step").nth(1)).toHaveAttribute(
    "data-active",
    "true",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator(".signature-haze")).toBeHidden();
  await expect(page.locator(".signature-squeegee")).toBeHidden();
  await expect(page.locator(".signature-sheen")).toBeHidden();
  await expect(page.locator(".cinematic")).not.toHaveAttribute(
    "data-motion",
    "ready",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await page
    .getByRole("link", { name: "More about Rose", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.goBack();
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await expect(page.locator(".signature-squeegee")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});

test("the homepage remains readable when enhancement scripts fail to download", async ({
  page,
}) => {
  // Allow Next's inline streamed-HTML bootstrap, but fail downloaded scripts,
  // including GSAP. Existing App Router streaming requires that bootstrap.
  let blocked = 0;
  await page.route("**/_next/static/**/*.js", (route) => {
    blocked++;
    return route.abort();
  });
  await page.goto("/");
  expect(blocked).toBeGreaterThan(0);
  await expect(
    page.getByRole("heading", { name: "Clean spaces Better every day" }),
  ).toBeVisible();
  await expect(
    page.locator(".hero").getByRole("link", { name: "Request a clean" }),
  ).toHaveAttribute("href", "/book");
  await expect(page.locator(".signature-haze")).toBeHidden();
  await expect(page.locator(".process-step")).toHaveCount(3);
  for (const step of await page.locator(".process-step").all())
    await expect(step).toBeVisible();
});

test("public and account titles omit trailing full stops while essential notices remain", async ({
  page,
}) => {
  const checkTitles = async () => {
    const titles = await page
      .locator(
        "h1, h2, h3, h4, h5, h6, .footer-signature > span, .service-index-item > button",
      )
      .allTextContents();
    expect(titles.filter((title) => /\.$/.test(title.trim()))).toEqual([]);
  };
  for (const path of [
    "/",
    "/about",
    "/services",
    "/contact",
    "/office-quote",
    "/book",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/terms",
    "/privacy",
    "/cancellation",
    "/setup",
    "/missing-refinement-preview",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await checkTitles();
  }
  await page.goto("/");
  await expect(
    page.locator(
      ".section-index, .hero-edition, .signature-caption, .signature-note, .process-image-caption, .service-explorer figcaption",
    ),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Ready for a fresh start?" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Stock photographs illustrate services; they do not depict Rose staff or customer results.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto("/office-quote");
  await expect(
    page.getByText(
      "This is a quote request. The service and price need to be agreed with Rose before a visit is confirmed.",
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  for (const [role, paths] of [
    ["customer", ["/dashboard", "/dashboard/bookings", "/dashboard/settings"]],
    ["staff", ["/staff", "/staff/bookings"]],
  ] as const) {
    await page.request.post("/api/demo", {
      headers: { Origin: "http://localhost:3005" },
      data: { role },
    });
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await checkTitles();
    }
  }
});
