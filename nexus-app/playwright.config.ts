import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the NEXUS web app.
 *
 * Prerequisites: the full stack must be running and reachable at E2E_BASE_URL
 * (default http://localhost:3000) together with the API — e.g. `docker compose up -d`
 * from the repo root, or `npm run dev` (web) + `php artisan serve` (api).
 *
 * Run:  npm run e2e:install   # one-time: download the Chromium browser
 *       npm run e2e
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  // The dev API (`php artisan serve`) is single-threaded and streams chat
  // responses, so run tests one at a time to avoid request contention.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    headless: true,
    actionTimeout: 15_000,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
