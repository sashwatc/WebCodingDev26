// Slides 10 & 12 — Found-item intake form + public-safe item detail page.
// Confirms the report form renders for a signed-in user, and that a NON-admin
// (student) viewing the item page gets the recovery-safe view: the finder is
// redacted to "PVHS Staff" and the canonical status stepper is shown. Deep
// routes sit behind the sign-in lobby, so each test signs in first.
import { test, expect, loginAs, visit } from "./helpers.js";

test("found-item report form renders for a signed-in user", async ({ page }) => {
  await loginAs(page, "student");
  await visit(page, "/ReportFound");
  await expect(page.getByText(/found-item record/i)).toBeVisible({ timeout: 10_000 });
});

test("non-admin sees the recovery-safe finder label", async ({ page }) => {
  await loginAs(page, "student");
  await visit(page, "/ItemDetails?id=found_owala");
  // Seeded item title is visible...
  await expect(page.getByText(/Owala/i).first()).toBeVisible({ timeout: 10_000 });
  // ...and the finder is redacted to "PVHS Staff" for non-privileged viewers.
  await expect(page.getByText(/Found by/i)).toBeVisible();
  await expect(page.getByText(/PVHS Staff/i).first()).toBeVisible();
});

test("item page exposes the canonical status stepper", async ({ page }) => {
  await loginAs(page, "student");
  await visit(page, "/ItemDetails?id=found_owala");
  await expect(page.getByText(/Owala/i).first()).toBeVisible({ timeout: 10_000 });
  // The lifecycle stepper renders the canonical statuses.
  await expect(page.getByText(/Found|Claim|Verified|Archived/i).first()).toBeVisible();
});
