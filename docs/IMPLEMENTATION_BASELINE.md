# Implementation Baseline

Inspection-only snapshot of `WebCodingDev26` (frontend) and `WebCodingDev26-Backend` (Spring Boot). No behavior was changed. This documents the current state before later implementation phases.

## 1. Frontend Architecture & `appClient` API

**Stack:** React 18, Vite, `HashRouter` (React Router), TanStack Query, Tailwind, Radix UI, Framer Motion, i18next (en/es/fr).

**Entry/flow:** `src/App.jsx` wraps the tree in `ModeProvider → AuthProvider → QueryClientProvider → MotionConfig → Router`. Routes are defined in `App.jsx`; most pages render under `PublicLayout`. `/AdminDashboard` and `/PickupStation` are wrapped in `AdminRouteGuard`. Dialogs `SignInDialog` and `AdminAccessDialog` are mounted globally.

**Pages (`src/pages/`):** Home, Search, LostItems, ReportFound, ReportLost, ItemDetails, ClaimItem, UserDashboard, AdminDashboard, EventHub, Beacon, Display, PickupPass, PickupStation, plus static (About, FAQ, Privacy, Terms, Accessibility, Sources, Documentation, ShaderDemo).

**Data layer — `src/api/appClient.js` (~3,300 lines):** The single API gateway. Per `docs/FRONTEND_BACKEND_INTEGRATION.md`, pages must import only `appClient` (no raw `fetch`/`axios`). Config:
- `VITE_API_URL` (origin only, no `/api`); blank locally → Vite proxies `/api` to `127.0.0.1:8080`.
- `requestApi` helper; admin/signed-in calls attach header `X-Demo-User-Email: <user.email>` (`adminHeaders()`).
- Heavy localStorage seed/cache (`STORAGE_KEY = findback-app-db-v2`) with `shouldUseLocalFallback` fallbacks.

**`appClient` groups (from `createAppClient`):**
- `auth`: `me`, `signIn`, `logout`, `redirectToLogin`, `onAuthStateChange`
- `health`, `items` (found items), `lostReports`, `claims` (+ `approve`/`reject`/`complete` etc.), `matches`, `uploads`
- `recoveryCenter`, `recoveryCases`, `recoveryMissions`, `proofVault`, `returnPasses`, `recoveryPulse`, `sentinel`, `custody`, `campusZones`, `eventHubs`, `assets`, `partnerRelay`
- `entities`: generic CRUD for `FoundItem`, `LostReport`, `Claim`, `Notification`, `AuditLog`
- `recoveryMesh`: compatibility aliases for older pages (has its own local-data mode flag)
- `integrations.Core`: `UploadFile`, `InvokeLLM` (local canned response)

**Auth context (`src/lib/AuthContext.jsx`) at original baseline time:** Custom name+email sign-in and client-side admin gating. This historical finding has since been superseded by Appwrite JWT verification and backend-enforced admin routes; do not reintroduce client-side admin passwords.

## 2. Spring Boot Backend (controllers, services, models, endpoints)

**Stack:** Java 21, Spring Boot 4.1, Spring Web MVC, Bean Validation, Spring Data MongoDB. Package `com.FBLA.WebCodingDev26Backend`.

**Models (`model/`):** `FoundItem`, `LostReport`, `Claim`, `AppUser`, `Notification`, `AuditLog`, `MatchSuggestion`, `RecoveryCase`, `RecoveryMission`, `PreventionAlert`, `NotificationDelivery`, `ReturnPass`, `RecoveryNode`, `PartnerRelay`, `EventRecoveryHub`, `CustodyEvent`, `CampusZone`, `AssetRegistryRecord`, `Rating`, `ItemStatus` (enum: `FOUND`, `CLAIM_PENDING`, `VERIFIED`, `ARCHIVED`).

