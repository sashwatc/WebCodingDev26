/**
 * FindBack AI - About Page
 * Explains the project goals, architecture, and judging-build choices.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    description: "Sensitive storage information is restricted to admin views, and the privacy copy reflects the current standalone browser-based build.",
  },
  {
    icon: MonitorSmartphone,
    title: "Portable judging build",
    description: "The current version runs without external services so judges can open it locally and experience the full workflow on any device size.",
  },
];

const technicalNotes = [
  "React 18 with React Router for the application shell and page routing",
  "TanStack Query for cached entity reads, invalidation, and async UI refresh",
  "Radix-based UI primitives for accessible dialogs, menus, tabs, and drawers",
  "Framer Motion with reduced-motion support for intentional but restrained animation",
  "Browser localStorage for a self-contained demo data layer and local sign-in state",
];

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">About</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">About FindBack AI</h1>
        <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
          FindBack AI is a student-built lost-and-found platform for schools. It combines modern frontend
          development, thoughtful UX, and accessibility-minded workflows to make item recovery faster and more organized.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {highlights.map((item) => (
          <Card key={item.title} className="border border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-teal-700" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 mb-10">
        <Card className="border-slate-200">
          <CardContent className="p-7 space-y-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-[hsl(213,56%,24%)]" />
              <h2 className="text-xl font-bold text-slate-900">Technical Snapshot</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              The project emphasizes original workflows and application logic rather than relying on a premade site template.
              The judging build keeps persistence local so the full experience is runnable without provisioning a backend.
            </p>
            <div className="space-y-3">
              {technicalNotes.map((note) => (
                <div key={note} className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-500 flex-shrink-0" />
                  <p className="text-sm text-slate-600">{note}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(213,56%,22%)] text-white border-0">
          <CardContent className="p-7 h-full flex flex-col">
            <Heart className="w-8 h-8 text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-3">Built for FBLA 2025-2026</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              The project demonstrates responsive design, client-side data architecture, structured forms,
              admin tooling, accessibility work, and polished visual presentation.
            </p>
            <div className="space-y-2 text-sm text-slate-300">
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
                <Button size="sm" className="bg-white text-[hsl(213,56%,22%)] hover:bg-slate-100 gap-2">
                  Project Documentation
                </Button>
              </Link>
              <Link to="/Sources">
                <Button size="sm" variant="outline" className="border-white/25 text-white hover:bg-white/10 gap-2">
                  Sources
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
