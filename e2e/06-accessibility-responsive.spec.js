// Slides 20 & 21 — Accessibility + responsive layout.
// Confirms the skip-to-main link and an ARIA live region exist, and that the
// layout has no horizontal overflow on a phone viewport.
import { test, expect, visit } from "./helpers.js";

test("skip-to-main link is present", async ({ page }) => {
  await visit(page, "/Home");
  await expect(page.getByRole("link", { name: /skip to main content/i })).toBeAttached({ timeout: 10_000 });
});

test("an ARIA live region exists for dynamic announcements", async ({ page }) => {
  await visit(page, "/Home");
  await expect(page.locator("[aria-live]").first()).toBeAttached({ timeout: 10_000 });
});

test("no horizontal overflow on a phone viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 780 });
  await visit(page, "/Home");
  await expect(page.getByText(/Lost Then Found/i).first()).toBeVisible({ timeout: 10_000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(4);
});
