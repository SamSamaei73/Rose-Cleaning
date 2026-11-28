import { afterEach, describe, expect, it, vi } from "vitest";
import { api, API_TIMEOUT_MS } from "./api";
import { loadingProgress, LOADING_THRESHOLD_MS } from "./loading-progress";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("API waiting and recovery", () => {
  it("aborts a stalled request and releases the overlay and timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );
    const result = expect(api("stalled")).rejects.toThrow(
      "The request timed out",
    );
    await vi.advanceTimersByTimeAsync(LOADING_THRESHOLD_MS);
    expect(loadingProgress.snapshot()).not.toBeNull();
    await vi.advanceTimersByTimeAsync(API_TIMEOUT_MS);
    await result;
    expect(loadingProgress.snapshot()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("keeps validation details and clears failed operations", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: "Choose an arrival window.", details: { field: "date" } },
            { status: 400 },
          ),
        ),
    );
    await expect(api("bookings", {})).rejects.toMatchObject({
      message: "Choose an arrival window.",
      details: { field: "date" },
    });
    await Promise.resolve();
    expect(loadingProgress.snapshot()).toBeNull();
  });
  it("handles an HTML error response without leaking a JSON parsing error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("Unavailable", {
            status: 503,
            headers: { "content-type": "text/html" },
          }),
        ),
    );
    await expect(api("unavailable")).rejects.toThrow(
      "We couldn’t complete that request",
    );
    await Promise.resolve();
    expect(loadingProgress.snapshot()).toBeNull();
  });
});
