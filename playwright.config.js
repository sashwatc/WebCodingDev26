import { defineConfig, devices } from "@playwright/test";

// End-to-end test configuration for Lost Then Found.
//
// PREREQUISITE: the Spring Boot backend must be running on http://localhost:8080
// with seeded demo data, e.g. from the backend repo:
//   SPRING_PROFILES_ACTIVE=local SEED_DATA_ENABLED=true ./mvnw spring-boot:run
//
// The frontend dev server is started automatically by the `webServer` block
// below (or reused if it is already running), so `npm run test:e2e` is enough
// once the backend is up.
export default defineConfig({
  testDir: "./e2e", // Folder containing the *.spec.js test files.
  fullyParallel: true, // Run tests within files concurrently for speed.
  forbidOnly: !!process.env.CI, // Fail the run if a stray `test.only` is committed (CI only).
  retries: 1, // Retry a failing test once to absorb flaky network/UI timing.
  reporter: [["list"], ["html", { open: "never" }]], // Console "list" output + an HTML report (don't auto-open browser).
  timeout: 30_000, // Per-test timeout: 30s.
  expect: { timeout: 10_000 }, // Per-assertion auto-wait timeout: 10s.
  use: {
    baseURL: "http://localhost:5173", // Relative page.goto() paths resolve against the dev server.
    trace: "on-first-retry", // Capture a full Playwright trace only when a test is being retried.
    screenshot: "only-on-failure", // Save a screenshot just for failing tests.
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }], // Single browser target: desktop Chrome.
  // Auto-start (or reuse) the Vite dev server before running tests.
  webServer: {
    command: "npm run dev", // How to launch the frontend.
    url: "http://localhost:5173", // Wait until this URL responds before starting tests.
    reuseExistingServer: true, // Reuse an already-running dev server instead of spawning a new one.
    timeout: 60_000, // Allow up to 60s for the server to come up.
  },
});
