# NLC Web Readiness

Final readiness audit for the React frontend and Spring Boot backend.

## Verified Ready

- No raw backend calls from pages/components; backend API access goes through `src/api/appClient.js`.
- Appwrite provider calls are isolated in `src/lib/appwriteAuth.js`; backend authorization is still mediated by `appClient` headers and Spring Boot verification.
- Search, Event Hub, Beacon, Pickup Pass, Pickup Station, Recovery Center, Sentinel, and Admin Dashboard include loading/empty/error or permission states.
- Public Found Item and Event Hub responses use redacted DTOs; private storage, proof, contact, and pass token fields are not used in public UI.
- Lost Reports and Found Items remain separate flows. Lost Reports open/refresh Recovery Cases and advisory matches only.
- Claims cannot be created as approved/completed and privileged Claim status/review updates now require admin on the generic entity route.
- Return Pass redemption is server-side, one-time, and rejects inactive/expired/mismatched passes.
- Recovery Center and Sentinel counts come from persisted backend records.
- Demo Scenario cleanup requires exact confirmation and deletes only `is_demo=true` records.
- `.env*` files are ignored except `.env.example`; no real secret files were inspected or edited.

## Focused Fixes Made

- Removed obsolete hardcoded client-side admin password references from constants, README, in-app docs, guide text, and locales.
- Restricted generic Claim list/delete and privileged Claim patch fields to admin callers in Spring Boot.
- Added `/api/claims/mine` and moved `UserDashboard` to the user-scoped endpoint instead of client-filtering the global Claim list.
- Removed claimant-side self-complete return action from `UserDashboard`; pickup completion is recorded by staff through Return Pass redemption.
- Updated `CORE_WORKFLOW_API.md` to reflect Claim route restrictions.

## Residual Risks

- Physical-device QA is still recommended for final responsive validation.
- Legacy Node/static artifacts remain in the frontend tree but are not the active React/Spring path.
- Some legacy compatibility helpers in `appClient.recoveryMesh` are unused by current screens; keep them out of new work.
- Appwrite production readiness depends on host env vars, Appwrite Web platform setup, Google OAuth setup, and admin team membership.

## Required Checks

- Frontend: `npm run lint`, `npm run typecheck`, `npm run build`
- Backend: `./mvnw test`
