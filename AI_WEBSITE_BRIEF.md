# Lost Then Found Website Brief

Use this document as context for understanding the website and planning feature work.

## One-Sentence Summary

Lost Then Found is a school lost-and-found web app for Pleasant Valley High School. It lets users browse found inventory, report lost items, report found items, claim found items, review AI/local match suggestions, and gives admins tools to verify found items and claims.

## Core Product Idea

The app separates three concepts:

- **Found Items**: physical inventory. These are items someone actually turned in. Found Items are the source of truth for what the school has.
- **Lost Reports**: requests from users looking for something. These are not inventory and should never create Found Items by themselves.
- **Claims**: verification requests tied to a Found Item. Claims start as submitted/admin-reviewed and only become approved/completed after verification.

AI/local matching is only advisory. It suggests possible Found Items for Lost Reports, but admins still verify ownership through the claim workflow.

## Target Users

- **Students/staff/families**: search for found items, report a lost item, report a found item, submit a claim, check personal dashboard.
- **Admins/front office**: approve found item reports, verify claims, review lost reports, handle pickup/return status, monitor audit logs.
- **Judges/reviewers**: view documentation, accessibility page, sources, FAQ, and the full workflow.

## Tech Stack

Frontend repo:

- Path: `/Users/sashwatc/Developer/WebCodingDev26`
- React 18
- Vite
- React Router using `HashRouter`
- TanStack Query
- Tailwind CSS
- Radix UI primitives
- Framer Motion
- i18next/react-i18next

Backend repo used by normal local app:

- Path: `/Users/sashwatc/Developer/WebCodingDev26-Backend`
- Spring Boot
- MongoDB
- REST API under `/api`
- AI matchmaking can call OpenAI-compatible chat completions when `AI_API_KEY` is set
- Local scoring fallback is used if AI is disabled or unavailable

There is also a Node/Express backend folder inside the frontend repo at `backend/`. The normal `npm run ts` flow uses the Spring backend in `../WebCodingDev26-Backend`.

## Local Run Model

Normal full-stack run:

```bash
npm run ts
```

This starts:

- Spring backend at `http://localhost:8080`
- Vite frontend at `http://localhost:5173`

Frontend local API calls go through Vite proxy:

- Frontend requests `/api/...`
- Vite proxies to `http://127.0.0.1:8080`

Frontend-only:

```bash
npm run dev
```

Backend-only:

