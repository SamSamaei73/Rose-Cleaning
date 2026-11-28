import { describe, expect, it, vi } from "vitest";
import { leaseScene } from "./scene-budget";
import { loadingProgress, LOADING_THRESHOLD_MS } from "./loading-progress";
import { navigationProgress } from "./navigation-progress";

describe("cleaning scene budget", () => {
  it("suspends the decorative scene during loading and resumes it on cleanup", () => {
    const companion = vi.fn(),
      loading = vi.fn();
    const background = leaseScene(0, companion),
      foreground = leaseScene(1, loading);
    try {
      background.setEligible(true);
      expect(companion).toHaveBeenLastCalledWith(true);
      foreground.setEligible(true);
      expect(companion).toHaveBeenLastCalledWith(false);
      expect(loading).toHaveBeenLastCalledWith(true);
      foreground.release();
      expect(loading).toHaveBeenLastCalledWith(false);
      expect(companion).toHaveBeenLastCalledWith(true);
      background.setEligible(false);
      expect(companion).toHaveBeenLastCalledWith(false);
    } finally {
      foreground.release();
      background.release();
    }
  });
  it("animates at most one of several visible loading indicators", () => {
    const first = vi.fn(),
      second = vi.fn();
    const a = leaseScene(1, first),
      b = leaseScene(1, second);
    try {
      a.setEligible(true);
      b.setEligible(true);
      expect(first).toHaveBeenLastCalledWith(true);
      expect(second).toHaveBeenLastCalledWith(false);
      a.setEligible(false);
      expect(first).toHaveBeenLastCalledWith(false);
      expect(second).toHaveBeenLastCalledWith(true);
    } finally {
      a.release();
      b.release();
    }
  });
});

describe("history navigation feedback", () => {
  it("waits for the destination commit and cancels superseded traversals", async () => {
    vi.useFakeTimers();
    try {
      navigationProgress.start("/dashboard");
      await vi.advanceTimersByTimeAsync(LOADING_THRESHOLD_MS);
      expect(loadingProgress.snapshot()).not.toBeNull();
      navigationProgress.commit("/login");
      await Promise.resolve();
      expect(loadingProgress.snapshot()).not.toBeNull();
      navigationProgress.start("/contact");
      navigationProgress.commit("/dashboard");
      await Promise.resolve();
      expect(loadingProgress.snapshot()).not.toBeNull();
      navigationProgress.commit("/contact");
      await Promise.resolve();
      expect(loadingProgress.snapshot()).toBeNull();
    } finally {
      navigationProgress.cancel();
      await Promise.resolve();
      vi.useRealTimers();
    }
  });
});

describe("global loading overlay lifecycle", () => {
  it("never opens for a fast request and cancels the pending threshold", async () => {
    vi.useFakeTimers();
    const finish = loadingProgress.begin("fast", "Saving…");
    try {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(LOADING_THRESHOLD_MS - 1);
      expect(loadingProgress.snapshot()).toBeNull();
      finish();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(1000);
      expect(loadingProgress.snapshot()).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      finish();
      await Promise.resolve();
      vi.useRealTimers();
    }
  });
  it("shares one overlay across concurrent requests and clears immediately after the last", async () => {
    vi.useFakeTimers();
    const first = loadingProgress.begin("first", "Saving…", 2);
    const second = loadingProgress.begin("second", "Opening…", 1);
    try {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(LOADING_THRESHOLD_MS);
      expect(loadingProgress.snapshot()?.label).toBe("Saving…");
      first();
      await Promise.resolve();
      expect(loadingProgress.snapshot()?.label).toBe("Opening…");
      second();
      await Promise.resolve();
      expect(loadingProgress.snapshot()).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      first();
      second();
      await Promise.resolve();
      vi.useRealTimers();
    }
  });
  it("does not blink or restart the threshold during a navigation-to-route handoff", async () => {
    vi.useFakeTimers();
    const stopLink = loadingProgress.begin("link", "Opening…", 1);
    let stopRoute = () => {};
    try {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(LOADING_THRESHOLD_MS);
      stopLink();
      stopRoute = loadingProgress.begin("route", "Preparing…", 3);
      await Promise.resolve();
      expect(loadingProgress.snapshot()?.label).toBe("Preparing…");
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      stopLink();
      stopRoute();
      await Promise.resolve();
      vi.useRealTimers();
    }
  });
  it("ignores stale cleanup when an operation is replaced", async () => {
    vi.useFakeTimers();
    const stale = loadingProgress.begin("same", "Previous…");
    const current = loadingProgress.begin("same", "Current…");
    try {
      stale();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(LOADING_THRESHOLD_MS);
      expect(loadingProgress.snapshot()?.label).toBe("Current…");
    } finally {
      current();
      await Promise.resolve();
      vi.useRealTimers();
    }
  });
});
