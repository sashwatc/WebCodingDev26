import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Code2, LayoutTemplate, MonitorSmartphone, Shield } from "lucide-react";

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

const checklist = [
  "Searchable found-item catalog with filters, smart matching cues, and grid/list views",
  "Found-item reporting workflow with validation, image uploads, and tag generation",
  "Lost-item reporting workflow with match suggestions and confidence indicators",
  "Claim submission flow with verification details and admin-side risk review",
  "User dashboard for claims, reports, and notifications",
  "Admin dashboard with moderation queues, analytics, and audit activity",
  "Simple API-backed sign-in for demos and judging portability",
];

export default function Documentation() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">Documentation</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Project Documentation</h1>
        <p className="text-slate-500 max-w-3xl mx-auto leading-relaxed">
          This page summarizes the project scope, technical implementation, compatibility targets, and judging-build notes.
          It was updated on March 16, 2026.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        {documentationCards.map((card) => (
          <Card key={card.title} className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <card.icon className="w-5 h-5 text-[hsl(213,56%,24%)]" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{card.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{card.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Feature Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
            <CardTitle>Judging Build Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
                The frontend runs as a Vite React app and connects to a separate Spring Boot API for shared lost-and-found data.
            </p>
            <p>
                The application logic, page layouts, workflows, seeded data, and copy were customized for the lost-and-found scenario rather than assembled from a website theme.
            </p>
            <p>
                Restricted moderation tools still require sign-in plus the admin unlock password, so the admin workflow can be demonstrated without exposing private views to every user.
            </p>
          </CardContent>
        </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Run Locally</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>Start the backend in the Spring Boot repo:</p>
              <p><code className="rounded bg-slate-100 px-2 py-1">./mvnw spring-boot:run</code></p>
              <p><code className="rounded bg-slate-100 px-2 py-1">npm install</code></p>
              <p><code className="rounded bg-slate-100 px-2 py-1">npm run dev</code></p>
              <p>Open <code className="rounded bg-slate-100 px-2 py-1">http://localhost:5173</code>.</p>
              <p>Local API: <code className="rounded bg-slate-100 px-2 py-1">http://localhost:8080</code>.</p>
              <p>Student demo: <code className="rounded bg-slate-100 px-2 py-1">Jordan Kim</code> / <code className="rounded bg-slate-100 px-2 py-1">jordan.kim@pleasantvalley.edu</code></p>
              <p>Admin demo: <code className="rounded bg-slate-100 px-2 py-1">Avery Patel</code> / <code className="rounded bg-slate-100 px-2 py-1">avery.patel@pleasantvalley.edu</code></p>
              <p>Admin unlock password: <code className="rounded bg-slate-100 px-2 py-1">PVHS-Admin-2026</code></p>
            </CardContent>
          </Card>

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