```bash
npm run backend
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

Backend tests:

```bash
cd ../WebCodingDev26-Backend
./mvnw test
```

## Security Notes

Do not put private API keys in frontend env vars. Vite exposes `VITE_*` variables to browser code.

AI matchmaking key belongs in:

```text
../WebCodingDev26-Backend/.env.local
```

Expected backend env vars:

```env
AI_MATCHMAKING_ENABLED=true
AI_API_KEY=your_key_here
AI_MATCHMAKING_BASE_URL=https://api.openai.com/v1/chat/completions
AI_MATCHMAKING_MODEL=gpt-4o-mini
AI_MATCHMAKING_MAX_CANDIDATES=8
AI_MATCHMAKING_MIN_CONFIDENCE=35
```

Never print or expose `.env.local` secrets.

## Frontend Route Layout

Router file:

- `src/App.jsx`

All public pages are wrapped in:

- `src/components/layout/PublicLayout.jsx`
- `src/components/layout/Navbar.jsx`
- `src/components/layout/Footer.jsx`
- `src/components/layout/RouteEnhancements.jsx`

Routes:

- `/` redirects to `/Home`
- `/Home`: homepage and quick entry points
- `/Search`: found-item inventory search only
- `/LostItems`: lost reports users are looking for
- `/ReportFound`: report an item that was physically found
- `/ReportLost`: report an item the user lost
- `/ItemDetails`: detail page for Found Items and Lost Reports
- `/ClaimItem`: submit a claim for a Found Item
- `/UserDashboard`: user reports, claims, notifications, and match suggestions
- `/AdminDashboard`: admin-only moderation dashboard
- `/About`: project/about content
- `/FAQ`: help and FAQ
- `/Privacy`: privacy policy
- `/Terms`: terms of use
- `/Accessibility`: accessibility statement
- `/Sources`: citations
- `/Documentation`: project documentation
- `/ShaderDemo`: visual/demo page
- fallback: custom 404 page

## Frontend Page Responsibilities

### `src/pages/Home.jsx`

Landing/home screen. Gives quick paths into search, reporting, dashboards, and documentation.

### `src/pages/Search.jsx`

Search/browse UI. By default it displays only public Found Items:

- approved status
- not claimed
- not returned
- not archived
- not lost reports

It supports filters for query text, category, location, color, and status-like browsing. It can also be reused for Lost Items by passing `recordTypeOverride="lost"`.

### `src/pages/LostItems.jsx`

Thin wrapper around `Search`:

```jsx
<Search recordTypeOverride="lost" />
```

It displays Lost Reports only. These are things users are looking for, not physical inventory.

### `src/pages/ReportFound.jsx`

Multi-step form for physically turned-in Found Items. Important behavior:

- creates a Found Item
- defaults status to `pending_review`
- supports photo upload/drag-drop
- can be opened with `?lost_report_id=...`
- when opened from a Lost Report, it pre-fills category/title/details and stores `linked_lost_report_id`
- linked found reports create a finder-response match suggestion, not an immediate return

### `src/pages/ReportLost.jsx`

Multi-step form for Lost Reports. Important behavior:

- creates a Lost Report
- does not create a Found Item
- stores contact info and item details
- generates match suggestions against Found Items
- status can become `matched` if suggestions exist

### `src/pages/ItemDetails.jsx`

Shared details page for both Found Items and Lost Reports.

For Found Items:

- shows item details, status, images, storage/admin info if admin
- allows claiming only when item is available/approved
- admins can see matching Lost Reports

For Lost Reports:

- shows user-reported lost item details
- includes `I Found This` button
- button links to `/ReportFound?lost_report_id=<lost id>`
- shows suggested Found Item matches

### `src/pages/ClaimItem.jsx`

Claim submission form for Found Items. Important behavior:

- validates required identity/contact/proof fields
- validates email format
- creates a Claim tied to `found_item_id`
- does not directly mark the Found Item returned
- success goes to user dashboard
- errors are shown as toast messages

### `src/pages/UserDashboard.jsx`

User-facing dashboard:

- Lost Reports created by the signed-in user
- Claims created by the signed-in user
- Notifications
- AI/local match suggestions for their Lost Reports
- post-return confirmation and rating flow

### `src/pages/AdminDashboard.jsx`

Admin-only dashboard guarded by `AdminRouteGuard`.

Tabs/sections:

- overview statistics from actual fetched records
- Found Items moderation queue
- Claims verification queue
- Lost Reports reference list
- audit/log activity

## Important Frontend Components

### Layout/Auth

- `src/components/layout/Navbar.jsx`: primary navigation, Lost Items tab, sign-in/admin entry
- `src/components/layout/PublicLayout.jsx`: page shell with navbar/footer and skip link
- `src/components/auth/SignInDialog.jsx`: demo sign-in
- `src/components/auth/AdminAccessDialog.jsx`: admin unlock
- `src/components/auth/AdminRouteGuard.jsx`: protects admin dashboard

### Search/Records

- `src/components/search/ItemCard.jsx`: card/list rendering for Found Items and Lost Reports
- `src/components/shared/RecordThumbnail.jsx`: item/report image display
- `src/components/ui/StatusBadge.jsx`: status display for items, claims, lost reports

### Forms

- `src/components/shared/PhotoUploader.jsx`: image upload area; supports click, drag/drop, and touch-friendly remove controls
- `src/components/shared/ConsentCheckboxField.jsx`: reusable consent checkbox
- `src/components/ui/slide-button.tsx`: slide-to-submit action used in workflows
- `src/components/ui/toaster.jsx` and `src/components/ui/use-toast.jsx`: toast notifications; toasts auto-dismiss after 10 seconds

### Admin

- `src/components/admin/AdminOverview.jsx`: computed stats and charts
- `src/components/admin/AdminItemsQueue.jsx`: approve/reject/archive Found Items
- `src/components/admin/AdminClaimsQueue.jsx`: verify claims and update statuses

## Frontend API Layer

Main client:

- `src/api/appClient.js`

Responsibilities:

- calls Spring backend endpoints
- normalizes backend snake_case/camelCase differences
- has localStorage fallback when backend is unavailable
- seeds demo data for frontend fallback mode
- handles Found Item CRUD through `/api/items`
- handles generic entities through `/api/entities/:entityName`
- uploads photos through `/api/uploads`
- stores auth user in localStorage
- runs client-side matching fallback if backend is unavailable
- enforces client-side claim validation and state side effects for fallback mode

Primary entities exposed:

- `appClient.entities.FoundItem`
- `appClient.entities.LostReport`
- `appClient.entities.Claim`
- `appClient.entities.Notification`
- `appClient.entities.AuditLog`
- `appClient.entities.User`

## Backend API Layout

Spring backend path:

- `/Users/sashwatc/Developer/WebCodingDev26-Backend`

Important controllers:

- `HealthController`: `/api/health`
- `FoundItemController`: `/api/items`
- `GenericEntityController`: `/api/entities/{entityName}`
- `AuthController`: `/api/auth`
- `UploadController`: `/api/uploads`
- `MatchmakingController`: `/api/matches`

Important services:

- `FoundItemService`: create/update/list/delete found inventory
- `GenericEntityService`: generic CRUD for LostReport, Claim, Notification, AuditLog
- `WorkflowService`: claim validation, claim status side effects, archive-on-reference checks
- `MatchmakingService`: local and AI-assisted match suggestions
- `OpenAiMatchClient`: optional AI ranking via API key
- `AuthService`: demo user sign-in/upsert
- `UploadService`: base64/data URL uploads

Important models:

- `FoundItem`
- `LostReport`
- `Claim`
- `MatchSuggestion`
- `Notification`
- `AuditLog`
- `AppUser`
- `Rating`

## Main Backend Endpoints

### Found Items

```http
GET /api/items
POST /api/items
PATCH /api/items/{id}
DELETE /api/items/{id}
```

Delete behavior:

- if no claims/matches/reference: hard delete
- if referenced by claims or Lost Report match suggestions: archive by setting status to `archived`

### Generic Entities

```http
GET /api/entities/LostReport
POST /api/entities/LostReport
PATCH /api/entities/LostReport/{id}
DELETE /api/entities/LostReport/{id}

