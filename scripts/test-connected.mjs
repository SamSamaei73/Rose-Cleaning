// Controlled HTTP integration tests against real LOCAL Supabase Auth/PostgREST.
// No mock auth, no demo cookie, no external email or production data.
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { request } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert(
  supabaseUrl &&
    ["localhost", "127.0.0.1"].includes(new URL(supabaseUrl).hostname),
  "This test requires LOCAL Supabase.",
);
assert(
  ["localhost", "127.0.0.1"].includes(new URL(origin).hostname),
  "This test requires a LOCAL application.",
);
assert(process.env.APP_MODE !== "demo", "Real auth required.");
assert(
  process.env.EMAIL_SEND_ENABLED !== "true",
  "Disable external email for this test.",
);
const db = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const mailUrl = process.env.TEST_MAIL_URL || "http://127.0.0.1:54324";
const password = `Rose-local-${randomBytes(18).toString("hex")}`;
const runId = Date.now();
const aliceEmail = `rose-alice-${runId}@example.test`,
  bobEmail = `rose-bob-${runId}@example.test`;
const contexts = [];
async function client(ip) {
  const c = await request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Origin: origin, "X-Forwarded-For": ip },
  });
  contexts.push(c);
  return c;
}
async function post(c, path, data, status = 200) {
  const r = await c.post(`/api/${path}`, { data });
  assert.equal(r.status(), status, `${path}: ${await r.text()}`);
  return r.json();
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function mailLink(email) {
  for (let i = 0; i < 40; i++) {
    const listing = await (await fetch(`${mailUrl}/api/v1/messages`)).json();
    const message = listing.messages?.find((m) =>
      m.To?.some((to) => to.Address === email),
    );
    if (message) {
      const detail = await (
        await fetch(`${mailUrl}/api/v1/message/${message.ID}`)
      ).json();
      const body = detail.HTML || detail.Text;
      const href =
        body.match(/href=["']([^"']*(?:verify|callback)[^"']*)["']/)?.[1] ||
        body.match(/https?:\/\/[^\s<>]+(?:verify|callback)[^\s<>]*/)?.[0];
      assert(href, "Captured auth email must have a link");
      return href.replaceAll("&amp;", "&");
    }
    await pause(250);
  }
  throw new Error("Auth email was not captured locally");
}
async function expectRedirect(response, path) {
  if ([302, 303, 307, 308].includes(response.status())) {
    assert(response.headers().location.includes(path));
    return;
  }
  // A streaming App Router page encodes redirects in the HTML response.
  assert.equal(response.status(), 200);
  const html = await response.text();
  assert(
    html.includes(`NEXT_REDIRECT;replace;${path}`) ||
      (html.includes("__next-page-redirect") && html.includes(path)),
    `Expected protected redirect to ${path}`,
  );
}
function checkDb(result) {
  if (result.error)
    throw new Error(`Database test failed: ${result.error.code}`);
  return result.data;
}
try {
  const alice = await client("127.0.0.21"),
    bob = await client("127.0.0.22"),
    visitor = await client("127.0.0.23");
  const protectedPage = await visitor.get("/dashboard", { maxRedirects: 0 });
  await expectRedirect(protectedPage, "/login");
  await post(visitor, "requests", {}, 401);
  const signup = await post(alice, "auth", {
    action: "signup",
    name: "Alice Local QA",
    email: aliceEmail,
    password,
  });
  assert.equal(signup.verification, true);
  await post(
    alice,
    "auth",
    { action: "login", email: aliceEmail, password },
    400,
  );
  await post(alice, "auth", { action: "resend", email: aliceEmail }, 429);
  // Expire only this disposable test email's cooldown after verifying it.
  const cooldownKey = createHmac("sha256", process.env.APP_SECRET)
    .update(`auth-email-minute:${aliceEmail}:127.0.0.21`)
    .digest("hex");
  checkDb(
    await db
      .from("rate_limits")
      .update({ expires_at: new Date(0).toISOString() })
      .eq("key", cooldownKey),
  );
  await pause(1200);
  await post(alice, "auth", { action: "resend", email: aliceEmail });
  const verify = await alice.get(await mailLink(aliceEmail));
  assert(verify.url().endsWith("/dashboard"));
  const empty = await (await alice.get("/dashboard")).text();
  assert(empty.includes("Your first fresh start awaits."));
  assert(!empty.includes("Your next visit"));
  const profile = checkDb(
    await db.from("profiles").select("id").eq("email", aliceEmail).single(),
  );
  assert.equal(
    checkDb(await db.from("profiles").select("id").eq("email", aliceEmail))
      .length,
    1,
  );
  await post(bob, "auth", {
    action: "signup",
    name: "Bob Local QA",
    email: bobEmail,
    password,
  });
  await bob.get(await mailLink(bobEmail));
  console.log(
    "PASS signup, verification, resend cooldown, unique profiles and protected access",
  );

  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7);
  const input = {
    serviceId: "regular",
    address: "1 Local Test Road",
    postcode: "SW1A 1AA",
    date: date.toISOString().slice(0, 10),
    windowId: "flexible",
    propertyType: "flat",
    propertyDetails: "Two bedrooms, one bathroom",
    notes: "Local verification request only.",
    idempotencyKey: randomUUID(),
  };
  const [first, repeat] = await Promise.all([
    post(alice, "requests", input),
    post(alice, "requests", input),
  ]);
  assert.equal(first.booking.id, repeat.booking.id);
  assert.equal(first.booking.status, "pending_confirmation");
  assert.equal(first.booking.customer_id, profile.id);
  assert.equal(first.booking.quote.totalPence, null);
  const id = first.booking.id;
  await post(alice, "requests", { ...input, notes: "different" }, 409);
  const refreshed = await (await alice.get("/dashboard")).text();
  assert(refreshed.includes(id));
  assert(refreshed.includes("Awaiting confirmation"));
  const foreignDetail = await bob.get(`/dashboard/requests/${id}`);
  const foreignHtml = await foreignDetail.text();
  assert(
    foreignDetail.status() === 404 ||
      foreignHtml.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
  );
  assert(!foreignHtml.includes(input.address));
  const bobRows = await (await bob.get("/api/bookings")).json();
  assert(!JSON.stringify(bobRows).includes(id));
  for (const field of ["customer_id", "status", "cleaner_id", "role"])
    await post(alice, "requests", { ...input, [field]: "tampered" }, 400);
  await post(
    alice,
    `bookings/${id}/action`,
    { action: "confirm", revision: 1 },
    403,
  );
  await post(
    bob,
    `bookings/${id}/action`,
    { action: "cancel", revision: 1 },
    404,
  );
  await post(
    alice,
    "account/profile",
    { full_name: "Alice Local QA", phone: "", role: "staff" },
    400,
  );
  await post(alice, "account/profile", {
    full_name: "Alice Local QA",
    phone: "07000000000",
  });
  await post(alice, "account/address", {
    label: "Local QA home",
    address: input.address,
    postcode: input.postcode,
  });
  const address = checkDb(
    await db
      .from("addresses")
      .select("id")
      .eq("customer_id", profile.id)
      .single(),
  );
  await post(
    bob,
    "account/address",
    {
      id: address.id,
      label: "Hijack",
      address: "2 Other Test Road",
      postcode: input.postcode,
    },
    404,
  );
  await post(bob, "account/address/delete", { id: address.id }, 404);
  assert(
    (await (await alice.get("/dashboard/profile")).text()).includes(
      "Local QA home",
    ),
  );
  const direct = createClient(supabaseUrl, publicKey, {
    auth: { persistSession: false },
  });
  checkDb(
    await direct.auth.signInWithPassword({ email: aliceEmail, password }),
  );
  assert(
    (await direct.from("bookings").update({ status: "confirmed" }).eq("id", id))
      .error,
  );
  assert(
    (await direct.from("staff_members").insert({ user_id: profile.id })).error,
  );
  assert(
    (
      await direct.rpc("submit_cleaning_request", {
        p_actor: profile.id,
        p_key: randomUUID(),
        p_draft: first.booking.draft,
      })
    ).error,
  );
  console.log(
    "PASS request persistence, concurrent duplicate protection, two-customer isolation, profile/address and tampering rejection",
  );

  const saved = await post(
    visitor,
    "contact",
    {
      kind: "contact",
      name: "Contact Local QA",
      email: aliceEmail,
      phone: "",
      company: "",
      postcode: "",
      subject: "Local verification",
      message:
        "Controlled local contact test. No external email should be sent.",
      website: "",
      idempotencyKey: randomUUID(),
    },
    202,
  );
  assert.equal(saved.saved, true);
  assert.equal(saved.emailStatus, "failed");
  const outbox = checkDb(
    await db
      .from("notifications")
      .select("recipient,reply_to,status,error")
      .eq("submission_id", saved.reference)
      .single(),
  );
  assert.equal(outbox.recipient, "rose.cleaning.uk@icloud.com");
  assert.equal(outbox.reply_to, aliceEmail);
  assert.equal(outbox.status, "failed");
  assert(outbox.error);
  assert.equal(
    checkDb(await direct.from("submissions").select("id")).length,
    0,
  );
  console.log(
    "PASS durable contact failure, fixed owner recipient, customer Reply-To and private submissions (no external send)",
  );

  await post(alice, "auth", { action: "logout" });
  await expectRedirect(
    await alice.get("/dashboard", { maxRedirects: 0 }),
    "/login",
  );
  await post(alice, "auth", { action: "login", email: aliceEmail, password });
  const restored = await request.newContext({
    baseURL: origin,
    storageState: await alice.storageState(),
  });
  contexts.push(restored);
  assert.equal((await restored.get("/dashboard")).status(), 200);
  await expectRedirect(
    await restored.get("/login", { maxRedirects: 0 }),
    "/dashboard",
  );
  const recovery = await client("127.0.0.24");
  await post(recovery, "auth", { action: "forgot", email: aliceEmail });
  await pause(1200);
  const recoveryPage = await recovery.get(await mailLink(aliceEmail));
  assert(recoveryPage.url().includes("/reset-password"));
  const newPassword = `Rose-reset-${randomBytes(18).toString("hex")}`;
  await post(recovery, "auth", { action: "reset", password: newPassword });
  await post(recovery, "auth", { action: "logout" });
  await post(
    recovery,
    "auth",
    { action: "login", email: aliceEmail, password },
    400,
  );
  await post(recovery, "auth", {
    action: "login",
    email: aliceEmail,
    password: newPassword,
  });
  console.log(
    "PASS session restoration, logout, authenticated redirects and password recovery/reset",
  );
  await mkdir(".local/customer-stage", { recursive: true });
  await writeFile(
    ".local/customer-stage/preview-account.json",
    JSON.stringify(
      { email: aliceEmail, password: newPassword, requestId: id },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  await writeFile(
    ".local/customer-stage/connected-results.json",
    JSON.stringify(
      {
        passed: true,
        completedAt: new Date().toISOString(),
        externalEmailSent: false,
        requestId: id,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS connected integration suite. Local preview account saved privately in .local/customer-stage.",
  );
} finally {
  await Promise.all(contexts.map((c) => c.dispose()));
}
