# AI Agent Guardrails

These rules are permanent project instructions for AI agents working in this frontend repo.

## Scope And Safety
- Do not edit secrets, `.env`, `.env.local`, credentials, tokens, or provider keys.
- Do not install packages unless the user explicitly asks.
- Do not commit or push automatically. Only commit or push when the user explicitly asks in the current turn.
- Do not change application behavior while doing documentation, planning, review, or baseline tasks.

## Product Invariants
- Found Items are inventory records for physical items already turned in.
- Lost Reports are separate student reports and must not fabricate inventory.
- Claims require admin review before an item is considered verified, returned, or resolved.
- Do not create fake metrics, fake backend-owned records, or frontend-only workflow state for dashboards, recovery cases, sentinel alerts, delivery records, custody, or return passes.
- Do not expose private evidence, storage location, finder private contact, claimant private contact, proof vault data, or return-pass codes/tokens/instructions in public UI or public API responses.

## Frontend Rules
- Use `src/api/appClient.js` as the sole API gateway. Pages and components must not call raw `fetch`, `axios`, or hard-coded `/api/*` URLs directly.
- Keep backend-facing payloads in `snake_case` unless `appClient` performs explicit normalization.
- Preserve accessibility: semantic markup, labels, focus states, keyboard support, skip/route announcements, and reduced-motion behavior.
- Preserve responsive behavior across mobile, tablet, and desktop layouts.
- Keep local fallback data from masking backend-owned workflow failures.

## Required Checks
- Frontend: `npm run lint`
- Frontend: `npm run build`
- Full local flow when needed: `npm run ts`
- Do not run destructive commands or reset user changes.
