import { expect, test } from "@playwright/test";

test("password recovery and new-account navigation keep plain text styling", async ({
  page,
}) => {
  await page.goto("/login");
  const plain = page.locator("a.text-link");
  await expect(plain).toHaveCount(2);
  await expect(page.locator(".auth-recovery")).toHaveAttribute(
    "href",
    "/forgot-password",
  );
  await expect(page.locator(".auth-create-account")).toHaveAttribute(
    "href",
    /\/signup\?next=/,
  );
  for (const link of await plain.all()) {
    for (const state of ["normal", "hover", "focus"] as const) {
      if (state === "hover") await link.hover();
      if (state === "focus") await link.focus();
      await expect(link).toHaveCSS("text-decoration-line", "none");
      await expect(link).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(link).toHaveCSS("background-image", "none");
      await expect(link).toHaveCSS("box-shadow", "none");
      await expect(link).toHaveCSS("border-bottom-width", "0px");
      await expect(link).toHaveCSS("transform", "none");
    }
  }
  await page.locator(".auth-create-account").click();
  await expect(page).toHaveURL(/\/signup\?next=/);
  const back = page.getByRole("link", { name: "Back to log in" });
  await expect(back).toHaveClass(/btn/);
  await back.click();
  await page.locator(".auth-recovery").click();
  await expect(page).toHaveURL(/\/forgot-password$/);
});

for (const width of [1440, 390]) {
  test(`header links stay simple and other action controls use button surfaces at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    async function audit() {
      const result = await page.evaluate(() => {
        const anchors = [...document.querySelectorAll("a")].filter(
          (a) =>
            a.getBoundingClientRect().width && !a.classList.contains("brand"),
        );
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          underlined: anchors
            .filter((a) =>
              getComputedStyle(a).textDecorationLine.includes("underline"),
            )
            .map((a) => a.textContent),
          flat: anchors
            .filter((a) => {
              if (
                a.classList.contains("text-link") ||
                (a.closest(".site-header") && !a.classList.contains("header-login"))
              ) return false;
              const css = getComputedStyle(a);
              return (
                (css.backgroundImage === "none" &&
                  css.backgroundColor === "rgba(0, 0, 0, 0)") ||
                (parseFloat(css.borderRadius) === 0 && css.boxShadow === "none")
              );
            })
            .map((a) => ({
              label: a.textContent?.trim() || a.getAttribute("aria-label"),
              href: a.getAttribute("href"),
            })),
        };
      });
      expect(result.overflow).toBe(false);
      expect(result.underlined).toEqual([]);
      expect(result.flat).toEqual([]);
    }
    for (const route of [
      "/",
      "/services",
      "/contact",
      "/login",
      "/signup",
      "/privacy",
      "/office-quote",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await audit();
    }
    await page.request.post("/api/demo", {
      headers: { Origin: "http://localhost:3005" },
      data: { role: "customer" },
    });
    for (const route of [
      "/dashboard",
      "/dashboard/profile",
      "/dashboard/requests",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await audit();
    }
    await page.request.post("/api/demo", {
      headers: { Origin: "http://localhost:3005" },
      data: { role: "staff" },
    });
    await page.goto("/staff");
    await expect(page.locator("h1")).toBeVisible();
    await audit();
  });
}
