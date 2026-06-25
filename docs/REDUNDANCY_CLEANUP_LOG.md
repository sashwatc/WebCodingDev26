# Redundancy Cleanup Log

Cleanup rule used: remove only items proven redundant by imports, scripts, routes, endpoint usage, tests, and build output. Do not remove optional/future-ready features or endpoints merely because the current navigation does not link them.

## Removed In This Audit

None.

No file, code path, dependency, or endpoint met the strict proof threshold for safe removal. The audit found several suspicious legacy areas, but each still has references or could affect documented/manual workflows.

| Item removed | Proof it was redundant | Replacement or surviving code path | Test/build verification after removal |
|---|---|---|---|
| None | No conclusive removal candidate | N/A | N/A |

## Manual Review Candidates — Not Removed

| Candidate | Evidence found | Why not removed |
|---|---|---|
| `WebCodingDev26/backend/**` legacy Express/Mongoose/Supabase server | `backend/server.js`, `routes/*`, `models/*`, and `lib/*` duplicate older API behavior; active `npm run ts` starts the sibling Spring Boot backend instead. | Root `server.js`, dependencies, and old guide references still point at this tree. Removing it would be broad and outside a verified cleanup. |
| `WebCodingDev26/server.js` | It imports `./backend/server.js`, while active local integration uses Vite proxy to Spring Boot. | It is a direct entry point for the legacy server and may still be intentionally preserved for comparison/manual review. |
| Frontend dependencies `express`, `mongoose`, `@supabase/supabase-js`, `mongodb`, `cors`, `dotenv` | Used by `backend/**` legacy server; not imported by active React code. | Cannot remove until legacy server is explicitly retired. Removing packages would break that documented legacy path. |
| `WEBSITE_GUIDE.md` old Express references | Contains `node server.js`, `Express backend`, and legacy run notes that conflict with current Spring Boot integration. | Documentation may be historical/judging guide material. Audit docs now supersede it; no deletion performed. |
| `appClient.recoveryMesh` compatibility aliases and local recovery fallbacks | Current pages use feature clients directly; aliases remain in `appClient.js`. | Compatibility/future-ready path is explicitly documented; removing could break older pages or demos. |
| `claimCaseMessages` frontend client and hooks | Frontend imports them, but backend `/case-messages` endpoints are missing. | Feature is visibly wired and not redundant; it is an integration gap, not a deletion candidate. |
| Backend static Appwrite route support (`AppwriteConfigController`, `WebRouteController`) | React frontend uses HashRouter and Appwrite REST helper, while backend has static route support. | Backend may still serve static packaged flows; endpoint removal would be unsafe. |
| Optional AI assistance and OpenAI/Ollama-related services | Some functionality is optional/config-gated. | Explicitly protected by task constraints; not removed. |

## Verification Plan

- Frontend `npm run lint && npm run typecheck && npm run build` passed.
- Backend `./mvnw test` passed with 80 tests.
- Because nothing was removed, verification focused on ensuring audit fixes did not regress existing code.
