import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3005",
    trace: "retain-on-failure",
    screenshot: "on",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        },
        channel: existsSync(
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        )
          ? "chrome"
          : undefined,
      },
    },
  ],
  webServer: {
    command:
      "APP_MODE=demo NEXT_PUBLIC_SITE_URL=http://localhost:3005 npm run dev -- --port 3005",
    url: "http://localhost:3005/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
