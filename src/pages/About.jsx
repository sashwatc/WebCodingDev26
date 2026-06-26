import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Brain,
  Code,
  Heart,
  MonitorSmartphone,
  Shield,
  Users,
  Workflow,
} from "lucide-react";
import { BRAND_NAME, SCHOOL_NAME } from "@/lib/constants";

const highlights = [
  {
    icon: Workflow,
    title: "Built around a real school workflow",
    description: "The product focuses on the full lost-and-found loop: intake, search, match review, claim verification, and return tracking.",
  },
  {
    icon: Brain,
    title: "Intelligent matching logic",
    description: "The app compares category, brand, color, location, timing, and description overlap to surface likely matches with confidence cues.",
  },
  {
    icon: Shield,
    title: "Privacy-aware design",
    description: "Sensitive storage information is restricted to authenticated admin views, and the data model is designed for school workflow auditing and recovery review.",
  },
  {
    icon: MonitorSmartphone,
    title: "Split frontend/backend deployment",
    description: "The React frontend talks to a Spring Boot API locally through Vite proxying and in production through a configured API URL.",
  },
];

const technicalNotes = [
  "React 18 with React Router for the application shell and page routing",
  "TanStack Query for cached entity reads, invalidation, and async UI refresh",
  "Radix-based UI primitives for accessible dialogs, menus, tabs, and drawers",
  "Framer Motion with reduced-motion support for intentional but restrained animation",
  "Spring Boot API integration for items, reports, claims, notifications, audit logs, auth, and uploads",
];

export default function About() {
  return (
    <div className="page-shell max-w-5xl py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">About</Badge>
        <h1 className="text-4xl font-bold text-foreground mb-4">About {BRAND_NAME}</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          {BRAND_NAME} is a student-built lost-and-found platform for {SCHOOL_NAME}. It combines modern frontend
          development, thoughtful UX, and accessibility-minded workflows to make item recovery faster and more organized.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {highlights.map((item) => (
          <div key={item.title} className="archive-card">
            <div className="p-6">
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">{item.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 mb-10">
        <div className="surface-card p-7 space-y-4">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Technical Snapshot</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The project emphasizes original workflows and application logic rather than relying on a premade site template.
            The frontend stays focused on the user experience while a separate Spring Boot service owns persistence and API workflows.
          </p>
          <div className="space-y-3">
            {technicalNotes.map((note) => (
              <div key={note} className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dark CTA card — intentionally navy-themed */}
        <div className="rounded-2xl p-7 h-full flex flex-col" style={{ background: "hsl(var(--primary))", color: "#fff" }}>
          <Heart className="w-8 h-8 text-red-400 mb-4" />
          <h2 className="text-xl font-bold mb-3">Built for FBLA 2025-2026</h2>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            The project demonstrates responsive design, client-side data architecture, structured forms,
            admin tooling, accessibility work, and polished visual presentation.
          </p>
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 mt-0.5 text-cyan-300" />
              <span>Audience: students, staff, and front-office administrators</span>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 text-cyan-300" />
              <span>Priorities: findability, trust, privacy, and clear ownership verification</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/Documentation">
              <Button size="sm" className="bg-white text-primary hover:bg-white/90 gap-2">
                Project Documentation
              </Button>
            </Link>
            <Link to="/Sources">
              <Button size="sm" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white gap-2">
                Sources
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
