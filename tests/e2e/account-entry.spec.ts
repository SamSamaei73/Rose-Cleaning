import { test, expect } from "@playwright/test";

// Demo sessions exercise routing and the existing page guards, not Supabase login.
test("homepage account actions lead through login to a simple protected dashboard", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goto("/");
  const account = page.locator(".header-login");
  await expect(account).toHaveText("Login");
  await expect(account).toHaveAttribute("href", "/login?next=%2Fdashboard");
  const actions = page
    .locator("main")
    .getByRole("link", { name: /^(Request|Request Cleaning)$/ });
  await expect.poll(() => actions.count()).toBeGreaterThan(1);
  for (const action of await actions.all())
    await expect(action).toHaveAttribute("href", "/login?next=%2Fdashboard");
  const services = page
    .locator(".hero")
    .getByRole("link", { name: "View Services", exact: true });
  await expect(services).toHaveClass(/btn/);
  await services.click();
  await expect(page).toHaveURL(/\/services$/);
  await page.goto("/");
  await page
    .locator(".hero")
    .getByRole("link", { name: "Request Cleaning", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  await expect(
    page.getByLabel("Email address", { exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Explore the customer demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Your first fresh start awaits", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".dashboard-welcome").getByRole("link", { name: "Request a clean", exact: true }),
  ).toHaveAttribute("href", "/dashboard/book");
  await page
    .getByRole("navigation", { name: "Account navigation" })
    .getByRole("link", { name: "Profile & address", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/staff");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/");
  await expect(account).toHaveText("Dashboard");
  await expect(account).toHaveAttribute("href", "/dashboard");
  await expect.poll(() => actions.count()).toBeGreaterThan(1);
  for (const action of await actions.all())
    await expect(action).toHaveAttribute("href", "/dashboard");
  await account.click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(account).toHaveText("Login");
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("a homepage service selection survives login and opens the existing request flow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const catalogue = page.locator(".service-explorer");
  await catalogue.getByRole("button", { name: /Deep Cleaning/ }).click();
  await catalogue
    .getByRole("link", { name: "Request: Deep Cleaning", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%3Fservice%3Ddeep$/);
  await page.getByRole("link", { name: "Create account", exact: true }).click();
  await expect(page).toHaveURL(/\/signup\?next=%2Fdashboard%3Fservice%3Ddeep$/);
  await page.getByRole("button", { name: "Explore the customer demo" }).click();
  await expect(page).toHaveURL(/\/dashboard\?service=deep$/);
  await expect(page.getByText("Selected service: Deep Cleaning")).toBeVisible();
  await page
    .locator(".dashboard-welcome")
    .getByRole("link", { name: "Request a clean", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard\/book\?service=deep$/);
  await expect(
    page.getByRole("radio", { name: /Deep Cleaning/i }),
  ).toBeChecked();
});
