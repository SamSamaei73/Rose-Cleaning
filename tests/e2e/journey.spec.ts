import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
const origin = "http://localhost:3005";
const futureDate = (days = 7) => {
  const d = new Date(Date.now() + days * 86400000);
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const post = (request: APIRequestContext, path: string, data: unknown) =>
  request.post(`/api/${path}`, { headers: { Origin: origin }, data });
const fixture = (date = futureDate()) => ({
  postcode: "SW1A 1AA",
  serviceId: "regular",
  propertyType: "flat",
  bedrooms: 1,
  bathrooms: 1,
  address: "Flat 2, 14 Fictional Test Lane, London",
  extras: [],
  date,
  windowId: "morning",
  notes: "Fictional test request",
  pets: "",
  access: "",
});
async function makeRequest(request: APIRequestContext) {
  const draft = fixture();
  const estimate = await post(request, "estimate", draft);
  expect(estimate.ok()).toBeTruthy();
  const { quoteToken } = await estimate.json();
  const payload = {
    draft,
    quoteToken,
    idempotencyKey: crypto.randomUUID(),
    policyVersion: null,
    acknowledged: true,
  };
  const response = await post(request, "bookings", payload);
  expect(response.ok()).toBeTruthy();
  return { booking: (await response.json()).booking, payload };
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBeTruthy();
}

test("public request draft survives sign-in; staff confirms; customer sees real status history", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByText("DEMO PREVIEW", { exact: true })).toBeVisible();
  await page
    .locator(".hero")
    .getByRole("link", { name: "Request a clean" })
    .click();
  await page.getByLabel("Property postcode").fill("sw1a1aa");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Bedrooms", { exact: true }).selectOption("2");
  await page
    .getByLabel("Full property address", { exact: true })
    .fill("Flat 2, 14 Fictional Test Lane, London");
  await page.getByLabel("Pets", { exact: false }).fill("One fictional cat");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("checkbox", { name: /Inside oven/ }).check();
  await page
    .getByLabel("Anything you’d like Rose to know?", { exact: false })
    .fill("Please focus on the kitchen. Fictional browser test.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const date = futureDate();
  if (date.slice(0, 7) !== new Date().toISOString().slice(0, 7))
    await page.getByRole("button", { name: "Next month" }).click();
  await page.getByRole("button", { name: date, exact: true }).click();
  await page.getByRole("button", { name: /Morning.*09:00/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("Flat 2, 14 Fictional Test Lane, London", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Create free account" }).click();
  await page.getByRole("button", { name: "Explore the customer demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Your fresh start, all set out" }),
  ).toBeVisible();
  await expect(
    page.getByText("Flat 2, 14 Fictional Test Lane, London", { exact: false }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page.getByRole("button", { name: "Send cleaning request" }).click();
  await expect(
    page.getByText("Request received — awaiting confirmation from Rose.", {
      exact: true,
    }),
  ).toBeVisible();
  const id = page.url().match(/bookings\/([^?]+)/)![1];
  await page.getByRole("button", { name: "Staff demo", exact: true }).click();
  await expect(page).toHaveURL(/\/staff$/);
  await page.goto(`/staff/bookings/${id}`);
  await page
    .getByRole("button", { name: "Confirm request", exact: true })
    .click();
  await expect(page.locator(".portal-heading .status")).toHaveText("Confirmed");
  await page
    .getByRole("button", { name: "Customer demo", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto(`/dashboard/bookings/${id}`);
  await expect(page.locator(".portal-heading .status")).toHaveText("Confirmed");
  await expect(
    page.getByText("Rose confirmed the requested visit and quotation."),
  ).toBeVisible();
  await page.goto("/dashboard/settings");
  const exportResponse = await page.request.get("/api/account/export");
  expect(exportResponse.status()).toBe(200);
  expect((await exportResponse.json()).bookings).toHaveLength(1);
});

test("API rejects tampered totals, prevents duplicates, isolates workspaces and protects staff", async ({
  page,
  browser,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Explore the customer demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const { booking, payload } = await makeRequest(page.request);
  const replay = await post(page.request, "bookings", payload);
  expect((await replay.json()).booking.id).toBe(booking.id);
  const manipulated = await post(page.request, "bookings", {
    ...payload,
    idempotencyKey: crypto.randomUUID(),
    totalPence: 1,
  });
  expect(manipulated.status()).toBe(400);
  const changedDraft = await post(page.request, "bookings", {
    ...payload,
    idempotencyKey: crypto.randomUUID(),
    draft: { ...payload.draft, bedrooms: 5 },
  });
  expect(changedDraft.status()).toBe(409);
  expect((await changedDraft.json()).details.quote.totalPence).toBeGreaterThan(
    booking.quote.totalPence,
  );
  const forbidden = await post(page.request, "staff/settings", {
    kind: "availability",
    value: {},
  });
  expect(forbidden.status()).toBe(403);
  const confirm = await post(page.request, `bookings/${booking.id}/action`, {
    action: "confirm",
    revision: 1,
  });
  expect(confirm.status()).toBe(403);
  const other = await browser.newContext({ baseURL: origin });
  await post(other.request, "demo", { role: "customer" });
  expect(await (await other.request.get("/api/bookings")).json()).toEqual([]);
  const foreign = await post(other.request, `bookings/${booking.id}/action`, {
    action: "cancel",
    revision: 1,
  });
  expect(foreign.status()).toBe(404);
  await other.close();
  await post(page.request, "demo", { role: "staff" });
  await post(page.request, `bookings/${booking.id}/action`, {
    action: "confirm",
    revision: 1,
  });
  await post(page.request, `bookings/${booking.id}/action`, {
    action: "confirm",
    revision: 1,
  });
  const data = await (await page.request.get("/api/staff/data")).json();
  expect(data.notifications).toHaveLength(2);
  expect(
    data.notifications.map((n: { event_type: string }) => n.event_type),
  ).toEqual(["request_received", "booking_confirmed"]);
  expect(
    data.notifications.every((n: { status: string }) => n.status === "preview"),
  ).toBeTruthy();
  const catalogue = await (await page.request.get("/api/catalogue")).json();
  const nextPricing = {
    ...catalogue.pricing,
    version: "browser-demo-v2",
    services: {
      ...catalogue.pricing.services,
      regular: { ...catalogue.pricing.services.regular, hourlyPence: 5000 },
    },
  };
  expect(
    (
      await post(page.request, "staff/settings", {
        kind: "pricing",
        value: nextPricing,
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await post(page.request, "staff/settings", {
        kind: "pricing",
        value: nextPricing,
      })
    ).status(),
  ).toBe(409);
  const revisedEstimate = await (
    await post(page.request, "estimate", payload.draft)
  ).json();
  expect(revisedEstimate.quote.totalPence).toBeGreaterThan(
    booking.quote.totalPence,
  );
  const unchangedBooking = await (
    await page.request.get("/api/bookings")
  ).json();
  expect(unchangedBooking[0].quote.version).toBe(booking.quote.version);
  const versions = await (await page.request.get("/api/staff/data")).json();
  expect(versions.pricingDrafts).toHaveLength(2);
  const csrf = await page.request.post("/api/account/profile", {
    headers: { Origin: "https://unrelated.example" },
    data: { full_name: "Changed", phone: "" },
  });
  expect(csrf.status()).toBe(403);
});

test("a changed arrangement requires customer acceptance and then supports cancellation", async ({
  page,
}) => {
  await post(page.request, "demo", { role: "customer" });
  const { booking } = await makeRequest(page.request);
  await post(page.request, "demo", { role: "staff" });
  const proposal = {
    date: futureDate(9),
    windowId: "afternoon",
    totalPence: 8800,
    message: "A fictional alternative for the browser test.",
  };
  const r = await post(page.request, `bookings/${booking.id}/action`, {
    action: "propose",
    revision: 1,
    proposal,
  });
  expect(r.ok()).toBeTruthy();
  expect((await r.json()).booking.quote.totalPence).toBe(
    booking.quote.totalPence,
  );
  await post(page.request, "demo", { role: "customer" });
  await page.goto(`/dashboard/bookings/${booking.id}`);
  await expect(
    page.getByRole("heading", { name: "An alternative from Rose" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Accept proposed arrangement" })
    .click();
  await expect(page.locator(".portal-heading .status")).toHaveText("Confirmed");
  await expect(page.getByText("£88", { exact: true }).first()).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Cancel visit" }).click();
  await expect(page.locator(".portal-heading .status")).toHaveText("Cancelled");
});

test("public contact form persists in the staff inbox without claiming email delivery", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByLabel("Your name").fill("Taylor Fixture");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("taylor@example.test");
  await page
    .getByLabel("How can we help?")
    .fill("A fictional enquiry about a cleaning request.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText(
      "Demo enquiry saved in this temporary workspace. No email was sent.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Staff demo", exact: true }).click();
  await expect(page).toHaveURL(/\/staff$/);
  await page.goto("/staff/outbox");
  await expect(
    page.getByRole("heading", { name: "Taylor Fixture" }),
  ).toBeVisible();
  await expect(
    page.getByText("A fictional enquiry about a cleaning request."),
  ).toBeVisible();
});

test("mobile navigation, all public routes and progressive form stay within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [
    "/",
    "/about",
    "/services",
    "/contact",
    "/office-quote",
    "/terms",
    "/privacy",
    "/cancellation",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await noOverflow(page);
    // Follow normal scrolling before checking lazy images. Responsive variants
    // hidden by CSS are intentionally not downloaded on this viewport.
    for (const image of await page.locator("img").all()) {
      if (!(await image.isVisible())) continue;
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBeTruthy();
    }
  }
  await page.goto("/");
  await page.getByLabel("Open navigation").click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Request a clean" })
    .click();
  await page.getByLabel("Property postcode").fill("SW1A 1AA");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Full property address", { exact: true })
    .fill(
      "An exceptionally long fictional building and apartment address, 123 A Very Long Street Name, London",
    );
  await noOverflow(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await noOverflow(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await noOverflow(page);
  await expect(page.getByRole("button", { name: "Next month" })).toBeVisible();
});

test("profile, saved address and deletion request persist with truthful account status", async ({
  page,
}) => {
  await post(page.request, "demo", { role: "customer" });
  await page.goto("/dashboard/settings");
  await page.getByLabel("Full name", { exact: true }).fill("Jordan Fictional");
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Profile saved.");
  await page.getByLabel("Address name").fill("Fictional home");
  await page.getByLabel("Postcode", { exact: true }).fill("SW1A 1AA");
  await page
    .getByLabel("Full address", { exact: true })
    .fill("Apartment 18, Fictional Test Building, 123 Example Road, London");
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Fictional home", exact: true }),
  ).toBeVisible();
  const exported = await (await page.request.get("/api/account/export")).json();
  expect(exported.profile.full_name).toBe("Jordan Fictional");
  expect(exported.addresses).toHaveLength(1);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Request deletion", exact: true })
    .click();
  await expect(page.getByText(/Deletion status:/)).toContainText(
    "Records have not been erased.",
  );
  await post(page.request, "account/deletion", { acknowledged: true });
  await post(page.request, "demo", { role: "staff" });
  const data = await (await page.request.get("/api/staff/data")).json();
  expect(data.accountRequests).toHaveLength(1);
  expect(
    (
      await post(page.request, "staff/account-request", {
        id: data.accountRequests[0].id,
        status: "in_review",
      })
    ).ok(),
  ).toBeTruthy();
  await post(page.request, "demo", { role: "customer" });
  await page.goto("/dashboard/settings");
  await expect(page.getByText(/Deletion status:/)).toContainText("in review");
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Jordan Fictional",
  );
});

test("office quotes reach the staff inbox and staff pages fit a small screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/office-quote");
  await page.getByLabel("Your name").fill("Robin Office Fixture");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("robin@example.test");
  await page.getByLabel("Office postcode").fill("EC1A 1BB");
  await page.getByLabel("Company name").fill("Fictional Test Office Ltd");
  await page
    .getByLabel("Premises, cleaning needs and preferred schedule")
    .fill(
      "Fictional workspace: request a discussion about weekly office cleaning.",
    );
  await page.getByRole("button", { name: "Send quote request" }).click();
  await expect(page.getByRole("status")).toContainText("No email was sent.");
  await post(page.request, "demo", { role: "staff" });
  for (const path of [
    "/staff",
    "/staff/bookings",
    "/staff/calendar",
    "/staff/catalogue",
    "/staff/settings",
    "/staff/outbox",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await noOverflow(page);
  }
  await expect(
    page.getByRole("heading", { name: "Robin Office Fixture" }),
  ).toBeVisible();
  await expect(page.getByText(/Fictional Test Office Ltd/)).toBeVisible();
});
