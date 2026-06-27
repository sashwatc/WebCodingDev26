// Slides 13 & 14 — Claim flow (auth-gated) + the student recovery dashboard.
// Confirms the claim form is reachable only when signed in, and that the student
// dashboard surfaces their active recovery work.
import { test, expect, loginAs, visit } from "./helpers.js";

test("claim form is gated behind sign-in", async ({ page }) => {
  // Signed out: the claim route should not render the ownership-proof form.
  await visit(page, "/ClaimItem?id=found_001");
  await expect(page.getByText(/belongs to you/i)).toHaveCount(0, { timeout: 10_000 });
});

test("signed-in student can open the claim form", async ({ page }) => {
  await loginAs(page, "student");
  await visit(page, "/ClaimItem?id=found_001");
  // Claim page title from the app: "Verify that this item belongs to you."
  await expect(page.getByText(/belongs to you/i)).toBeVisible({ timeout: 10_000 });
});

test("student recovery dashboard loads", async ({ page }) => {
  await loginAs(page, "student");
  await visit(page, "/UserDashboard");
  await expect(page.getByText(/My Dashboard|Dashboard/i).first()).toBeVisible({ timeout: 10_000 });
});
