# Theme Audit — Light/Dark Mode

## Root causes fixed

1. **Scoped dark overrides** — Legacy slate/white utility overrides only applied inside `#main-content`, so portaled UI (dialogs, dropdowns, selects, toasts, sheets) stayed light-themed.
2. **Hardcoded surfaces in shared primitives** — Card, input, select, tabs, dialog close, toast close, and button outline variants used light-only `bg-white` / `text-slate-*` instead of CSS variable tokens (`bg-background`, `text-foreground`, `border-border`).
3. **Missing component CSS** — `item-card-compact`, `search-state-panel`, and page shell utilities referenced classes with no theme-aware definitions.
4. **Status badges** — `constants.js` status tones were light-only (`bg-*-100 text-*-800`) with no dark companions.
5. **Incomplete accessibility token wiring** — High-contrast and dyslexic reading modes were stored in `ModeContext` but had no global CSS rules.

## Shared files updated

- `src/index.css` — semantic page shells, item/search cards, document-wide dark compatibility layer, tinted status panels, high-contrast + dyslexic rules
- `src/lib/constants.js` — status/urgency dark tone helpers
- UI primitives: `card`, `input`, `textarea`, `select`, `dialog`, `dropdown-menu`, `popover`, `tabs`, `checkbox`, `badge`, `button`, `toast`, `alert-dialog`, `sheet`
- Layout/auth/shared: `Navbar`, `Footer`, `SignInDialog`, `AdminAccessDialog`, `RecordThumbnail`, `AppErrorBoundary`, `App.jsx` loader, `PageNotFound`, `UserNotRegisteredError`

## Manual visual review still recommended

- **Admin dashboard panels** (`AdminDashboard.jsx`, `AdminOverview.jsx`, `AdminClaimsQueue.jsx`, `AdminItemsQueue.jsx`) — many inline tinted callouts; global dark tint overrides help but spot-check claim review and demo builder tabs.
- **Report Found / Report Lost** — long multi-section forms with mixed utility classes; verify photo upload and crop dialog overlays.
- **Pickup Pass / Pickup Station** — security-sensitive screens with custom emerald panels.
- **Charts** (`AdminOverview`) — Recharts tooltips use tokens; confirm axis label contrast on dark backgrounds.
- **Marketing/static pages** (`About`, `Documentation`, `FAQ`) — lower traffic; rely on global compatibility layer.
- **index.html boot splash** — inline light-only styles before React hydrates (expected flash).

## How theme works

- `ModeProvider` toggles `document.documentElement.classList` (`dark`) and `data-contrast-mode` / `data-reading-mode`.
- Prefer semantic Tailwind tokens from `src/index.css` (`background`, `foreground`, `card`, `muted`, `border`, `popover`, `destructive`).
- Navbar **Display settings** controls light/dark; contrast/dyslexic modes persist via localStorage when set programmatically.
