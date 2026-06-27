// Slide 7 — Secure access + role routing.
// Proves the same identity gate and role-aware routing the presentation claims:
// students are blocked from moderation tools, staff get a scoped panel, and only
// admins see governance tabs. Backend authorization is what actually enforces
// this; these tests confirm the user-visible routing matches.
import { test, expect, loginAs, visit } from "./helpers.js";

test("public home page loads", async ({ page }) => {
  await visit(page, "/Home");
  await expect(page.getByText(/Lost Then Found/i).first()).toBeVisible();
});

test("student is blocked from the admin dashboard", async ({ page }) => {
  await loginAs(page, "student");
  await visit(page, "/AdminDashboard");
  await expect(page.getByText(/Admin access locked/i)).toBeVisible({ timeout: 10_000 });
});

test("staff reach a scoped panel without governance tabs", async ({ page }) => {
  await loginAs(page, "staff");
  await visit(page, "/AdminDashboard");
  // Scoped moderation surface loads (no lock screen, Support queue present)...
  await expect(page.getByText(/Admin access locked/i)).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /Support/i })).toBeVisible({ timeout: 10_000 });
  // ...but admin-only governance tabs are not exposed to staff.
  await expect(page.getByRole("tab", { name: /^Users$/ })).toHaveCount(0);
});

test("admin sees full governance tabs", async ({ page }) => {
  await loginAs(page, "admin");
  await visit(page, "/AdminDashboard");
  await expect(page.getByRole("tab", { name: /Support/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("tab", { name: /^Users$/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^Settings$/ })).toBeVisible();
});
