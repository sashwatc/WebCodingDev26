# AI Current State - Frontend

## Architecture
- React 18 + Vite + Tailwind + Radix + TanStack Query.
- Routing lives in `src/App.jsx` with `HashRouter`; most pages render under `PublicLayout`.
- Auth: Appwrite email/password + Google OAuth (REST, no SDK) mints a JWT verified server-side. Demo sign-in remains local-dev only; see `docs/AUTH_INTEGRATION.md`.
- `src/api/appClient.js` is the sole API gateway and attaches auth headers.

## Run Commands
- Dev: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Full local flow: `npm run ts`

## API Base URL
- Local Vite proxies `/api` to `http://127.0.0.1:8080`.
- Deployed frontend: set `VITE_API_URL` to backend origin only.
- Appwrite mode sends `X-Appwrite-JWT`; demo mode sends `X-Demo-User-Email` only when Appwrite is unconfigured.

## Integrated Flows
- Search/browse public Found Items; Report Lost; Report Found; Claim submission.
- Admin claim review, evidence review, case messages, Recovery Center counts, Sentinel alerts.
- Pickup Pass/Pickup Station: issue, gated view, verify, redeem, reminder.
- Event Hub (`/EventHub`): public-safe event context, zone cards, approved event item feed.
- QR Beacon (`/Beacon`): “You are reporting from” zone copy, Report Found/Lost Here, Browse Nearby Items; no GPS claims.
- Admin Demo Builder tab creates AirPods at Gym, Approved Calculator Return, Gym Electronics Pattern scenarios and demo-only cleanup.
- Optional assistance: editable found-item field/tag suggestions and natural-language search parsing via `appClient.aiAssistance`.
- Integration audit verified API wiring for health, auth, public items, lost/found reporting, claims, admin review, proof vault, return passes, Recovery Pulse, Event Hub/Beacon, uploads, and optional assistance.

## Safety Notes
- Report forms persist `event_hub_id`/`campus_zone_id`; location labels are prefilled from zones but user-editable.
- Public pages use redacted Found Item DTOs; private proof, storage, contact, and Return Pass secrets stay out of public UI.
- Demo Builder calls backend services and requires `DELETE DEMO DATA` before cleanup.
- Assistance suggestions are advisory/editable and never approve claims or ownership.

## Not Started
- Full notifications delivery UI, deployment automation.

## Broken Or Risky Flows
- Case-message endpoints (`/api/claims/{id}/case-messages`, `/api/admin/claims/{id}/request-more-info`) are not present in the backend yet.
- Some non-core recovery mesh extras may still have legacy local fallbacks.
- Legacy Node/Express/Supabase files remain in the frontend repo.
- Full local browser E2E was not run because no backend was listening on `localhost:8080`, and starting one may write seed/demo data to an unknown Mongo target.

## Current Next Task
- Implement backend case-message endpoints or remove/disable the frontend Case Messages UI until the contract exists.

## Last Test Status
- `npm run lint`, `npm run typecheck`, and `npm run build` passed after integration audit fixes.
