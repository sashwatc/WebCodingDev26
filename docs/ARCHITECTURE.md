# Architecture

## Frontend

- React 18 + Vite + Tailwind + Radix + TanStack Query.
- Routes live in `src/App.jsx` under `HashRouter`; most public pages render inside `PublicLayout`.
- `src/api/appClient.js` is the single backend API gateway for pages, components, and hooks.
- `src/lib/appwriteAuth.js` talks only to Appwrite's public auth REST API to create sessions/JWTs.
- `AuthContext` resolves the current user through `appClient.auth.me()`, so role state comes from Spring Boot.
- Forms send backend payloads as `snake_case`.
- Search-related screens use explicit loading, empty, error, backend-unavailable, and permission states.
- Natural-language search and found-item field suggestions call `appClient.aiAssistance`; users can edit or ignore every suggestion.

## Backend

- Java 21 + Spring Boot 4.1 + Spring Web MVC + Bean Validation + Spring Data MongoDB.
- Controllers expose `/api/*`; services own workflow rules; repositories persist Mongo records.
- Public DTOs redact sensitive Found Item/Event Hub fields.
- `DemoAuthorizationService` resolves identity JWT-first and gates demo fallback through config.
- `AppwriteAuthService` verifies browser JWTs against Appwrite `/account`; admin comes from Appwrite team membership when configured.
- `WorkflowService`, `AdminWorkflowService`, and `ReturnPassService` enforce claim/return state transitions.
- `AiAssistanceService` optionally calls local Ollama server-side and otherwise returns deterministic, explainable suggestions.

## Core Data Boundaries

- Found Items are inventory records for items already turned in.
- Lost Reports are student reports and never create inventory.
- Claims reference existing Found Items and require admin review before approval/completion.
- Matches are advisory suggestions only.
- Recovery Cases/Missions, Sentinel alerts, Return Passes, and Demo Scenarios are persisted backend records.
- Demo Scenario records are flagged `is_demo=true`; cleanup deletes only demo records after explicit confirmation.

## API Boundary

- Public inventory: `/api/items`
- Generic report/claim submission: `/api/entities/LostReport`, `/api/entities/Claim`
- User-scoped claims: `/api/claims/mine`
- Admin queues: `/api/admin/*`
- Recovery Center: `/api/recovery-cases`, `/api/admin/recovery-center`
- Return Passes: `/api/claims/{claimId}/return-pass`, `/api/return-passes/*`
- Event/Beacon data: `/api/event-hubs`, `/api/campus-zones`
- Demo scenarios: `/api/admin/demo-scenarios/*`
- Optional assistance: `/api/ai-assistance/search`, `/api/ai-assistance/found-item`

See backend docs:

- `../WebCodingDev26-Backend/docs/CORE_WORKFLOW_API.md`
- `../WebCodingDev26-Backend/docs/EVENT_RECOVERY_API.md`

## Security And Privacy

- No passwords are sent to Spring Boot.
- No provider secrets belong in frontend code or committed env files.
- Invalid Appwrite JWTs never fall through to demo headers.
- Public UI must not render storage location, private clues, proof evidence, finder/claimant private contact, Return Pass token, or internal custody notes.
- Assistance payloads are whitelisted to public item/search fields and must not include Proof Vault clues, claim evidence, or private contact fields.
- Production must set `AUTH_DEMO_FALLBACK_ENABLED=false`.
