/** Real browser captures; start the local demo preview on port 3005 first. */
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.argv[2] || "http://localhost:3005";
const output = ".local/cinematic-qa";
const browser = await chromium.launch({
  channel: existsSync(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  )
    ? "chrome"
    : undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(20000);
const errors = [];
const failures = [];
const layouts = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("response", (response) => {
  if (response.status() >= 400)
    failures.push({ url: response.url(), status: response.status() });
});
await mkdir(output, { recursive: true });
async function visit(path) {
  await page.goto(`${origin}${path}`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((i) => {
          const rect = i.getBoundingClientRect();
          return (
            i.getClientRects().length > 0 &&
            rect.top < innerHeight &&
            rect.bottom > 0
          );
        })
        .map((i) => i.decode().catch(() => {})),
    ),
  );
  await page.waitForTimeout(1400); // Capture the settled entrance, not a transition frame.
}
async function capture(name, options = {}) {
  await page.screenshot({ path: `${output}/${name}.png`, ...options });
  layouts.push({
    name,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  });
}
await visit("/");
if (!(await page.getByText("DEMO PREVIEW", { exact: true }).isVisible()))
  throw new Error("Use the explicitly identified local demo preview.");
await page.keyboard.press("Tab");
const keyboardSkip = await page
  .getByRole("link", { name: "Skip to content" })
  .evaluate(
    (e) =>
      e === document.activeElement &&
      getComputedStyle(e).outlineStyle !== "none",
  );
await page.mouse.click(1390, 990);
await capture("home-desktop");
await page.locator("#services").evaluate((e) =>
  window.scrollTo({
    top: e.getBoundingClientRect().top + scrollY - 25,
    behavior: "instant",
  }),
);
await page.waitForTimeout(1200);
await capture("featured-services-desktop");
await page.locator(".signature-photo").evaluate((e) =>
  window.scrollTo({
    top: e.getBoundingClientRect().top + scrollY - innerHeight * 0.5,
    behavior: "instant",
  }),
);
await page.waitForTimeout(1000);
await capture("cleaning-reveal");
await page
  .locator(".process-step")
  .nth(1)
  .evaluate((e) =>
    window.scrollTo({
      top: e.getBoundingClientRect().top + scrollY - 200,
      behavior: "instant",
    }),
  );
await page.waitForTimeout(1000);
await capture("process-story");
for (
  let position = 0;
  position < (await page.locator("body").evaluate((e) => e.scrollHeight));
  position += 700
) {
  await page.evaluate(
    (top) => window.scrollTo({ top, behavior: "instant" }),
    position,
  );
  await page.waitForTimeout(120);
}
await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(1100);
await capture("home-full", { fullPage: true });
await visit("/services");
await capture("services-desktop");
await page.getByRole("button", { name: "Specialist", exact: true }).click();
await page
  .getByRole("button", { name: /Carpet & Upholstery Cleaning/ })
  .click();
await page.locator(".category-intro").evaluate((e) =>
  window.scrollTo({
    top: e.getBoundingClientRect().top + scrollY - 35,
    behavior: "instant",
  }),
);
await page.waitForTimeout(800);
await capture("specialist-services");
for (const path of ["about", "contact", "office-quote", "login", "signup"]) {
  await visit(`/${path}`);
  await capture(`${path}-desktop`);
}
await page.setViewportSize({ width: 820, height: 1180 });
await visit("/");
await capture("home-tablet");
await page.setViewportSize({ width: 375, height: 812 });
for (const path of ["", "services", "about", "contact", "login", "signup"]) {
  await visit(`/${path}`);
  await capture(`${path || "home"}-mobile`);
}
await visit("/services");
await page.locator(".service-index-item").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await capture("service-selection-mobile");
await visit("/");
await page.getByLabel("Open navigation").click();
await capture("navigation-mobile");
await page.keyboard.press("Escape");
const mobileEscape = await page
  .locator(".mobile-nav")
  .evaluate(
    (e) =>
      !e.querySelector("dialog").open &&
      document.activeElement === e.querySelector(".menu-trigger"),
  );
await page.emulateMedia({ reducedMotion: "reduce" });
await page.setViewportSize({ width: 1440, height: 1000 });
await visit("/");
const reducedMotion = {
  pinnedScenes: await page.locator(".pin-spacer").count(),
  hazeHidden: await page.locator(".signature-haze").isHidden(),
};
const icons = await page
  .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
  .evaluateAll((items) =>
    items.map((item) => ({ href: item.href, sizes: item.sizes.value })),
  );
for (const icon of icons)
  if (!(await page.request.get(icon.href)).ok())
    failures.push({ url: icon.href, status: "icon failed" });
const logoResponse = await page.request.get(
  `${origin}/brand/Logo-transparent.png`,
);
const report = {
  errors,
  failures,
  layouts,
  keyboardSkip,
  mobileEscape,
  reducedMotion,
  logoLoads: logoResponse.ok(),
  icons,
};
await writeFile(
  `${output}/browser-report.json`,
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (
  errors.length ||
  failures.length ||
  layouts.some((item) => item.overflow) ||
  !keyboardSkip ||
  !mobileEscape ||
  reducedMotion.pinnedScenes ||
  !reducedMotion.hazeHidden ||
  !logoResponse.ok()
)
  process.exitCode = 1;
