# Frontend Backend Integration Audit

Audit scope: `WebCodingDev26` React/Vite frontend and `WebCodingDev26-Backend` Spring Boot/MongoDB backend.

## Summary

- Frontend backend calls are centralized in `src/api/appClient.js`. Direct `fetch` appears only in `appClient.js` and `src/lib/appwriteAuth.js` for Appwrite REST auth.
- Local Vite and preview proxy `/api` to `http://127.0.0.1:8080`; deployed builds use `VITE_API_URL` as backend origin only.
- Spring Boot exposes `/api/*` controllers for health, auth, items, generic entities, claims, admin workflow, matches, proof vault, case/recovery, return passes, Recovery Pulse, Sentinel, Event Hub/Beacon, uploads, assets, and optional assistance.
- Appwrite JWTs are attached as `X-Appwrite-JWT`; local demo fallback attaches `X-Demo-User-Email`.
- Confirmed fix applied in this audit: JWT-aware email resolution is now used for Recovery Pulse, and invalid JWTs no longer fall back through `resolveEmail`.
- Runtime end-to-end browser verification was not performed because starting the app could load `.env.local` and write seed/demo records to an unknown MongoDB target. Verification used static route/code audit plus existing backend tests.
- Read-only endpoint probe: `curl -fsS http://localhost:8080/api/health` failed with connection refused because no backend was already running.
- Check results after fixes: frontend `npm run lint && npm run typecheck && npm run build` passed; backend `./mvnw test` passed with 80 tests.

## Integration Table

