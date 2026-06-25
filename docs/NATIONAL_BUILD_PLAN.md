# Lost Then Found — National Competitor Build Plan

Last updated: 2026-06-24
Scope: turn the current `WebCodingDev26` (Vite/React frontend) and `WebCodingDev26Backend` (Spring Boot/MongoDB) projects into a polished, reliable NLC Website Coding & Development submission.

This plan was written **after** a thorough inspection of both repos and **before** significant changes. It serves as the contract for what changes, what stays, and what gets cut.

---

## 1. Current Architecture (as found)

### Frontend (Vite + React 18 + TanStack Query + Tailwind + Radix)

- HashRouter with 23 routes; all public pages inside a single `PublicLayout`.
- A 3,300-line `src/api/appClient.js` that:
  - Mirrors the entire MongoDB schema in localStorage (`findback-app-db-v2`).
  - Calls the Spring backend at `/api/...` only when `VITE_API_URL` is set.
  - On 404 / 5xx / network errors, silently falls back to localStorage + seed data.
  - Exposes entity APIs (`FoundItem`, `LostReport`, `Claim`, `Notification`, `AuditLog`, `User`, `EventHub`, `CampusZone`, `ReturnPass`, `ProofVault`, `RecoveryCase`, `RecoveryMission`, `Custody`, `PartnerRelay`, `Sentinel`, `RecoveryPulse`, `Asset`) and a `recoveryMesh` group.
- "Auth" is theatre: `ADMIN_ACCESS_PASSWORD = "PVHS-Admin-2026"` is a hardcoded string; only `X-Demo-User-Email` is sent to the backend.
- `AuthProvider` (`src/lib/AuthContext.jsx`) stores user in `findback-auth-user` and admin grant in `findback-admin-access`.
- Visual system already leans clean (slate-200 borders, navy primary, no neon in production components), but contains unused decoration: `web-gl-shader.jsx`, `liquid-glass-button.jsx`, `neon-button.tsx`, `slide-button.tsx`, `demo.tsx`, `ShaderDemo.jsx`, `background-paths.tsx`'s `FloatingPaths` used only on Home.

### Backend (Spring Boot 4.1 + Java 21 + MongoDB)

- 25 controllers, ~30 services, 17 repositories, 18 MongoDB documents.
- All JSON is snake_case via Jackson config.
- Auth = `X-Demo-User-Email` header; admin iff the persisted user has `role=admin` or the email equals `ADMIN_EMAIL`. No JWT, no Spring Security on classpath.
- Production-grade primitives already exist:
  - `CustodyLedgerService` with SHA-256 chain (`previousEventHash` → `eventHash`) on `CustodyEvent`.
  - `ProofVaultService` with admin-only evidence review and token-overlap scoring.
  - `ReturnPassService` (2-day expiry, 6-digit one-time code, Base64url token, redemption tracking).
  - `LossSentinelService` (3-recent + 2-baseline + 2× spike rule; real Lost-Report analysis).
  - `RecoveryPulseDispatcher` with mock/live provider support (email/SMS/webhook/in-app).
  - `DemoScenarioService` with four prebuilt templates (`airpods_gym`, `gym_electronics_pattern`, `library_water_bottle`, `custom`).
  - `MatchmakingService` with local scoring + optional OpenAI-compatible blend.
- Mongo seed runs only when `SEED_DATA_ENABLED=true` and collection is empty.
- Existing tests (40-ish) cover happy paths and key privacy rules via `RecoveryMeshRulesTest`.

### The wiring gap

The frontend's `appClient.js` was written for a hypothetical older backend shape; many call paths don't actually align with what the Spring backend exposes. In practice the frontend today runs against the localStorage mirror, not Spring.

---

## 2. Features Already Complete (no work needed)

These work today, in code if not always in flow:

