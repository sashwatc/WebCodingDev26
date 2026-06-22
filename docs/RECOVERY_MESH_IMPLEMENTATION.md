# PVHS Recovery Mesh Frontend Implementation

This frontend follows the backend contract at:

```text
/Users/charank/NLCBACKEND26/WebCodingDev26-Backend/docs/RECOVERY_MESH_API_CONTRACT.md
```

No frontend route invents API endpoints outside `src/api/appClient.js`.

## Architecture Discovered

- React 18 with Vite and HashRouter.
- TanStack Query handles server state and cache refresh.
- `src/api/appClient.js` is the only API gateway.
- Existing app shell preserves public layout, admin route guard, dark mode, high contrast mode, dyslexic mode, route enhancements, and Radix/Tailwind UI conventions.

## Frontend Files Changed

- `src/App.jsx`
- `src/api/appClient.js`
- `src/pages/EventHub.jsx`
- `src/pages/Beacon.jsx`
- `src/pages/Display.jsx`
- `src/pages/PickupPass.jsx`
- `src/pages/PickupStation.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/pages/UserDashboard.jsx`
- `src/pages/ItemDetails.jsx`
- `src/pages/ReportFound.jsx`
- `src/pages/ReportLost.jsx`
- `src/pages/ClaimItem.jsx`
- `src/pages/Documentation.jsx`
- `src/pages/Sources.jsx`
- `src/components/recovery/RecoveryLinkCode.jsx`
- `src/components/ui/button.d.ts`

## Public And Private Boundaries

- Public item reads use `GET /api/items`, which returns only approved, non-restricted item DTOs.
- Admin item reads use `GET /api/admin/items` with `X-Demo-User-Email`.
- Public Event Hub and Display pages render display-feed data only.
- Public pages do not render private verification clues, storage locations, finder identity, claimant evidence, asset destinations, pass tokens, or internal custody notes.
- Admin-only Proof Vault and custody movement views rely on guarded app routes and admin headers.

## Phase Checklist

- [x] Recovery Case panels in user dashboard and admin Recovery Center.
- [x] Mission status controls with assignment affordance.
- [x] Proof Vault evidence fields in claim flow and admin item details.
- [x] Tamper-Evident Custody Ledger timeline and verification badge.
- [x] Event Hub, Beacon, and Display routes.
- [x] Event/zone prefill from URL query parameters.
- [x] Copyable Event Hub link and QR-style visual link marker.
- [x] Pauseable fullscreen Display rotation with reduced-motion support.
- [x] Asset Rescue lookup in Report Found and admin Asset Rescue panel.
- [x] Pickup Pass and guarded Pickup Station with manual code fallback.
- [x] Loss Sentinel admin panel.
- [x] Redacted Partner Relay simulation panel.
- [x] Documentation and Sources pages updated.

## Compatibility Notes

- The frontend retains HashRouter routes, so judge/demo URLs use `#/RouteName`.
- Public pages work with backend data and fall back to seeded local demo data when the API is unavailable.
- The QR-style visual marker is a demo visual/manual handoff aid; manual links and one-time codes remain the reliable fallback.
