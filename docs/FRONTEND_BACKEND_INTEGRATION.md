# Lost Then Found Frontend Backend Integration

This frontend must integrate with the existing Spring Boot + MongoDB backend through `src/api/appClient.js`. Pages and components should not call `fetch`, `axios`, or hard-coded `/api/*` URLs directly.

## Runtime Setup

- Local frontend: Vite serves the React app and proxies `/api` to `http://127.0.0.1:8080`.
- Deployed frontend: set `VITE_API_URL` to the backend origin only, for example `https://api.example.com`. Do not include `/api`.
- Backend payloads use `snake_case`. Keep backend-facing payloads in `snake_case` and normalize only inside `appClient` when a legacy component needs older names.
- Signed-in and admin endpoints require `X-Demo-User-Email` from the current auth user where the backend expects a demo session header.
- Keep `.env.local` out of git. Never place provider secrets in frontend code.

## Current Legacy Assumptions To Remove Gradually

- The frontend repo still contains a legacy Express/Mongo demo server under `backend/` and several localStorage seed fallbacks in `appClient.js`.
- Generic CRUD remains available through `/api/entities/{EntityName}` for `FoundItem`, `LostReport`, `Claim`, `Notification`, and `AuditLog`.
- Feature-specific Spring Boot endpoints are now preferred for Recovery Cases, Recovery Pulse, Sentinel, Return Pass, custody, event hubs, uploads, auth, and matching.
- Do not fabricate advanced backend data in the frontend. If a backend-owned feature is unavailable, show empty/loading/error states instead of seeded Recovery Cases, Sentinel alerts, Recovery Pulse deliveries, or dashboard metrics.
- Safe local fallback can remain for core demo flows such as public item browsing and basic lost/found/claim submissions.

## Public Data Boundaries

Public search/detail UI must never expose:

- `storage_location`
- `private_verification_clues`
- finder private contact fields such as `finder_email` and private `finder_name`
- claimant contact fields such as `claimant_email` and `claimant_phone`
- `proof_photo_url`
- `private_evidence_responses`
- Proof Vault verification details
- `asset_tag`
- `department_destination`
- Return Pass one-time codes, tokens, sensitive handoff details, or private pickup instructions outside authorized pickup/admin views

Use backend-redacted endpoints whenever possible. Do not fix missing public fields by reading admin/private records in a public page.

## App Client Groups

Use these high-level groups from `appClient`:

- `auth`: `signIn`, `me`, `logout`, `onAuthStateChange`
- `health`: backend health check
- `items`: public/admin found item list, create, update, delete, rating compatibility
- `lostReports`: list, filter, create, update, delete
- `claims`: list, filter, create, update, delete, `approve`, `reject`, `requestMoreInfo`, `markUnderReview`, `complete`, rating review helpers
- `matches`: lost-report and found-item match reads/refreshes
- `uploads`: file upload
- `recoveryCenter`: admin recovery center summary
- `recoveryCases`: list, get, create from lost report, update, assign, refresh, missions
- `recoveryMissions`: update mission
- `proofVault`: item proof vault and claim evidence review
- `returnPasses`: create, get, verify, redeem, reminder
- `recoveryPulse`: preferences, notifications, delivery records, admin delivery records, admin test send
- `sentinel`: alerts, recompute, update, acknowledge, dismiss, resolve, source reports, mission creation
- `custody`: custody events, verify, move item
- `campusZones`: list
- `eventHubs`: public hubs, public hub detail, display feed, admin create/update/activate/close
- `assets`: asset lookup
- `partnerRelay`: recovery nodes and partner relays
- `entities`: legacy/generic CRUD only
- `recoveryMesh`: compatibility aliases for older pages

## Backend Endpoints

### Auth

- `POST /api/auth/signin`
- `GET /api/auth/user?email={email}`

### Found Items

- `GET /api/items`
- `GET /api/items/{id}`
- `POST /api/items`
- `PATCH /api/items/{id}`
- `DELETE /api/items/{id}`
- `GET /api/admin/items`

### Generic Entities

- `GET /api/entities/{LostReport|Claim|Notification|AuditLog}`
- `POST /api/entities/{LostReport|Claim|Notification|AuditLog}`
- `PATCH /api/entities/{LostReport|Claim|Notification|AuditLog}/{id}`
- `DELETE /api/entities/{LostReport|Claim|Notification|AuditLog}/{id}`

### Matching

