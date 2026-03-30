# Lost Then Found

Lost Then Found is a React-based PVHS lost-and-found website built for the FBLA Website Coding & Development event. It focuses on searchable found items, lost-item reporting, claim verification, admin review tools, accessibility support, and judging-ready documentation.

## Project Highlights

- Custom school lost-and-found workflow with pages for home, search, report found, report lost, item details, claiming, user dashboard, admin dashboard, FAQ, privacy, accessibility, sources, and project documentation
- Responsive layouts designed for phones, tablets, and desktops
- Supabase-ready backend routing for all entities, uploads, and sign-in records, with local fallback for offline judging
- Intelligent matching helpers for lost reports, suggested tags, and claim risk scoring
- Accessibility improvements including a skip link, route announcements, keyboard-friendly components, reduced-motion support, and visible focus treatment

## Tech Stack

- React 18
- React Router
- TanStack Query
- Vite
- Tailwind CSS
- Radix UI primitives
- Framer Motion

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:4173`.

Notes:

- `npm run dev` uses a preview-safe static server so it works in embedded IDE previews and browser tabs.
- If you want the standard Vite dev server with HMR in a normal browser, run `npm run dev:vite` and open `http://localhost:5173`.
- When using `npm run dev`, refresh the page after code changes to see the rebuilt output.
- Demo student account: `Jordan Kim` / `jordan.kim@pleasantvalley.edu`
- Demo admin account: `Avery Patel` / `avery.patel@pleasantvalley.edu`
- Admin unlock password: `PVHS-Admin-2026`

`npm run dev` now starts both parts of the app:

- the website on `http://localhost:4173`
- the items API on `http://localhost:5001`

The website calls `/api/items`, and Vite proxies that to the local backend during development.

## Build and Quality Checks

```bash
npm run lint
npm run build
```

## Deployment

For a standard deployment, build the frontend and run the Node server:

```bash
npm install
npm run build
npm start
```

This serves both:

- the built frontend
- the `/api/*` backend routes

from the same deployment and same origin, which means the website can load backend items without extra proxy setup.

### Data Storage

- If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, the full app data layer uses Supabase.
- If Supabase is not configured but `MONGO_URI` is set, found items and entities fall back to MongoDB-backed collections.
- If neither hosted backend is configured, the app uses local seeded JSON files so the judging build still works offline.

### Supabase Setup

1. Create a Supabase project.
2. Run [schema.sql](/Users/arjuntambe/WebCodingDev26/supabase/schema.sql) in the Supabase SQL editor.
3. Add the variables from [.env.example](/Users/arjuntambe/WebCodingDev26/.env.example) to your deployment:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `SUPABASE_STORAGE_BUCKET`.
4. Start the app with `npm start` or `npm run dev`.

The server automatically creates the configured storage bucket if it does not already exist and uploads item photos there.

### Split Frontend / Backend Deployments

If you deploy the frontend and backend separately, set `VITE_API_URL` during the frontend build so the site knows where to reach the API.

Example:

```bash
VITE_API_URL=https://your-api.example.com npm run build
```

## Judging Build Notes

- The app can run against Supabase for hosted deployments or local seeded files for offline judging.
- The application logic, page flows, seeded records, and content are customized for this project rather than assembled from a generic website template.
- Admin views require sign-in plus the admin unlock password in this build.

## Accessibility

The project is designed around WCAG-informed practices, including:

- Semantic page structure and headings
- Keyboard-accessible dialogs, tabs, menus, and drawers
- A working skip-to-content link
- Screen-reader route announcements
- Reduced-motion support
- Descriptive labels and validation feedback on forms

See the in-app accessibility statement at `/Accessibility`.

## Sources and Citations

Official references used in the project are listed on the in-app Sources page at `/Sources`. They include:

- W3C Web Content Accessibility Guidelines (WCAG)
- W3C WAI-ARIA Authoring Practices Guide
- U.S. Department of Education student privacy resources and FERPA regulations
- React, Vite, TanStack Query, and Radix documentation