**Controllers (`controller/`):**
- `HealthController` `/api/health`
- `AuthController` `/api/auth` — `GET /user`, `POST /signin`
- `FoundItemController` `/api/items` — list/get/create/patch/delete
- `AdminFoundItemController` `/api/admin/items`
- `AdminDashboardController` `/api/admin` — dashboard, lost-reports, claims, audit-logs, notifications, claim approve/deny, item archive
- `GenericEntityController` `/api/entities/{entityName}` — generic CRUD
- `MatchmakingController` `/api/matches`
- `RecoveryCaseController` `/api` — recovery-cases + recovery-missions
- `LossSentinelController` `/api/sentinel`
- `RecoveryPulseController` `/api/recovery-pulse` — preferences, notifications, deliveries, admin/test
- `ReturnPassController`, `ProofVaultController`, `CustodyController`, `EventRecoveryController`, `PartnerRelayController`, `AssetController`, `DemoScenarioController` `/api/admin/demo-scenarios/{scenario}`
- `UploadController` `/api/uploads`
- `AppwriteConfigController` `GET /appwrite-config.js`
- `WebRouteController` (Spring MVC forwarding to a static `index.html`)

**Key services:** `AuthService`, `MatchmakingService` (explainable local scorer + optional AI), `RecoveryCaseService`, `LossSentinelService`, `RecoveryPulseDispatcher` + provider chain (Resend email / Twilio SMS / webhook, demo-mode aware), `ReturnPassService`, `DemoScenarioService`, `SeedDataConfig`, `GenericEntityService`, `EmailNotificationService`.

**Tests (`src/test/`, ~40 passing per README):** `ApiIntegrationTests`, `AuthServiceTest`, `MatchmakingServiceTest`, `GenericEntityServiceTest`, `RecoveryMeshRulesTest`, `RecoveryPulseDispatcherTest`, `SeedDataConfigTest`, app context test.

## 3. Workflows: Working vs. Incomplete/Mocked/Stale

**Genuinely backed by Spring Boot endpoints:** found-item browse/detail/CRUD, lost report CRUD (via `/api/entities`), claim submission + admin approve/deny, matchmaking, recovery cases/missions, Loss Sentinel pattern review, Recovery Pulse notifications/deliveries, return passes, custody, event hubs, uploads, demo scenarios, auth signin/lookup.

**Working but with local fallback risk:** Any page reading through `appClient` falls back to seeded localStorage when the backend errors (`shouldUseLocalFallback`). Backend-owned features (Recovery Cases, Sentinel, Pulse, dashboard metrics) are documented to show empty/error states rather than fabricate, but the large `createSeedData()` block + `recoveryMesh` local-data mode means stale demo data can still surface if not carefully gated.

**Appears mocked/disconnected:**
- `integrations.Core.InvokeLLM` returns a canned local response (no real LLM call from frontend).
- `recoveryMesh` is a compatibility shim with its own `useLocalRecoveryMesh` flag — legacy aliasing, candidate for removal.
- Admin authorization is **not enforced** by a real session; it is a client-side password + an `X-Demo-User-Email` header the backend trusts.

## 4. Old Node/Express Assumptions Still Present

- `WebCodingDev26/backend/` is a **stale legacy Express + Mongoose (+ Supabase) server**: `server.js`, `routes/{items,entities,auth,uploads}.js`, `models/Item.js`, `lib/{stores,workflows,dataBackend,supabase,itemMedia}.js`, `data/seed*.js`, local JSON. It duplicates the Spring Boot API and is explicitly called out as legacy in the integration doc.
- Root `WebCodingDev26/server.js`, `supabase/`, and `vercel.json` reflect the old Node/Vercel hosting model.
- README still references `MONGO_URI`/`MONGO_DATABASE` in `.env.local` for "full-stack" runs and an `npm run ts`/`./run` orchestrator that boots the *sibling* Spring Boot backend — Node server is no longer the source of truth.
- `WebCodingDev26-Backend` also contains a `node_modules/`, `package.json`, `package-lock.json` whose `npm run backend`/`npm run dev` just delegate to Maven — leftover Node scaffolding.

## 5. Auth / Appwrite Behavior & Backend Identity Handling