GET /api/entities/Claim
POST /api/entities/Claim
PATCH /api/entities/Claim/{id}
DELETE /api/entities/Claim/{id}

GET /api/entities/Notification
POST /api/entities/Notification
PATCH /api/entities/Notification/{id}
DELETE /api/entities/Notification/{id}

GET /api/entities/AuditLog
POST /api/entities/AuditLog
PATCH /api/entities/AuditLog/{id}
DELETE /api/entities/AuditLog/{id}
```

### Matchmaking

```http
GET /api/matches/lost-reports/{id}
POST /api/matches/lost-reports/{id}/refresh
POST /api/matches/found-items/{id}/refresh
```

## Data Model Summary

### FoundItem

Source of truth for physical inventory.

Key fields:

- `id`
- `title`
- `description`
- `category`
- `subcategory`
- `color`
- `brand`
- `locationFound`
- `dateFound`
- `timeFound`
- `status`
- `recordType`
- `photoUrls`
- `aiDescription`
- `distinguishingFeatures`
- `finderName`
- `finderEmail`
- `finderRole`
- `storageLocation`
- `condition`
- `priority`
- `itemCode`
- `assignedTo`
- `isFlagged`
- `claimConfirmed`
- `claimConfirmedAt`
- `linkedLostReportId`
- `ratings`

Important statuses:

- `pending_review`: submitted but not public
- `approved`: public and claimable
- `claimed`: an admin approved a claim
- `returned`: completed handoff
- `archived`: hidden but preserved because references exist
- `rejected`: admin rejected found item submission

### LostReport

User request for something they lost. Not inventory.

Key fields:

- `id`
- `title` / `itemType`
- `category`
- `description`
- `color`
- `brand`
- `locationLost` / `lastSeenLocation`
- `dateLost`
- `timeLost`
- `contactName`
- `contactEmail`
- `contactPhone`
- `studentId`
- `urgency`
- `extraNotes`
- `photoUrls`
- `matchedItems`
- `status`

Important statuses:

- `open`: no confirmed resolution
- `matched`: suggestions exist
- `resolved`: user/admin resolved report
- `closed`: no longer active

### MatchSuggestion

Stored inside `LostReport.matchedItems`. It references Found Items.

Key fields:

- `foundItemId`
- `foundItemTitle`
- `category`
- `color`
- `brand`
- `locationFound`
- `dateFound`
- `confidence`
- `reasons`
- `source`
- `status`
- `photoUrls`

Sources:

- `local`: deterministic local scorer
- `ai`: AI-ranked match
- `finder_response`: user clicked `I Found This` and reported a Found Item for that Lost Report
- `legacy`: old string-based match reference

Match suggestions never approve ownership by themselves.

### Claim

Ownership verification workflow tied to a Found Item.

Key fields:

- `id`
- `foundItemId`
- `foundItemTitle`
- `claimantName`
- `claimantEmail`
- `claimantPhone`
- `claimReason`
- `identifyingDetails`
- `proofPhotoUrl`
- `studentId`
- `pickupAvailability`
- `status`
- `riskScore`
- `riskFlags`
- `adminNotes`
- `reviewedBy`
- `reviewedAt`
- `receivedConfirmedAt`
- `claimantRating`
- `claimantReview`
- `reviewStatus`

Statuses:

- `submitted`
- `pending_review`
- `under_review`
- `need_more_info`
- `approved`
- `rejected`
- `completed`

Rules:

- Claim must reference an existing Found Item
- New claims must start submitted/pending, not approved/completed
- No multiple approved/completed claims for the same Found Item
- Approving a claim marks Found Item `claimed`
- Completing a claim marks Found Item `returned`
- Rejecting an approved claim can restore Found Item `approved` if no other approved claim exists

## Main User Workflows

### Browse Found Inventory

1. User opens `/Search`.
2. Frontend fetches Found Items.
3. UI filters to public available Found Items.
4. User opens `/ItemDetails?id=<foundItemId>`.
5. If item is available, user can click claim action.

### Report a Lost Item

1. User opens `/ReportLost`.
2. User enters lost item details and contact info.
3. Frontend/backend creates a Lost Report.
4. Backend/AI matchmaking runs against existing Found Items.
5. Lost Report remains separate from Found Items.
6. If matches exist, Lost Report status becomes `matched`.
7. User can view matches in dashboard or detail page.

### Report a Found Item

1. User opens `/ReportFound`.
2. User enters actual found item details.
3. Found Item is created with status `pending_review`.
4. Admin later approves it for public inventory.
5. Backend/AI matchmaking runs against Lost Reports.
6. Matches become suggestions, not final returns.

### Respond to a Lost Item With "I Found This"

1. User opens a Lost Report in `/LostItems` or `/ItemDetails?type=lost&id=...`.
2. User clicks `I Found This`.
3. App navigates to `/ReportFound?lost_report_id=<lostReportId>`.
4. Report Found form pre-fills from the Lost Report.
5. User submits a new Found Item.
6. Found Item stores `linkedLostReportId`.
7. Backend creates/refreshes a `finder_response` MatchSuggestion.
8. Admin still verifies through normal claim/found item workflow.
9. Item is not immediately returned.

### Submit a Claim

1. User opens a Found Item detail page.
2. User clicks claim.
3. `/ClaimItem?item_id=<foundItemId>` loads item details.
4. User enters identity/proof details.
5. Claim is created with `foundItemId`.
6. Found Item remains inventory until admin approval.
7. Admin reviews claim.
8. Approved claim marks item `claimed`.
9. Completed claim marks item `returned`.

### Admin Found Item Review

1. Admin opens `/AdminDashboard`.
2. Admin reviews pending Found Items in `AdminItemsQueue`.
3. Admin approves, rejects, flags, or archives.
4. Approved Found Items become public inventory.
5. Archived/rejected items are hidden from public search.

### Admin Claim Review

1. Admin opens `/AdminDashboard`.
2. Admin reviews claims in `AdminClaimsQueue`.
3. Admin can move statuses:
   - submitted -> under_review
   - under_review -> need_more_info
   - under_review/submitted -> approved
   - any review state -> rejected
   - approved -> completed
4. Backend prevents impossible states, especially multiple approved claims on one Found Item.

## Frontend UI Layout Philosophy

Do not redesign unless the requested feature requires it.

Existing UI style:

- school-operational dashboard feel
- restrained cards and panels
- searchable lists and forms
- clear status badges
- responsive mobile-first layout
- accessible controls from Radix primitives
- lucide icons
- Tailwind utility classes
- no marketing-only landing page changes unless asked

When adding features:

- follow existing route/page/component patterns
- use `appClient` for data access
- use TanStack Query for fetching/mutations
- use existing UI components in `src/components/ui`
- keep Found Items and Lost Reports separate
- preserve claim verification rules
- do not expose secrets in frontend code
- keep toasts meaningful and dismissible
- add tests/checks proportional to behavior risk

## Feature Request Template

Use this template when scoping a new feature:

```text
You are helping extend Lost Then Found, a React/Vite + Spring Boot school lost-and-found app.

