# FindBack AI

FindBack AI is a React-based lost-and-found website built for the FBLA Website Coding & Development event. It focuses on a school use case with searchable found items, lost-item reporting, claim verification, admin review tools, accessibility support, and judging-ready documentation.

## Project Highlights

- Custom school lost-and-found workflow with pages for home, search, report found, report lost, item details, claiming, user dashboard, admin dashboard, FAQ, privacy, accessibility, sources, and project documentation
- Responsive layouts designed for phones, tablets, and desktops
- Local sign-in and local data persistence so the judging build runs without external services
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

## Build and Quality Checks

```bash
npm run lint
npm run build
```

## Judging Build Notes

- This version is intentionally standalone.
- Records and sign-in state are stored in the current browser using local storage.
- The application logic, page flows, seeded records, and content are customized for this project rather than assembled from a generic website template.

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
