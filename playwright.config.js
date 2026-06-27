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
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
