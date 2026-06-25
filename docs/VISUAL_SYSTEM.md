# Visual System — Recovery Archive

Lost Then Found uses a **Recovery Archive** aesthetic: premium campus recovery (Apple Support × museum catalog × PVHS front desk). Tokens live in `src/index.css`; Tailwind maps them in `tailwind.config.js`.

## Theme tokens

| Token | Role |
|-------|------|
| `--canvas` / `bg-canvas` | Page backdrop (warm paper light / deep ink dark) |
| `--background` | Primary page fill |
| `--surface` / `--surface-elevated` | Cards, scanner toolbar, elevated panels |
| `--foreground` | Primary navy (light) / warm white (dark) typography |
| `--muted-foreground` | Secondary catalog copy |
| `--primary` | Navy action buttons and nav emphasis |
| `--ring` | Amber focus ring (PVHS accent) |
| `--border` | Graphite dividers |
| `--overlay` | Dialog/sheet scrim base |
| `--status-lost` / `--status-found` / `--status-warning` | Semantic state accents (amber / emerald / error) |

Use semantic classes (`bg-card`, `text-foreground`, `border-border`) — not raw hex in components.

## Spacing, radius, shadow

- **Radius:** `--radius: 0.625rem` (10px). Buttons/cards use `rounded-lg`; evidence chips `rounded-md`.
- **Shadows:** `shadow-archive-sm` (rest), `shadow-archive-md` (galleries), `shadow-archive-lift` (hover).
- **Page gutters:** `.page-shell` (max 7xl), `.home-section` (max 5xl).
- **Density:** Compact metadata rows; 4px grid gaps on filter chips; card padding `p-4`–`p-6`.

## Motion (`src/lib/motion.js`)

Framer Motion presets; `App.jsx` sets `MotionConfig reducedMotion="user"`.

| Preset | Use |
|--------|-----|
| `fadeUp` | Page sections (Home, ItemDetails) |
| `staggerList` / `staggerItem` | Search results, report cards |
| `cardLift` | Catalog card hover |
| `caseFileExpand` | Future case-file panels |

No autoplay counters, typewriter, or decorative floats. Scanner beam on Home search respects `prefers-reduced-motion`.

## Component rules

- **Buttons:** Navy primary, `rounded-lg`, visible `ring-ring/25` focus. No neon/glass effects.
- **Badges:** Uppercase evidence labels (`variant="evidence"`); status badges keep text + color from `constants.js`.
- **Item cards:** `.archive-card`, `.archive-thumb`, `.evidence-chip` metadata.
- **Search:** `.search-toolbar` scanner bar, `.quick-filter-chip` filters, `.search-state-panel` empty/error.
- **Item detail:** `.case-file-gallery`, `.case-file-meta-cell` catalog layout.
- **Dialogs/dropdowns:** `bg-popover`, `border-border`, `bg-overlay` scrims (shared UI primitives).

## Pages updated in this rollout

- Navbar, Home, Search, ItemCard, ItemDetails
- Shared: `button`, `badge`, `skeleton`, `index.css`, `motion.js`

## Next rollout targets

- Report Lost / Report Found (case-file sections, progress rail)
- Claim Item + User Dashboard (status timeline from backend state)
- Admin command center tables (density pass only)
- Event Hub, Pickup Pass/Station, static marketing pages
- Status timeline component (Reported → Matched → Claim Review → Pickup Ready → Returned)
