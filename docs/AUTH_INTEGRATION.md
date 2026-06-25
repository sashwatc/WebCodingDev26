# Auth Integration

How authentication and server-side authorization work across the React frontend
(`WebCodingDev26`) and the Spring Boot backend (`WebCodingDev26-Backend`).

## Summary

- Appwrite handles credentials (email/password + Google OAuth). The browser mints a
  short-lived Appwrite **account JWT** and sends it to the backend.
- The backend **verifies the JWT server-side** by replaying it to Appwrite's own
  `/account` endpoint. It never trusts a client-asserted identity or role.
- Identity is mapped to a backend `AppUser` by stable Appwrite ID and email.
- **Admin is decided server-side** from Appwrite team membership (or, only when no
  admin team is configured, the documented `ADMIN_EMAIL` fallback).
- The legacy name+email demo sign-in remains as an **explicit local-dev fallback**.
- Passwords are never sent to or stored by Spring Boot.

## Production behavior (Appwrite configured)

1. Set the frontend env vars (Vite):
   - `VITE_APPWRITE_ENDPOINT` (e.g. `https://cloud.appwrite.io/v1`)
   - `VITE_APPWRITE_PROJECT_ID`
2. Set the backend env vars (same values plus admin team):
   - `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`
   - `VITE_APPWRITE_ADMIN_TEAM_ID` (the Appwrite Team whose members are admins)
   - `AUTH_DEMO_FALLBACK_ENABLED=false`
3. Sign-in flow:
   - Email/password → `POST {endpoint}/account/sessions/email` then mint a JWT
     (`POST /account/jwts`, falling back to `/account/jwt`).
   - Google → redirect to `{endpoint}/account/sessions/oauth2/google`; on return the
     app mints a JWT.
   - The JWT is stored in `localStorage` and attached as `X-Appwrite-JWT` to every
     backend request by `appClient`.
4. The backend resolves the user via `GET /api/auth/me` and enforces admin on every
   admin route through `DemoAuthorizationService` → `AppwriteAuthService`.

With `AUTH_DEMO_FALLBACK_ENABLED=false`, the `X-Demo-User-Email` header is ignored,
so a forged header cannot grant access.

## Local-dev behavior (Appwrite not configured)

- Leave the `VITE_APPWRITE_*` vars unset. `appClient.auth.isAppwriteEnabled()` is
  false, so the sign-in dialog shows the name+email demo accounts.
- The backend keeps `AUTH_DEMO_FALLBACK_ENABLED=true` (default) and resolves the
  caller from `X-Demo-User-Email`, exactly as before. Admin is granted when the
  user's stored role is `admin` or the email matches `ADMIN_EMAIL`.
- This path is for development/demo only and must be disabled in production.

## Key files

Frontend:
- `src/lib/appwriteAuth.js` — dependency-free Appwrite REST auth (sessions, JWT, OAuth).
- `src/api/appClient.js` — attaches `X-Appwrite-JWT`; `auth.signIn/me/logout`,
  `auth.signInWithGoogle`, `auth.completeOAuthRedirect`.
- `src/lib/AuthContext.jsx` — finishes OAuth redirects on load; exposes `signInWithGoogle`.
- `src/components/auth/SignInDialog.jsx` — email/password + Google + accessible
  password-strength meter.
- `src/lib/passwordStrength.js` — strength estimate for sign-up feedback.

Backend:
- `service/AppwriteAuthService.java` — verifies JWT via Appwrite `/account`; admin via `/teams`.
- `service/DemoAuthorizationService.java` — JWT-first resolution + gated demo fallback.
- `controller/AuthController.java` — `GET /api/auth/me`.
- `service/AuthService.java` — `upsertFromVerifiedIdentity(...)`.

## Security notes

- JWTs and secrets are never logged or committed. Only failure categories are logged.
- A present-but-invalid JWT is rejected; it never falls through to the demo header.
- No admin identity is hardcoded for production; team membership is authoritative.

## Remaining manual setup

- Create/confirm the Appwrite project, enable the Google OAuth provider, and add the
  app origin as a Web platform.
- Create the admin Team and set `VITE_APPWRITE_ADMIN_TEAM_ID`.
- Provide all env vars above in the frontend and backend hosts (do not commit them).
- Set `AUTH_DEMO_FALLBACK_ENABLED=false` in production.