- **React frontend does NOT use Appwrite.** Grep of `src/` finds no Appwrite usage; auth is the custom name+email `appClient.auth` flow.
- **Backend still ships Appwrite plumbing:** `AppwriteConfigController` serves `window.__APPWRITE_CONFIG__`, and the backend README/`WebRouteController` describe a *separate static HTML Appwrite-chat UI* (login/signup/verify-email/OAuth callback, Appwrite Databases chat). This static-UI + Appwrite story is **stale relative to the React app**.
- **Backend identity = trust-the-email:** `AuthService.signIn` upserts an `AppUser` by normalized email and assigns `role = admin` only if the email equals configured `ADMIN_EMAIL` (`avery.patel@pleasantvalley.edu`); everyone else is `student`. No password verification, no token/JWT, no Appwrite session validation. Admin-protected routes rely on the `X-Demo-User-Email` header matching a seeded/known admin — i.e., **demo-grade auth**, not production identity.

## 6. Files Most Likely to Change in Later Phases

Frontend:
- `src/api/appClient.js` (trim local seed/fallback, drop `recoveryMesh`/`InvokeLLM` shims, tighten error states)
- `src/lib/AuthContext.jsx` + `src/components/auth/*` (real auth/admin gating)
- `src/lib/constants.js` (brand/constants; historical client-side admin password removed)
- `WebCodingDev26/backend/**`, root `server.js`, `supabase/`, `vercel.json` (legacy removal)
- README + `docs/FRONTEND_BACKEND_INTEGRATION.md`

Backend:
- `controller/AuthController.java` + `service/AuthService.java` (identity hardening)
- `controller/AppwriteConfigController.java`, `WebRouteController.java`, backend README (reconcile static-UI/Appwrite story)
- `config/SeedDataConfig.java` (seed gating)

## 7. API Contract Mismatches (Frontend ↔ Backend)

1. **Auth model mismatch:** Backend README documents an Appwrite-secured static UI with chat collections; the actual React frontend uses a custom email/name signin with no Appwrite. The two READMEs describe different frontends.
2. **Admin auth is advisory:** Frontend "admin access" is a client password + `X-Demo-User-Email` header; backend trusts the header. No mutual contract for real authorization.
3. **Lost reports/claims via generic entities:** Frontend uses both feature endpoints and `/api/entities/{Entity}`; integration doc marks generic CRUD as legacy/preferred-to-replace, so the contract is split.
4. **Casing:** Backend expects `snake_case`; `appClient` is responsible for normalization — any page bypassing it would break.
5. **Health/data-backend shape:** legacy Express `/api/health` returns `{ok,dataBackend}`; Spring `HealthController` shape should be confirmed against any frontend assumptions.
6. **`InvokeLLM`/matchmaking:** Frontend `InvokeLLM` is local-only while backend `MatchmakingService` has the real (optional AI) scorer — no frontend wiring to backend AI.

## 8. Recommended Implementation Order

1. **Confirm the single source of truth:** standardize on React frontend + Spring Boot backend; reconcile both READMEs.
2. **Remove legacy Node/Express/Supabase** (`WebCodingDev26/backend/`, root `server.js`, `supabase/`, `vercel.json`, stray Node scaffolding in backend repo) once nothing references it.
3. **Decide the auth strategy** (keep demo email-trust vs. introduce real Appwrite/JWT). Align `AuthContext`, `AuthService`, `X-Demo-User-Email`, and admin gating accordingly.
4. **Tighten `appClient`** fallbacks: keep safe local fallback only for public browse/basic submit; ensure backend-owned features render empty/error states.
5. **Consolidate entity access** onto feature endpoints; phase out `/api/entities` generic CRUD where a feature endpoint exists.
6. **Reconcile/remove Appwrite static-UI + chat** story (or implement it in React if chat is in scope).
7. **Update docs/tests** and re-run `./mvnw test` + `npm run lint && npm run build` to lock the new baseline.

> Scope note: No application behavior, dependencies, or unrelated files were changed during this inspection.