| Frontend feature/page | appClient method | Backend endpoint | Request method/body/header | Expected response fields | Auth requirement | Current status | Exact fix applied or remaining blocker |
|---|---|---|---|---|---|---|---|
| Backend health check (`Home`, `Search`) | `health.check()` | `/api/health` | `GET`; auth headers harmless if present | `status`, `database`, `connected` | Public | Verified API-only by tests/code | No fix. Local endpoint connectivity manually blocked unless a safe Mongo target is confirmed. |
| Auth/current user identity (`AuthContext`) | `auth.me()`, `auth.signIn()` | `/api/auth/me`, `/api/auth/signin`, `/api/auth/user?email=` | `GET /me` with `X-Appwrite-JWT` or demo header; `POST /signin` body `email`, `full_name` | `id`, `email`, `full_name`, `role`, Appwrite id when verified | JWT or local demo fallback | Verified API-only by tests/code | No fix. Appwrite project/team setup remains manual for deployed auth. |
| Public Found Item browse (`Home`, `Search`) | `entities.FoundItem.list()`, `items.list()` | `/api/items` | `GET`; no body | `PublicFoundItemResponse[]`: `id`, `title`, `description`, `category`, `color`, `brand`, `location_found`, `date_found`, `status`, `record_type`, `photo_urls`, `tags` | Public | Verified API-only by tests/code | No fix. Public DTO excludes private fields. |
| Public Found Item detail (`ItemDetails`) | `entities.FoundItem.get(id)` | `/api/items/{id}` | `GET`; no body | Same public found-item fields | Public | Verified API-only by tests/code | No fix. Restricted/non-public items 404 by backend service. |
| Report Found Item (`ReportFound`) | `entities.FoundItem.create()`, `matches.refreshFoundItem()` | `/api/items`, `/api/matches/found-items/{id}/refresh` | `POST /items` body includes `title`, `category`, `location_found`, `date_found`, optional `photo_urls`, `tags`, `event_hub_id`, `campus_zone_id`; auth header optional | Full `FoundItem`; match refresh returns `MatchSuggestion[]` | Intake public; match refresh backend route public in controller | Code-integrated, API-only verified | No fix. Form keeps storage/private fields out of public browse responses. |
| Report Lost Item (`ReportLost`) | `entities.LostReport.create()`, `matches.forLostReport()` | `/api/entities/LostReport`, `/api/matches/lost-reports/{id}` | `POST` body `item_type/title`, `category`, `contact_email`, optional `description`, `color`, `brand`, `last_seen_location`, `date_lost`, `event_hub_id`, `campus_zone_id`; `GET` matches | `LostReport` with `matched_items`; `MatchSuggestion[]` | Public report create; match read public | Verified API-only by service/controller tests | No fix. Backend does not create Found Items from Lost Reports. |
| Match suggestions (`ReportLost`, `UserDashboard`) | `matches.forLostReport()`, `matches.refreshLostReport()`, `matches.refreshFoundItem()` | `/api/matches/lost-reports/{id}`, `/api/matches/lost-reports/{id}/refresh`, `/api/matches/found-items/{id}/refresh` | `GET` or `POST`; no body | `found_item_id`, `found_item_title`, `confidence`, `reasons`, `source`, `status` | Public in current controller | Verified API-only by tests | No fix. Scores are deterministic/advisory and never mutate claims. |
| Claim submission (`ClaimItem`) | `entities.Claim.create()` | `/api/entities/Claim` | `POST` body `found_item_id`, `claimant_name`, `claimant_email`, `reason/claim_reason`, `identifying_details`, optional proof/pickup fields | `Claim`; item moves to `CLAIM_PENDING` | Public submission | Verified API-only by workflow tests | No fix. Backend rejects new approved/completed claims. |
| User claim dashboard (`UserDashboard`) | `claims.mine()` | `/api/claims/mine` | `GET` with `X-Appwrite-JWT` or demo header | Current caller's `Claim[]` | Signed-in claimant | Verified API-only by integration test | No fix. This avoids client-filtering global private Claim list. |
| Admin claim review/approval/denial (`AdminDashboard`, `AdminClaimsQueue`) | `claims.list()`, `claims.approve()`, `claims.reject()`, `claims.updateWorkflow()` | `/api/admin/claims`, `/api/admin/claims/{id}/approve`, `/api/admin/claims/{id}/deny`, guarded `/api/entities/Claim/{id}` | `GET` or `POST/PATCH`; admin header/JWT; bodies include admin notes/status fields | Full `Claim`, notifications side effects | Admin only | Verified API-only by tests/code | No fix in this audit. Generic privileged Claim updates already admin-gated. |
| Proof Vault/evidence privacy (`ItemDetails`, `ClaimEvidenceReview`) | `proofVault.item()`, `proofVault.evidenceReview()`, `proofVault.submitEvidenceReview()` | `/api/items/{id}/proof-vault`, `/api/claims/{claimId}/evidence-review` | `GET`/`POST`; admin header/JWT; review body checklist/score/summary fields | `ProofVaultResponse`, `EvidenceReviewResponse` including private clues/evidence | Admin only | Verified API-only by controller/service code | No fix. Public pages do not call these unless admin-gated. |
| Case Messages (`ClaimCaseMessageThread`) | `claimCaseMessages.list()`, `.send()`, `.requestMoreInfo()` | `/api/claims/{claimId}/case-messages`, `/api/admin/claims/{claimId}/request-more-info` | `GET`/`POST` bodies `body`, `message_type`, admin notes | Intended case message records | Signed-in claimant/admin intended | Incomplete/broken | Backend endpoints are not present. Not fixed because this would require inventing missing backend behavior. |
| Return Pass/Pickup Station (`PickupPass`, `PickupStation`, hooks) | `returnPasses.create/get/verify/redeem/reminder()` | `/api/claims/{claimId}/return-pass`, `/api/return-passes/{id}`, `/api/return-passes/verify`, `/api/return-passes/{id}/redeem`, `/api/return-passes/{id}/reminder` | `POST` pass request `pickup_window`, `pickup_location`; verify/redeem body `one_time_code`; admin/JWT for issue/redeem/reminder | `ReturnPassResponse`, `ReturnPassVerifyResponse` | Create/redeem/reminder admin; get claimant-own-or-admin; verify public code check | Verified API-only by tests | No fix. Single-use redemption covered by backend tests. |
| Notifications/Recovery Pulse (`Navbar`, `UserDashboard`, admin delivery views) | `recoveryPulse.preferences/updatePreferences/notifications/deliveries/adminDeliveries/testNotification()` | `/api/recovery-pulse/*` | `GET/PATCH/POST`; user/admin headers; preference body uses email/SMS/webhook settings | preferences DTO, `Notification[]`, `NotificationDelivery[]`, dispatch result | Signed-in user; admin for admin routes | Mismatch fixed; API-only verified by tests | Fixed `RecoveryPulseController.requireUser()` to resolve JWT/demo identity through `DemoAuthorizationService`. |
| Event Hub/Beacon/Display (`EventHub`, `Beacon`, `Display`) | `eventHubs.list/get/displayFeed()`, `campusZones.list()` | `/api/event-hubs`, `/api/event-hubs/{id}`, `/api/event-hubs/{id}/display-feed`, `/api/campus-zones` | `GET`; no body | public event hub DTO, `zones`, redacted `found_items`, `notice` | Public | Verified API-only by tests/code | No fix. Beacon is frontend route only and does not use GPS. |
| Admin Event Hub management | `eventHubs.create/update/activate/close()` | `/api/admin/event-hubs`, `/api/admin/event-hubs/{id}`, activate/close routes | `POST/PATCH`; admin header/JWT; body event fields | `EventRecoveryHub` | Admin only | Code-integrated; API-only by controller tests indirectly | No fix. Requires admin auth setup for real use. |
| Admin Demo Builder | `demoScenarios.create()`, `.cleanup()` | `/api/admin/demo-scenarios/{scenario}`, `/api/admin/demo-scenarios/cleanup` | `POST`; admin header/JWT; cleanup body `confirmation` | `DemoScenarioResponse` or cleanup counts | Admin only | Verified API-only by tests | No fix. Cleanup only deletes `is_demo=true`. |
| Upload flow (`PhotoUploader`) | `integrations.Core.UploadFile()` / `uploads` | `/api/uploads` | `POST` body `file_name`, `content_type`, `data_url`; auth optional | `file_url` | Public in current controller | Verified API-only by integration test | No fix. Local fallback returns data URL if backend unavailable. |
| Optional AI assistance (`Search`, `ReportFound`) | `aiAssistance.parseSearchQuery()`, `.suggestFoundItemFields()` | `/api/ai-assistance/search`, `/api/ai-assistance/found-item` | `POST`; whitelisted public fields/search text only | editable suggestions, `source`, `used_ollama`, `explanation` | Public | Verified API-only by tests | No fix. Ollama optional and disabled by default. |
| Natural Appwrite auth (`SignInDialog`, `AuthContext`) | `auth.signInWithGoogle()`, Appwrite REST helper | Appwrite public REST, then `/api/auth/me` | Browser calls Appwrite `/account/*`; backend receives only JWT | verified backend `AppUser` | Requires Appwrite setup | Code-integrated but manually blocked | Requires Appwrite project/platform/OAuth/admin team env; no credentials requested. |

