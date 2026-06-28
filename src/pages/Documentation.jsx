/**
 * Documentation page
 *
 * A static project-documentation/overview page for judges and reviewers. The
 * user reads: a hero intro, a grid of four "what makes this project" cards, a
 * feature-inventory checklist, judging-build notes, local run instructions, and
 * links to Sources / Accessibility / Shader demo. No state or data fetching.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Code2, LayoutTemplate, MonitorSmartphone, Shield } from "lucide-react";

// Icon + title + body cards rendered in the top 2-column grid, each describing
// a pillar of the project (custom workflow, stack, a11y/privacy, responsive).
const documentationCards = [
  {
    icon: LayoutTemplate,
    title: "Custom Product Workflow",
    body: "The reporting, searching, claiming, and admin-review flows are tailored to a school lost-and-found use case rather than a generic website template.",
  },
  {
    icon: Code2,
    title: "Modern Frontend Stack",
    body: "The project uses React, React Router, TanStack Query, Radix-based UI primitives, Framer Motion, and a Spring Boot API contract.",
  },
  {
    icon: Shield,
    title: "Accessibility and Privacy Focus",
    body: "The app includes keyboard-friendly components, a skip link, route announcements, visible focus treatment, and FERPA-informed privacy language.",
  },
  {
    icon: MonitorSmartphone,
    title: "Responsive Multi-Device Layout",
    body: "Layouts, cards, forms, drawers, dashboards, and navigation adapt across phones, tablets, and desktops using responsive breakpoints and flexible grids.",
  },
];

// Feature-inventory bullet list rendered (with check icons) in the left card
// of the lower section — a quick catalog of what the app can do.
const checklist = [
  "Searchable found-item catalog with filters, smart matching cues, and grid/list views",
  "Found-item reporting workflow with validation, image uploads, and tag generation",
  "Lost-item reporting workflow with advisory match reasons and review steps",
  "Claim submission flow with verification details and admin-side risk review",
  "User dashboard for claims, reports, and notifications",
  "Admin dashboard with moderation queues, analytics, and audit activity",
  "Recovery Center with cases, likely zones, staff missions, Loss Sentinel, Asset Rescue, and Partner Relay simulation",
  "Return Pass and Pickup Station workflow with manual code fallback",
  "Simple API-backed sign-in for demos and judging portability",
];

export default function Documentation() {
  // Pure presentational component — renders static content only.
  return (
    <div className="page-shell max-w-5xl py-16">
      {/* Hero: badge, title, and scope/last-updated intro */}
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">Documentation</Badge>
        <h1 className="text-4xl font-bold text-foreground mb-4">Project Documentation</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          This page summarizes the project scope, technical implementation, compatibility targets, and judging-build notes.
          It was updated on June 22, 2026.
        </p>
      </div>

      {/* Pillar cards grid: one card per documentationCards entry */}
      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {documentationCards.map((card) => (
          <div key={card.title} className="archive-card">
            <div className="p-6">
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-4">
                <card.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">{card.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lower section: feature inventory (left) + build notes/run/links (right) */}
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* Feature inventory card: renders each checklist entry with a check icon */}
        <div className="surface-card p-6">
          <p className="section-label mb-4">Feature Inventory</p>
          <div className="space-y-3">
            {checklist.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: judging notes, local run commands, and footer links */}
        <div className="space-y-6">
          {/* Judging build notes card */}
          <div className="surface-card p-6 space-y-3">
            <p className="section-label">Judging Build Notes</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The frontend runs as a Vite React app and connects to a separate Spring Boot API for shared lost-and-found data.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The application logic, page layouts, workflows, seeded data, and copy were customized for the lost-and-found scenario rather than assembled from a website theme.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Restricted moderation tools require an authenticated admin account. The backend verifies the session and enforces admin-only routes server-side.
            </p>
          </div>

          {/* Run-locally card: backend/frontend commands, URLs, demo accounts */}
          <div className="surface-card p-6 space-y-2">
            <p className="section-label mb-2">Run Locally</p>
            <p className="text-sm text-muted-foreground">Start the backend in the Spring Boot repo:</p>
            <p><code className="rounded bg-muted px-2 py-1 text-sm">./mvnw spring-boot:run</code></p>
            <p><code className="rounded bg-muted px-2 py-1 text-sm">npm install</code></p>
            <p><code className="rounded bg-muted px-2 py-1 text-sm">npm run dev</code></p>
            <p className="text-sm text-muted-foreground">Open <code className="rounded bg-muted px-2 py-1">http://localhost:5173</code>.</p>
            <p className="text-sm text-muted-foreground">Local API: <code className="rounded bg-muted px-2 py-1">http://localhost:8080</code>.</p>
            <p className="text-sm text-muted-foreground">Student demo: <code className="rounded bg-muted px-2 py-1">Jordan Kim</code> / <code className="rounded bg-muted px-2 py-1">jordan.kim@pleasantvalley.edu</code></p>
            <p className="text-sm text-muted-foreground">Admin demo: <code className="rounded bg-muted px-2 py-1">Avery Patel</code> / <code className="rounded bg-muted px-2 py-1">avery.patel@pleasantvalley.edu</code></p>
            <p className="text-sm text-muted-foreground">Production admin access is controlled by Appwrite team membership; local demo access uses the backend demo fallback only when enabled.</p>
          </div>

          {/* Footer links to related pages */}
          <div className="flex flex-wrap gap-3">
            <Link to="/Sources">
              <Button variant="outline">View Sources</Button>
            </Link>
            <Link to="/Accessibility">
              <Button variant="outline">Accessibility Statement</Button>
            </Link>
            <Link to="/ShaderDemo">
              <Button variant="outline">Shader Demo</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
