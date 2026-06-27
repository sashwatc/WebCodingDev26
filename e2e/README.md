# End-to-End Tests — Lost Then Found

Automated browser tests that drive the real running application (frontend + Spring
Boot backend + seeded MongoDB data) the same way a user would: signing in by role,
searching, opening item pages, claiming, and exercising staff/admin tools. Built
with [Playwright](https://playwright.dev/).

These tests verify the recovery journey **as a journey**, across roles — not as
isolated component snapshots.

## What is covered

| File | Maps to slide(s) | Verifies |
|------|------------------|----------|
| `01-access-and-roles.spec.js` | 7 | Sign-in gate; student blocked from moderation; staff get a scoped panel (no governance tabs); admin sees full governance tabs |
| `02-search-discovery.spec.js` | 9 | Seeded inventory is searchable; keyword search narrows to the matching item |
| `03-found-and-item-details.spec.js` | 10, 12 | Found-item report form renders; non-admin item page redacts the finder to "PVHS Staff"; canonical status stepper shows |
| `04-claim-and-recovery.spec.js` | 13, 14 | Claim form is auth-gated; signed-in student can open it; recovery dashboard loads |
| `05-staff-operations.spec.js` | 15, 18 | Staff work queue loads with no authorization error; admin can open the Users governance tab |
| `06-accessibility-responsive.spec.js` | 20, 21 | Skip-to-main link; ARIA live region; no horizontal overflow on a phone viewport |

## How roles are signed in

The app stores the signed-in demo identity in the `findback-auth-user`
localStorage key and sends it as the `X-Demo-User-Email` header on API calls.
`helpers.js` seeds that key before the app boots — the same path the in-app demo
sign-in buttons use. Backend authorization is what actually enforces each role;
these tests confirm the user-visible behavior matches.

## Running

**Prerequisite:** the backend must be running with seeded demo data:

```bash
# from the backend repo (WebCodingDev26Backend)
SPRING_PROFILES_ACTIVE=local SEED_DATA_ENABLED=true ./mvnw spring-boot:run
```

Then, from this (frontend) repo:

```bash
npm install                 # first time only
npx playwright install      # first time only — downloads the browser
npm run test:e2e            # run all tests (starts the dev server automatically)
npm run test:e2e:ui         # run in the interactive Playwright UI
npm run test:e2e:report     # open the HTML report from the last run
```

The frontend dev server is started automatically by Playwright (or reused if it is
already running). All 17 tests run headless in a few seconds.
