# Auth Role Synchronization

## Canonical auth data flow

1. **Sign-in** → Appwrite JWT (when configured) or demo `POST /api/auth/signin` → backend returns `AppUser` with `role`.
2. **`appClient.auth.me()`** → `GET /api/auth/me` with:
   - `X-Appwrite-JWT` when Appwrite is configured and a JWT exists, or
   - `X-Demo-User-Email` only when Appwrite is off **or** no JWT is stored.
3. **`AuthContext`** stores the verified user as the single source of truth:
   - `user`, `isAuthenticated`, `isLoadingAuth`
   - `isAdmin` derived from `user.role === "admin"` (alias: `hasAdminAccess`)
4. **Navbar / guards / dashboards** read `isAdmin` from `AuthContext` only. No separate role toggle or persisted admin mode.
5. **Admin routes** use `AdminRouteGuard` → blocks until auth resolves, then requires `isAdmin`.
6. **Backend** enforces admin on all `/api/admin/*` via `DemoAuthorizationService` (unchanged).

## Local development fallback

When `VITE_APPWRITE_*` is unset:

- Demo sign-in sends name + email to `POST /api/auth/signin`.
- `findback-auth-user` stores the normalized backend user locally.
- API calls attach `X-Demo-User-Email` from that record.

Demo accounts (see `constants.js`):

- Student: `jordan.kim@pleasantvalley.edu`
- Admin: `avery.patel@pleasantvalley.edu`

## Stale storage removed / migrated

| Key | Action |
|-----|--------|
| `findback-ui-settings.isAdminMode` | Stripped on load; no longer written |
| `findback-auth-user` with stale `role` | Cleared on failed `/api/auth/me` or `/api/auth/user` refresh |
| `findback-appwrite-jwt` + demo header together | Demo header suppressed when JWT is present |
| `hasAdminAccess` mutable state / lock-admin | Removed; role is derived only |

Logout clears: `findback-appwrite-jwt`, `findback-auth-user`, legacy `isAdminMode`.

## Manual verification checklist

1. Clear site storage → sign in as student → admin nav hidden, `/AdminDashboard` blocked.
2. Clear storage → sign in as admin → admin nav visible, `/AdminDashboard` loads.
3. As student, admin API actions return 403 (backend).
4. Logout → admin nav gone, admin route blocked.
5. Refresh as admin → admin nav remains; refresh as student → no admin nav.
6. Student → logout → admin sign-in → no student role leakage.
7. Admin → logout → student sign-in → no admin UI without backend admin role.

## Appwrite setup (production)

Still required for non-demo auth:

- `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`
- Admin team: `VITE_APPWRITE_ADMIN_TEAM_ID` (or backend `ADMIN_EMAIL` fallback for demo only)
- Google OAuth redirect URLs configured in Appwrite console

## Automated tests

```bash
node --test src/lib/auth-session.test.js
cd WebCodingDev26 && npm run lint && npm run typecheck && npm run build
cd ../WebCodingDev26-Backend && ./mvnw test
```
