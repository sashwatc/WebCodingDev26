# Manual Setup Tracker

Use this as a practical checklist. Do not paste secret values into this file.

## 1. Required For Local Development

- [ ] Open Terminal in `WebCodingDev26-Backend`; run `./mvnw test` first. Required now. Expected: all backend tests pass. Fallback if skipped: backend runtime issues may be missed.
- [ ] Open Terminal in `WebCodingDev26`; run `npm run lint`, `npm run typecheck`, `npm run build`. Required now. Expected: all frontend checks pass. Fallback if skipped: frontend integration regressions may be missed.
- [ ] Open `WebCodingDev26/vite.config.js`; confirm `/api` proxy target is `http://127.0.0.1:8080`. Required now. Expected: local frontend API calls reach Spring Boot. Fallback if skipped: set `VITE_API_URL` manually to backend origin.
- [ ] Open backend local env location; set `MONGO_URI` and `MONGO_DATABASE` only in ignored local/deployment env. Required for runtime, not for tests. Expected: `GET /api/health` returns connected Mongo status. Fallback if skipped: tests can run, app runtime cannot persist data.
- [ ] Open `WebCodingDev26/run`; confirm `SPRING_BACKEND_DIR` only if backend sibling path differs. Optional. Expected: `npm run ts` can auto-start backend. Fallback if skipped: start backend manually.

## 2. Required For Appwrite Email/Password Auth

- [ ] Open Appwrite Console > Project > Auth > Settings; enable Email/Password provider. Required for deployment auth. Env vars: `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`. Expected: email/password session can be created. Fallback if skipped: local demo sign-in only when backend fallback is enabled.
- [ ] Open Appwrite Console > Project > Platforms; add deployed frontend origin and local origin as Web platforms. Required for deployment auth. Env vars: same Appwrite project vars. Expected: browser auth requests are accepted. Fallback if skipped: Appwrite browser calls fail CORS/origin checks.
- [ ] Open backend deployment env; set `VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`. Required for deployment auth. Expected: backend can verify `X-Appwrite-JWT`. Fallback if skipped: backend uses local demo fallback only if enabled.
- [ ] Open backend deployment env; set `AUTH_DEMO_FALLBACK_ENABLED=false`. Required for production. Expected: forged `X-Demo-User-Email` cannot grant access. Fallback if skipped: production remains demo-grade.

## 3. Required For Google OAuth

- [ ] Open Appwrite Console > Auth > OAuth2 Providers > Google; enable Google provider. Optional for local, required if using Google in deployment. Env vars: Appwrite project vars only in this app. Expected: Google button redirects through Appwrite. Fallback if skipped: email/password auth can still work.
- [ ] Open Google Cloud Console > APIs & Services > OAuth consent screen; configure app name/support domain. Required for live Google OAuth. Env vars: provider secrets stay in Appwrite, not this repo. Expected: Google consent screen displays correct app. Fallback if skipped: Google OAuth unavailable.
- [ ] Open Google Cloud Console > Credentials; add Appwrite-provided redirect URL. Required for live Google OAuth. Expected: OAuth callback succeeds. Fallback if skipped: Google sign-in fails but email/password remains.
- [ ] Open Appwrite Console > Auth > OAuth2 Providers > Google; paste provider credentials into Appwrite only. Required for live Google OAuth. Expected: Appwrite creates session after Google callback. Fallback if skipped: Google sign-in disabled.

## 4. Required For Appwrite Email Verification

- [ ] Open Appwrite Console > Messaging/Templates or Auth email settings; configure sender/domain if using verification emails. Deployment-only unless verification required locally. Env vars: Appwrite-managed. Expected: verification email is delivered. Fallback if skipped: sessions may still work if verification is not enforced.
- [ ] Open Appwrite Console > Auth > URL settings; add allowed verification callback URL. Deployment-only. Expected: verification link returns to app origin. Fallback if skipped: verification links may land on an invalid page.
- [ ] Open frontend deployment settings; ensure the deployed origin matches Appwrite platform origin. Deployment-only. Expected: callback can mint/refresh session JWT. Fallback if skipped: user must sign in again or verification fails.

## 5. Required For MongoDB Atlas/Local Mongo

- [ ] Open MongoDB Atlas > Database > Connect; create or select database. Required for hosted runtime. Env vars: `MONGO_URI`, `MONGO_DATABASE`. Expected: backend starts and `/api/health` reports connected. Fallback if skipped: backend runtime cannot persist.
- [ ] Open MongoDB Atlas > Network Access; allow backend host IP. Required for hosted runtime. Env vars: none. Expected: backend can connect from deployment host. Fallback if skipped: database connection timeout.
- [ ] Open MongoDB Atlas > Database Access; create least-privilege DB user. Required for hosted runtime. Env vars: `MONGO_URI`. Expected: read/write allowed for app DB. Fallback if skipped: auth failure.
- [ ] For local Mongo, open terminal and start local Mongo service. Optional local alternative. Env vars: `MONGO_URI`, `MONGO_DATABASE`. Expected: local backend health connected. Fallback if skipped: use Atlas or tests only.

