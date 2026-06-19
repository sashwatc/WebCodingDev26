# Lost Then Found

Lost Then Found is a React-based PVHS lost-and-found website built for the FBLA Website Coding & Development event. It focuses on searchable found items, lost-item reporting, claim verification, admin review tools, accessibility support, and judging-ready documentation.

## Project Highlights

- Custom school lost-and-found workflow with pages for home, search, report found, report lost, item details, claiming, user dashboard, admin dashboard, FAQ, privacy, accessibility, sources, and project documentation
- Responsive layouts designed for phones, tablets, and desktops
- Spring Boot-ready API integration for all entities, uploads, and sign-in records
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

Open `http://localhost:5173`.

Notes:

- Start the Spring Boot backend separately:

  ```bash
  cd path/to/spring-backend
  ./mvnw spring-boot:run
  ```

- The backend runs on `http://localhost:8080`.
- The frontend calls `/api/*`, and Vite proxies those requests to `http://127.0.0.1:8080` during local development.
- Leave `VITE_API_URL` blank for local Vite development.
- Demo student account: `Jordan Kim` / `jordan.kim@pleasantvalley.edu`
- Demo admin account: `Avery Patel` / `avery.patel@pleasantvalley.edu`
- Admin unlock password: `PVHS-Admin-2026`

## Build and Quality Checks

```bash
npm run lint
npm run build
```

## Deployment

For a standard frontend deployment:

```bash
npm install
npm run build
```

Deploy the built frontend from `dist/` and run the Spring Boot API as a separate backend service.

### Data Storage

- Local development data is seeded by the Spring Boot backend.
- The frontend can also fall back to its local browser cache if the backend is unavailable.

### Split Frontend / Backend Deployments

If you deploy the frontend and backend separately, set `VITE_API_URL` during the frontend build so the site knows where to reach the API.

Example:

```bash
VITE_API_URL=https://your-backend-domain.com npm run build
```

Do not include `/api` at the end of `VITE_API_URL`.

## Judging Build Notes

- The app is intended to run against the Spring Boot API for hosted deployments.
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