## Runtime Verification Status By Required Workflow

1. Backend health check — verified API-only by tests; local endpoint probe attempted and failed because no backend was running.
2. Auth/current user identity — verified API-only; Appwrite end-to-end manually blocked by provider setup.
3. Public Found Item browse/detail — verified API-only.
4. Report Found Item — verified API-only; browser E2E not run against unknown database.
5. Report Lost Item — verified API-only.
6. Match suggestions — verified API-only and service-tested.
7. Claim submission — verified API-only and workflow-tested.
8. Admin claim review/approval/denial — verified API-only and admin-gated.
9. Proof Vault/evidence privacy — verified API-only and admin-gated.
10. Case Messages — incomplete/broken; frontend points at missing backend endpoints.
11. Return Pass/Pickup Station — verified API-only and service-tested.
12. Notifications/Recovery Pulse — mismatch fixed; verified API-only after tests.
13. Event Hub/Beacon — verified API-only; Beacon is frontend route behavior.

## Environment And Runtime Notes

- Local dev: run backend on `localhost:8080`, frontend on `localhost:5173`; Vite proxies `/api`.
- CORS allows `http://localhost:5173`, `http://localhost:4173`, and configured `FRONTEND_URL`.
- MongoDB is configured with `MONGO_URI` and `MONGO_DATABASE`; running the app may seed/write records when `SEED_DATA_ENABLED=true`.
- This audit intentionally did not start the full stack because `.env.local` may point to a shared database and the task forbids writing test data to production/shared data.
- Old Node/Express files remain in the frontend repo, but active scripts use Vite plus the sibling Spring Boot backend through `./run`.

## Runtime Commands Run

- `cd WebCodingDev26 && npm run lint && npm run typecheck && npm run build` — passed.
- `cd WebCodingDev26-Backend && ./mvnw test` — passed, 80 tests.
- `curl -fsS http://localhost:8080/api/health` — failed connection because no local backend was listening; no server was started to avoid accidental writes to an unknown Mongo target.

## Fixes Applied In This Audit

- `DemoAuthorizationService.resolveEmail(...)` now returns blank for invalid JWT sessions instead of falling through to the demo header.
- `RecoveryPulseController` now uses `authorization.resolveEmail(...)`, so Appwrite JWT callers and demo fallback callers resolve consistently.

