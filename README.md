# Lost Then Found

PVHS lost-and-found recovery platform built for FBLA Website Coding & Development / NLC judging. The frontend is a React/Vite app focused on search-first discovery, accessible reporting, secure claim review, event recovery, QR Beacon reporting, and admin demo scenarios backed by persisted Spring Boot data.

## Highlights

- Search-first homepage and `/Search` with loading, empty, error, and backend-unavailable states.
- Public-safe Found Item browse/detail pages with private fields redacted.
- Separate Lost Report and Found Item workflows; Lost Reports never fabricate inventory.
- Claims require admin review, and pickup completion is handled through Return Pass verification/redeem flows.
- Event Hub and QR Beacon pages use manually configured event/zone context; no GPS or live calendar claims.
- Admin Dashboard includes claim review, Recovery Center, Loss Sentinel, Pickup Station, Event Hub controls, and Demo Builder.
- Optional assistance can interpret natural-language search and suggest editable found-item fields; deterministic fallback works without Ollama.
- Appwrite email/password + Google OAuth can mint JWTs that the backend verifies server-side. Local demo sign-in remains a documented fallback only when enabled.

## Tech Stack

- React 18, Vite, HashRouter, TanStack Query
- Tailwind CSS, Radix UI primitives, Framer Motion
- i18next locales for English, Spanish, and French
- Spring Boot API in `../WebCodingDev26-Backend`
- MongoDB for persisted workflow records

## Local Development

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd ../WebCodingDev26-Backend
./mvnw spring-boot:run
```

Open `http://localhost:5173`. Local Vite proxies `/api/*` to `http://127.0.0.1:8080`.

Production frontend builds should set `VITE_API_URL` to the backend origin only, without `/api`.

## Authentication

Production auth uses Appwrite as the credential provider:

- Frontend env: `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`
- Backend env: same Appwrite values plus `VITE_APPWRITE_ADMIN_TEAM_ID`
- Set `AUTH_DEMO_FALLBACK_ENABLED=false` in production

The backend verifies `X-Appwrite-JWT` server-side and derives admin access from Appwrite team membership. Do not commit provider secrets or local `.env*` files.

Local demo mode can use the seeded student/admin demo accounts only when Appwrite is unconfigured and backend demo fallback remains enabled.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Documentation

- `docs/ARCHITECTURE.md` - system architecture and API boundaries
- `docs/NLC_WEB_READINESS.md` - final readiness audit and residual risks
- `docs/NLC_DEMO_SCRIPT.md` - 2-4 minute judge demo route
- `docs/AUTH_INTEGRATION.md` - Appwrite/backend authorization contract
- Backend API docs live in `../WebCodingDev26-Backend/docs/`