## 6. Required For Live Email Delivery

- [ ] Open email provider dashboard (Resend if using current provider setting); verify sending domain. Optional unless live email is required. Env vars: `NOTIFICATIONS_MODE`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `RESEND_FROM`. Expected: provider accepts outbound email. Fallback if skipped: mock/demo delivery records only.
- [ ] Open backend deployment env; set `NOTIFICATIONS_MODE` for live provider mode. Deployment-only. Expected: Recovery Pulse sends through configured provider. Fallback if skipped: mock mode records safe delivery rows.
- [ ] Open Recovery Pulse admin test UI/API; send test notification to admin account. Required after live email setup. Expected: email delivery row is `sent`. Fallback if skipped: delivery remains unverified.

## 7. Required For Live SMS Delivery

- [ ] Open Twilio Console > Phone Numbers; buy/verify sender number. Optional unless SMS is required. Env vars: `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`. Expected: SMS provider can send. Fallback if skipped: SMS deliveries are skipped/mock depending mode.
- [ ] Open Twilio Console > Messaging geographic permissions; allow destination region. Deployment-only for SMS. Expected: test SMS is accepted. Fallback if skipped: provider rejects SMS.
- [ ] Open app notification preferences; opt user into SMS with E.164 number. Required for user SMS. Expected: backend accepts preference update. Fallback if skipped: user receives email/mock only.

## 8. Required For Webhook Delivery

- [ ] Open receiving service dashboard; create HTTPS webhook endpoint. Optional integration. Env vars: `NOTIFICATION_WEBHOOK_URL`, `NOTIFICATION_WEBHOOK_SECRET`. Expected: endpoint receives Recovery Pulse payload. Fallback if skipped: webhook delivery skipped/mock.
- [ ] Open backend deployment env; set webhook URL/secret names only. Optional. Expected: provider signs or posts according to configured service. Fallback if skipped: no external webhook.
- [ ] Open receiving service logs after admin test send. Required after webhook setup. Expected: one test event received. Fallback if skipped: webhook remains unverified.

## 9. Required For Production Deployment

- [ ] Open frontend host dashboard; set build command `npm run build` and output `dist`. Required for deployment. Env vars: `VITE_API_URL`, Appwrite frontend vars. Expected: static frontend deploys. Fallback if skipped: local-only demo.
- [ ] Open backend host dashboard; set Java 21 runtime and start command using Maven/JAR. Required for deployment. Env vars: Mongo, Appwrite, auth fallback, notification vars as needed. Expected: `/api/health` responds. Fallback if skipped: frontend cannot use live backend.
- [ ] Open backend host CORS/env settings; set `FRONTEND_URL` to deployed frontend origin. Required for split deployment. Expected: browser requests are allowed. Fallback if skipped: CORS failures.
- [ ] Open Appwrite Console > Teams; create admin team and add admin users. Required for production admin. Env vars: `VITE_APPWRITE_ADMIN_TEAM_ID`. Expected: admin users can access admin routes. Fallback if skipped: no production admin unless unsafe email fallback is used.
- [ ] Open backend env; ensure `AUTH_DEMO_FALLBACK_ENABLED=false`. Required for production. Expected: demo header ignored. Fallback if skipped: security blocker.

## 10. Required After Deployment Verification

- [ ] Open deployed frontend `/Home`; search for seeded/known public item. Required after deployment. Expected: item cards load from backend. Fallback if failed: check `VITE_API_URL`, CORS, backend health.
- [ ] Open deployed frontend sign-in; sign in with Appwrite email/password. Required if Appwrite auth enabled. Expected: `/api/auth/me` returns backend user. Fallback if failed: check Appwrite platform/env.
- [ ] Open deployed Admin Dashboard as admin-team user. Required for production admin. Expected: admin queues load and non-admin user is blocked. Fallback if failed: check team membership and `VITE_APPWRITE_ADMIN_TEAM_ID`.
- [ ] Submit a Lost Report and verify no Found Item is created. Required after deployment. Expected: Lost Report appears separately with advisory matches. Fallback if failed: stop demo and inspect workflow service.
- [ ] Submit a Claim and approve/deny as admin. Required after deployment. Expected: claim state changes and notifications are recorded. Fallback if failed: inspect admin auth and claim endpoints.
- [ ] Issue and redeem a Return Pass in demo data only. Required before live judging. Expected: second redeem fails. Fallback if failed: inspect `ReturnPassService`.
- [ ] Open Event Hub/Beacon route. Optional if demo includes Event Hub. Expected: public-safe event context and editable report prefill. Fallback if failed: check event seed/admin setup.
