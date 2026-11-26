import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// This suite never creates accounts, sends mail, or changes business settings.
// Destructive/demo journeys stay in playwright.config.ts against localhost.
export default defineConfig({
  testDir: "./tests/production",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90000,
  expect: { timeout: 15000 },
  outputDir: "test-results/production",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/production" }],
    ["json", { outputFile: "test-results/production-results.json" }],
  ],
  use: {
    baseURL: "https://rosecleaning.uk",
    ignoreHTTPSErrors: false,
    // Authentication cookies/passwords must not enter trace artifacts.
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [{
    name: "production-chrome",
    use: {
      ...devices["Desktop Chrome"],
      channel: existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
        ? "chrome" : undefined,
    },
  }],
});
