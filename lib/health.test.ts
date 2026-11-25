import { afterEach, describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => ({ result: { error: null as unknown } }));
vi.mock("./server/supabase", () => ({
  supabaseAdmin: () => ({
    from: () => ({ select: () => ({ limit: () => ({ abortSignal: async () => query.result }) }) }),
  }),
}));
import { productionReady } from "./server/health";

afterEach(() => { vi.unstubAllEnvs(); query.result = { error: null }; });

function configured() {
  vi.stubEnv("APP_MODE", "connected");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-private-key");
  vi.stubEnv("APP_SECRET", "test-secret-for-readiness-only-123456789");
}

describe("Production readiness", () => {
  it("rejects missing configuration and fictional demo mode", async () => {
    configured();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(await productionReady()).toBe(false);
    configured();
    vi.stubEnv("APP_MODE", "demo");
    expect(await productionReady()).toBe(false);
  });
  it("requires a successful database read", async () => {
    configured();
    expect(await productionReady()).toBe(true);
    query.result = { error: { message: "private database failure" } };
    expect(await productionReady()).toBe(false);
  });
});