- Found Items CRUD with public/private filtering and admin-only full record access.
- Lost Reports CRUD with `matched_items` advisory suggestions.
- Claims CRUD with status workflow (`submitted`, `under_review`, `need_more_info`, `approved`, `rejected`, `completed`).
- Custody Ledger (SHA-256 chain, admin move, public verify).
- Proof Vault (admin review, hidden clues, no public exposure).
- Return Pass (create/verify/redeem/reminder).
- Pickup Station (admin-gated verify-then-redeem).
- Recovery Center summary (`/api/admin/recovery-center`).
- Loss Sentinel (real-data pattern review; returns `not_enough_data` when thresholds aren't met).
- Event Hubs + Campus Zones + Display Feed.
- Notification Preferences + Recovery Pulse delivery records.
- Demo Scenario templates (creates real Mongo records with `is_demo: true`).
- Asset Registry lookup by tag.
- Partner Relay (public-redacted summaries).
- Health endpoint (`GET /api/health`).
- Seed data via `SeedDataConfig` (zones, asset records, hubs, items, reports, claims, cases, passes, nodes, relays, custody events, notifications, audit log, users).

## 3. Broken or Fake Features Found

These are **misleading** and must be fixed or removed:

1. **Hardcoded admin password** in source — anyone with read access can sign in as admin. Replaced with real backend authorization.
2. **`findback-app-db-v2` localStorage mirror** — every endpoint has a silent localStorage fallback. This makes bugs invisible: a backend failure looks like success because the seed data answers. We keep this *only* for offline-tolerant public reads of Found Items during dev; admin mutations always go to the backend.
3. **Decorative UI imports** that ship in `dist` but are never used: `web-gl-shader.jsx`, `liquid-glass-button.jsx`, `neon-button.tsx`, `slide-button.tsx`, `demo.tsx`, `ShaderDemo.jsx`. They inflate bundle size and signal "AI-startup" noise. Delete from imports and routes.
4. **`FloatingPaths` background on Home** — decorative SVG. Replaced by a calm hero.
5. **Fake QR** in `RecoveryLinkCode` — deterministic dot pattern, not a real QR. Honest copy or replaced with a real `qrcode`-style helper (we'll keep the visual but rename it to "Recovery Link" with copy-button as the manual fallback).
6. **`canvas-confetti` import** with no trigger — remove from entry bundle.
7. **Frontend auth state is not bound to backend identity** — we sign in client-side, set localStorage, and tell the backend our email. There is no signed token, no JWT verification on the backend. Backend has no `JWT_SECRET` plumbing.
8. **`recoveryMeshUsesLocalData` flag** — quiet fallback flag that hides backend failures. Made loud: surfaced as a banner instead of silently masking failures.
9. **Case Messages exist only in Appwrite, which isn't wired up.** We'll persist them in Spring with a `CaseMessage` Mongo collection (added in this build).
10. **Recovery Center + Pattern Review counts** appear to come from real backend data, but the frontend's tab renderings read from a mix of stale query data and seed snapshots. We rewire them strictly to backend queries with loading/empty/error states.
11. **"AI" feature services** (`src/lib/ai-services.js`) are deterministic keyword overlap — labelled honestly as "local heuristic" rather than AI.
12. **Display page** uses an 8-second rotation with reduced-motion handling — kept; the only risk is hidden behind admin-only display feed already verified.
13. **Item rating system** with star widgets exists in frontend but is mostly stubbed; preserved as a deferred feature (not in NLC demo route).

## 4. Files That Will Change

### Frontend (high-churn)

| File | Change |
|---|---|
| `src/App.jsx` | Convert `path="/X"` casing → match path (`/Home` → `/home`); add `/event/:eventHubId?`, `/beacon/:zoneId?` semantics; remove `/ShaderDemo`. |
| `src/api/appClient.js` | Replace with `src/api/client.ts` that talks to Spring Boot via `VITE_API_URL`. No localStorage mirror. localStorage remains only for auth session + admin grant cache. |
| `src/lib/AuthContext.jsx` | Use Appwrite email/password + Google OAuth + JWT. Send `Authorization: Bearer <jwt>` to backend. Backend falls back to `X-Demo-User-Email` if no JWT. |
| `src/components/auth/SignInDialog.jsx` | Add email/password with strength feedback; Google OAuth button; Appwrite error display. |
| `src/components/auth/AdminAccessDialog.jsx` | Replace password prompt with "Signed-in admin user gets admin access automatically." |
| `src/components/auth/AdminRouteGuard.jsx` | Server-side admin check (via `GET /api/auth/me` returning `role`). |
| `src/pages/Home.jsx` | Search-first hero with input + Report Lost/Found buttons + "Recently found" small list (real backend data). |
| `src/pages/Search.jsx` | Streamlined: input + small filter chips + grid. Less visual weight. |
| `src/pages/ReportFound.jsx`, `ReportLost.jsx`, `ClaimItem.jsx` | Wire to real backend; show real toasts; honest loading/empty states. |
| `src/pages/ItemDetails.jsx` | Public-safe view. Hidden Proof Vault UI surfaced only for admin. |
| `src/pages/UserDashboard.jsx` | Real notifications + recovery cases from backend. |
| `src/pages/AdminDashboard.jsx` | Real Recovery Center + Sentinel data; new "Demo Scenarios" tab; no fabricated stats. |
| `src/pages/PickupPass.jsx`, `PickupStation.jsx` | Real Return Pass lifecycle with success/expired/redeemed/cancelled states. |
| `src/pages/EventHub.jsx`, `Beacon.jsx`, `Display.jsx` | Backend-driven; copyable URL + manual QR fallback; no GPS claim. |
| `src/components/ui/*` | Keep what we use; delete unused decorative ones. |
| `src/components/shared/PhotoUploader.jsx` | Crop + rotate + resize before upload; type + size validation; progress + failure states. |
| `src/index.css` + `tailwind.config.js` | Tighter palette tokens; remove unused animation keyframes. |
| `src/lib/ai-services.js` | Rename to `src/lib/localMatch.js`; honest local heuristic; not labelled AI. |

### Frontend (new files)

| File | Purpose |
|---|---|
| `src/api/client.ts` | Real fetch client with `Authorization` header. |
| `src/api/cases.ts`, `src/api/messages.ts`, `src/api/returnPasses.ts`, etc. | Thin wrappers around endpoints. |
| `src/components/admin/DemoScenarioBuilder.jsx` | UI for `DemoScenarioService` templates. |
| `src/components/messages/CaseThread.jsx` | Threaded case messages UI. |
| `src/components/admin/EvidenceReviewPanel.jsx` | Admin evidence review using `ProofVaultService`. |
| `src/components/upload/ImageCropper.jsx` | Crop/rotate/resize modal. |
| `src/components/layout/PvhsFrontDeskShell.jsx` | Common page chrome (header strip, breadcrumb, footer). |

### Backend (changes)

| File | Change |
|---|---|
| `pom.xml` | Add `spring-boot-starter-security`, `jjwt-api/impl/jackson`, `com.appwrite:java-sdk`, `org.bouncycastle:bcprov-jdk18on` (already transitive). |
| `config/SecurityConfig.java` (new) | JWT filter chain; permit `/api/health`, `/api/items`, `/api/items/{id}`, `/api/auth/signin`, `/appwrite-config.js`, `/api/campus-zones`, `/api/event-hubs`, `/api/event-hubs/{id}`, `/api/event-hubs/{id}/display-feed`, `/api/partner-relays`, `/api/recovery-nodes`. Everything else requires auth. Admin routes require `role=admin` server-side. |
| `service/JwtService.java` (new) | Mint + verify HS256 JWTs from Appwrite-issued session JWT (configurable secret). |
| `controller/AppwriteAuthController.java` (new) | `POST /api/auth/appwrite-session` accepts a verified Appwrite session JWT, returns our backend JWT. |
| `controller/CaseMessageController.java` (new) | `GET/POST /api/claims/{claimId}/messages` — only admin + claimant can read; notify on new. |
| `model/CaseMessage.java` (new) | Mongo document for case messages. |
| `service/CaseMessageService.java` (new) | Persist + notify. |
| `service/AuthService.java` | Accept either JWT bearer or `X-Demo-User-Email` (dev fallback). |
| `service/DemoAuthorizationService.java` | Use the resolved principal (JWT or header). |
| `exception/GlobalExceptionHandler.java` | Add 401/403 entries for `AuthenticationException`/`AccessDeniedException`. |
| `config/SeedDataConfig.java` | Add `case_messages` collection seed; expose `/api/admin/demo/cleanup` for selective demo removal. |
| `application.properties` | Add `app.jwt.secret`, `app.jwt.issuer=lostthenfound`, `app.auth.appwrite.project`, `app.auth.appwrite.api-key`, `app.auth.demo-fallback-enabled=true`. |

### Docs (rewrites)

| File | Change |
|---|---|
| `docs/NATIONAL_BUILD_PLAN.md` | This file. |
| `docs/ARCHITECTURE.md` | New: system diagram, data model relationships, security boundaries. |
| `docs/NLC_DEMO_SCRIPT.md` | New: 2-4 minute judge demo route with exact clicks. |
| `docs/NLC_WEB_READINESS.md` | New: rubric evidence + accessibility + browser matrix + tests run. |
| `README.md` (both repos) | Updated with deployment steps, env templates, demo accounts. |

---

## 5. Migration Risks

1. **Auth refactor** — replacing a client-only "auth" with Appwrite + JWT requires the project owner to provide Appwrite project ID + API key. We make Appwrite **optional** with a documented local-dev fallback that uses the existing demo accounts + `X-Demo-User-Email` header.
2. **Backend CORS** — currently permits `localhost:5173`, `localhost:4173`, `${FRONTEND_URL}`. We must add the deployed Vercel origin.
3. **Frontend bundle size** — replacing the 3,300-line `appClient.js` with thin typed clients + new components must not blow past 1.5 MB. We delete unused decorative UI to compensate.
4. **Photo upload** — backend stores data URLs in the DB today (≤2 MB cap). Real cropping can produce larger images; we keep ≤2 MB and downscale before upload.
5. **Mongo seed vs. existing data** — `SEED_DATA_ENABLED=true` skips when collections are non-empty. We must not run with that flag on a deployed DB with real user data.
6. **JWT secret rotation** — using a single `app.jwt.secret` works for dev + Render. Production should rotate via env.
7. **Pattern Review thresholds** — Sentinel returns `not_enough_data` until ≥3 recent + ≥2 baseline + 2× spike. Demo scenario `gym_electronics_pattern` creates enough reports to satisfy this; documented in the demo script.
8. **WebCrypto availability** — JWT signing requires it; covered by default browsers. SSR pre-render fallback uses `Buffer` (Node-only) — we don't SSR.
9. **Existing demo password "PVHS-Admin-2026"** — used by judges who already practiced. We keep a `LOCAL_DEMO_PASSWORD` env-gated fallback in the frontend's `SignInDialog` (one-time setup wizard) for offline demos where Appwrite isn't reachable, but document this as dev-only.
10. **No `@Transactional` boundaries in current backend** — we add `@Transactional` on `CustodyLedgerService.move`, `ReturnPassService.redeem`, `RecoveryCaseService.markReturned` to avoid partial state.

---

## 6. Phased Checklist

- [x] Phase 0 — Inspect and create this plan.
- [ ] Phase 1 — Search-first UI + simplified visual system.
- [ ] Phase 2 — Connect frontend to Spring Boot backend; fix every flow.
- [ ] Phase 3 — Appwrite auth + backend authorization (with documented dev fallback).
- [ ] Phase 4 — Proof Vault + Case Messages.
- [ ] Phase 5 — Return Pass + Pickup Station polish.
- [ ] Phase 6 — Event Hub + Beacon.
- [ ] Phase 7 — Image cropping + validation.
- [ ] Phase 8 — Accessibility + responsive + browser QA.
- [ ] Phase 9 — Demo Scenario Builder admin tool.
- [ ] Phase 10 — Deployment configuration.
- [ ] Phase 11 — Tests + docs.
- [ ] Phase 12 — Restrained animation.
- [ ] Phase 13 — Optional AI enhancements (only after 0–12 pass).

## 7. What Will Be Removed or Simplified

| Item | Reason |
|---|---|
| `src/components/ui/web-gl-shader.jsx` | Decorative; unused in production flows. |
| `src/components/ui/liquid-glass-button.jsx` | Decorative; unused. |
| `src/components/ui/neon-button.tsx` | Decorative; unused. |
| `src/components/ui/slide-button.tsx` | Decorative; unused. |
| `src/components/ui/demo.tsx` | Decorative; unused. |
| `src/pages/ShaderDemo.jsx` and its route | Showcase page; not in judge demo. |
| `FloatingPaths` on Home | Replaced with calm hero. |
| `ADMIN_ACCESS_PASSWORD` constant | Replaced with backend authorization. |
| `findback-app-db-v2` localStorage mirror | Replaced with real backend calls. Kept only as a session cache, not a data source. |
| `canvas-confetti` import | Unused. |
| Star rating widgets on UserDashboard | Defer to v2 (not in judge route). |
| `react-leaflet` maps (if present in any page) | Not used in NLC demo. |
| 3D `three` import | Not used in production flows. |
| `embla-carousel-react` (kept only where Display uses it) | Otherwise unused. |
| Backend `WorkflowService.legacy` flow (kept; not called) | Marked deprecated, retained for tests. |

## 8. What Will Stay As-Is

- `CustodyLedgerService` SHA-256 chain (already strong; do not regress).
- `RecoveryPulse` event matrix and templates.
- `LossSentinel` thresholds and `not_enough_data` state.
- `MatchmakingService` local + AI blend.
- `DemoScenarioService` four templates.
- Backend DTO records and snake_case Jackson config.
- `GlobalExceptionHandler` shape (`timestamp, status, error, message, path, fieldErrors`).
- All 40-ish backend tests; we add more.
- Accessibility modes (dark / high-contrast / dyslexic) and reduced-motion respect.
- HashRouter (works on any static host without server-side rewrites).

---

## 9. Out of Scope (this sprint)

- Live integrations with PVHS calendar, digital signs, lockers, asset systems.
- Real GPS/indoor positioning for Beacon.
- Push notifications (we use in-app + email/SMS via configured providers).
- Stripe / payment flows (deps present but unused).
- React Leaflet maps.
- i18n beyond English (i18next wired but only English shipped).

---

End of plan.