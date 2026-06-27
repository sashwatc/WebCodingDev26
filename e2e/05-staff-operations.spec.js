// Slides 15 & 18 — Staff work queue + admin governance.
// Confirms staff can load the claims/support queues without hitting an
// authorization error, and that an admin can open the Users governance tab and
// see real account records.
import { test, expect, loginAs, visit } from "./helpers.js";

test("staff work queue loads without an authorization error", async ({ page }) => {
  await loginAs(page, "staff");
  await visit(page, "/AdminDashboard");
  // Claims are handled inside the staff Moderation Queue tab.
  await expect(page.getByRole("tab", { name: /Moderation/i })).toBeVisible({ timeout: 10_000 });
  // No raw "Forbidden" / load failure should reach the moderation surface.
  await expect(page.getByText(/Forbidden|Unable to load/i)).toHaveCount(0);
});

test("admin can open the Users governance tab", async ({ page }) => {
  await loginAs(page, "admin");
  await visit(page, "/AdminDashboard");
  await page.getByRole("tab", { name: /^Users$/ }).click();
  // Real seeded accounts are listed by their school email domain.
  await expect(page.getByText(/pleasantvalley\.edu/i).first()).toBeVisible({ timeout: 10_000 });
});