- `GET /api/matches/lost-reports/{id}`
- `POST /api/matches/lost-reports/{id}/refresh`
- `POST /api/matches/found-items/{id}/refresh`

### Recovery Cases And Missions

- `GET /api/admin/recovery-center`
- `GET /api/recovery-cases`
- `GET /api/recovery-cases/{id}`
- `GET /api/recovery-cases/lost-reports/{lostReportId}`
- `POST /api/admin/recovery-cases`
- `POST /api/admin/recovery-cases/lost-reports/{lostReportId}`
- `POST /api/recovery-cases/lost-reports/{lostReportId}/refresh`
- `PATCH /api/recovery-cases/{id}`
- `POST /api/recovery-cases/{id}/assign`
- `GET /api/recovery-cases/{id}/missions`
- `POST /api/recovery-cases/{id}/missions`
- `PATCH /api/recovery-missions/{id}`

### Proof Vault And Evidence

- `GET /api/items/{id}/proof-vault`
- `GET /api/claims/{claimId}/evidence-review`
- `POST /api/claims/{claimId}/evidence-review`

### Return Pass

- `POST /api/claims/{claimId}/return-pass`
- `GET /api/return-passes/{id}`
- `POST /api/return-passes/verify`
- `POST /api/return-passes/{id}/redeem`
- `POST /api/return-passes/{id}/reminder`

### Recovery Pulse

- `GET /api/recovery-pulse/preferences`
- `PATCH /api/recovery-pulse/preferences`
- `GET /api/recovery-pulse/notifications`
- `GET /api/recovery-pulse/deliveries`
- `GET /api/recovery-pulse/admin/deliveries?channel={channel}`
- `POST /api/recovery-pulse/admin/test`

Delivery states: `queued`, `sent`, `failed`, `skipped`, `mock_sent`.

Event types: `strong_item_match`, `recovery_case_status_update`, `claim_submitted`, `claim_more_info_requested`, `claim_approved`, `claim_rejected`, `return_pass_ready`, `pickup_reminder`, `item_returned`, `recovery_mission_assigned`, `pattern_review_alert`.

### Loss Sentinel

- `GET /api/sentinel/alerts`
- `POST /api/sentinel/recompute`
- `PATCH /api/sentinel/alerts/{id}`
- `POST /api/sentinel/alerts/{id}/acknowledge`
- `POST /api/sentinel/alerts/{id}/dismiss`
- `POST /api/sentinel/alerts/{id}/resolve`
- `GET /api/sentinel/alerts/{id}/source-reports`
- `POST /api/sentinel/alerts/{id}/mission`

### Custody

- `GET /api/custody/items/{foundItemId}`
- `GET /api/custody/items/{foundItemId}/verify`
- `POST /api/custody/items/{foundItemId}/move`

### Event Hubs

- `GET /api/campus-zones`
- `GET /api/event-hubs`
- `GET /api/event-hubs/{id}`
- `GET /api/event-hubs/{id}/display-feed`
- `POST /api/admin/event-hubs`
- `PATCH /api/admin/event-hubs/{id}`
- `POST /api/admin/event-hubs/{id}/activate`
- `POST /api/admin/event-hubs/{id}/close`

### Other Integrations

- `GET /api/assets/lookup?tag={assetTag}`
- `GET /api/recovery-nodes`
- `GET /api/partner-relays`
- `POST /api/uploads`
- `GET /api/health`

## Page Wiring Notes

- `Navbar`: unread count should come from `recoveryPulse.notifications()` and filter unread client-side if necessary.
- `UserDashboard`: use `recoveryPulse.notifications()` for notification history. Use `recoveryCases.byLostReport(lostReportId)` for each user report rather than broad admin case data.
- `AdminDashboard`: use feature clients for Recovery Center, Sentinel, missions, partner relay, assets, and delivery visibility. Do not invent dashboard metrics if the backend is unavailable.
- `AdminClaimsQueue`: claim status buttons should call claim workflow helpers so the backend can create Recovery Pulse notifications and delivery records. Components should not compose user notifications for claim approval, rejection, or more-info events.
- `PickupPass` and `PickupStation`: use Return Pass helpers. Do not expose Return Pass codes outside the signed-in pass view and staff pickup flow.
- `ReportFound`, `ReportLost`, `ClaimItem`, `ItemDetails`, `Search`, `EventHub`, and `Display`: continue to import only `appClient`.

## Known Contract Blockers

No backend file changes are required from the current frontend audit. If a page later needs a feature-specific endpoint that the backend does not expose, document the exact mismatch before touching backend code.