Product context:
- Found Items are physical inventory and source of truth.
- Lost Reports are user requests and must stay separate from Found Items.
- Claims reference Found Items and must go through admin verification.
- Match suggestions reference Found Items and are advisory only.
- AI matchmaking may suggest matches but cannot approve ownership.

Frontend stack:
- React 18, Vite, React Router HashRouter, TanStack Query, Tailwind, Radix UI, Framer Motion.
- Data access goes through src/api/appClient.js.
- Main pages: Home, Search, LostItems, ReportFound, ReportLost, ItemDetails, ClaimItem, UserDashboard, AdminDashboard.

Backend stack:
- Spring Boot API in ../WebCodingDev26-Backend.
- MongoDB models: FoundItem, LostReport, Claim, MatchSuggestion, Notification, AuditLog, AppUser.
- Key services: FoundItemService, GenericEntityService, WorkflowService, MatchmakingService, OpenAiMatchClient.

Feature request:
[describe the feature]

Constraints:
- Do not redesign the UI unless necessary.
- Do not mix Lost Reports into Found Items.
- Do not mark items returned without admin/claim workflow.
- Keep AI suggestions advisory.
- Never expose API keys in frontend code.
- Preserve accessibility, responsive layout, and existing design conventions.

Expected output:
- Files likely affected.
- Data model/API changes if any.
- UI changes if any.
- Workflow/state-transition rules.
- Acceptance criteria.
- Tests/checks to run.
```

## Example Feature Specs

### Feature: Admin Match Review Queue

```text
Add an admin-only Match Review queue in AdminDashboard that lists active Lost Reports with MatchSuggestions. Admins should be able to open the Found Item and Lost Report side by side, dismiss bad suggestions, and encourage users to submit/complete a claim. Do not auto-approve ownership. Use existing MatchSuggestion fields and preserve Found Item as inventory source of truth.
```

### Feature: Claim Evidence Checklist

```text
Improve ClaimItem and AdminClaimsQueue with an evidence checklist. Claimants can provide optional serial number, contents description, location/time context, and photo proof. Admins see these fields grouped by confidence. Do not change claim approval rules; this only improves review quality.
```

### Feature: Lost Report Expiration

```text
Add optional expiration handling for Lost Reports. Reports older than a configurable number of days should be marked closed only by admin action or scheduled backend job. Closed reports should stay visible to admins but hidden from public LostItems. Do not delete historical reports.
```

### Feature: Public Pickup Instructions

```text
Add pickup instruction text to Found Item detail pages after claim approval. Only approved claimants should see personalized pickup guidance. Public users should not see storage location or private claimant data.
```

### Feature: Notification Center Improvements

```text
Improve UserDashboard notifications with filters for claim updates, match suggestions, and admin messages. Notifications should reference related Found Items or Lost Reports and be markable as read/unread. Keep toast notifications separate from persistent Notification records.
```

## Suggested Feature Areas

- Better admin match review workflow
- Better claim proof/evidence capture
- Lost Report lifecycle and expiration
- User notification filtering
- Inventory location audit/history
- Bulk admin actions for Found Items
- Accessibility QA checklist page
- Export reports for school office staff
- Photo comparison helper for admins
- Claim handoff checklist and receipt
- Duplicate Lost Report detection
- Duplicate Found Item detection
- More robust audit logging
- Optional email notification integration

## Acceptance Criteria Rules for Future Work

Every feature prompt should include:

- what user role uses it
- exact route/page affected
- exact data entity affected
- whether backend changes are required
- how it preserves Found Item source-of-truth
- how it handles Lost Reports separately
- how it handles claim state transitions
- what toasts/errors should say
- mobile behavior
- accessibility expectations
- commands to verify:

```bash
npm run lint
npm run typecheck
npm run build
cd ../WebCodingDev26-Backend && ./mvnw test
```

## Common Pitfalls to Avoid

- Do not create Found Items when submitting Lost Reports.
- Do not store API keys in frontend `.env.local`.
- Do not mark Found Items returned from a Lost Report match.
- Do not approve ownership from AI confidence alone.
- Do not hard-delete Found Items with claims or Lost Report references.
- Do not hide admin-only storage details in public UI mistakes.
- Do not bypass `appClient` for frontend API access unless there is a clear reason.
- Do not add new UI styling systems when Tailwind/Radix components already exist.
- Do not make broad redesigns for narrow workflow changes.

