// Shared helpers for the Lost Then Found end-to-end suite.
//
// Authentication uses the application's own demo-identity mechanism: the app
// stores the signed-in user under the `findback-auth-user` localStorage key and
// attaches it as the `X-Demo-User-Email` header on API calls. Seeding that key
// before the app boots signs the test in as the chosen role, exactly the way the
// in-app demo sign-in buttons do.
import { test as base, expect } from "@playwright/test"; // Base Playwright test + assertion library (re-exported below).

// Canonical demo identities, one per role. Shapes match what the app writes to
// localStorage on sign-in, so seeding one here impersonates that user/role.
export const ROLES = {
  student: { full_name: "Jordan Kim", email: "jordan.kim@pleasantvalley.edu", role: "student" },
  staff: { full_name: "Demo Staff", email: "staff.demo@pleasantvalley.edu", role: "staff" },
  admin: { full_name: "Avery Patel", email: "avery.patel@pleasantvalley.edu", role: "admin" },
};

// Sign in as a role by seeding the demo identity before any app script runs.
export async function loginAs(page, role) {
  const user = ROLES[role];
  if (!user) throw new Error(`Unknown role: ${role}`); // Guard against typos in the role name.
  // addInitScript runs in the page BEFORE the app's JS, so the auth key exists
  // by the time the app boots and reads it (no UI sign-in flow needed).
  await page.addInitScript((u) => {
    window.localStorage.setItem("findback-auth-user", JSON.stringify(u));
  }, user);
}

// Navigate to a HashRouter route and wait for the SPA to settle.
export async function visit(page, hash) {
  await page.goto(`/#${hash}`); // HashRouter URLs look like "/#/Home"; baseURL supplies the origin.
  await page.waitForLoadState("domcontentloaded"); // Wait until the DOM is parsed before interacting.
}

// Re-export the base test runner (as `test`) and `expect` so specs import
// everything from this one helper module.
export { base as test, expect };
