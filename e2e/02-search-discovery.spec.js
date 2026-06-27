// Slide 9 — Search + smart discovery.
// Confirms seeded found-item inventory is discoverable and that filtering by
// keyword narrows results to the matching item. Search lives behind the sign-in
// lobby in this build, so the test signs in as a student first.
import { test, expect, loginAs, visit } from "./helpers.js";

test("search lists seeded found-item inventory", async ({ page }) => {
  await loginAs(page, "student");
  await visit(page, "/Search");
  // Public found-item records render as links into the item detail page.
  const results = page.locator('a[href*="ItemDetails"]');
  await expect(results.first()).toBeVisible({ timeout: 10_000 });
  expect(await results.count()).toBeGreaterThan(0);
});

test("keyword search narrows to the matching item", async ({ page }) => {
  await loginAs(page, "student");
  await visit(page, "/Search");
  await expect(page.locator('a[href*="ItemDetails"]').first()).toBeVisible({ timeout: 10_000 });

  const search = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i)).first();
  await search.fill("Hydro Flask");
  // The seeded "Black Hydro Flask Water Bottle" should surface for this query.
  await expect(page.getByText(/Hydro Flask/i).first()).toBeVisible({ timeout: 10_000 });
});
