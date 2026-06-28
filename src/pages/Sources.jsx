/**
 * Sources — a static "Research and Citations" reference page.
 *
 * Purpose: lists the official external references that informed the project's
 * accessibility, student-privacy, and technical decisions. It is a read-only
 * informational page — no state, effects, data fetching, or handlers. The user
 * reads grouped citations and can click "Visit source" to open each reference
 * in a new browser tab.
 *
 * Structure: all content is driven by the hard-coded `sourceGroups` array
 * below; the component just maps over it to render sections and cards.
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen, Shield, Code2 } from "lucide-react";

// Static citation data. Each group has a heading, a lucide icon, and a list of
// reference items; each item carries the title, owning organization, external
// URL (href), and a one-line summary of how it was used in the project.
const sourceGroups = [
  {
    title: "Accessibility and Inclusive Design",
    icon: BookOpen,
    items: [
      {
        title: "Web Content Accessibility Guidelines (WCAG) Overview",
        organization: "W3C Web Accessibility Initiative",
        href: "https://www.w3.org/WAI/standards-guidelines/wcag/",
        summary: "Primary accessibility standard used to guide semantic structure, focus states, contrast decisions, and zoom support.",
      },
      {
        title: "WAI-ARIA Authoring Practices Guide",
        organization: "W3C Web Accessibility Initiative",
        href: "https://www.w3.org/WAI/ARIA/apg/",
        summary: "Reference for keyboard interaction and accessible patterns such as dialogs, menus, tabs, and disclosures.",
      },
      {
        title: "Accessibility Overview",
        organization: "Radix UI",
        href: "https://www.radix-ui.com/primitives/docs/overview/accessibility",
        summary: "Used as a technical reference for accessible component primitives in the UI layer.",
      },
    ],
  },
  {
    title: "Student Privacy and Responsible Data Use",
    icon: Shield,
    items: [
      {
        title: "Protecting Student Privacy",
        organization: "U.S. Department of Education",
        href: "https://studentprivacy.ed.gov/",
        summary: "Primary federal source for student privacy guidance used when drafting the privacy and data-handling language.",
      },
      {
        title: "FERPA Regulations",
        organization: "U.S. Department of Education",
        href: "https://studentprivacy.ed.gov/resources/family-educational-rights-and-privacy-act-regulations-ferpa",
        summary: "Referenced for FERPA-aligned language and for clarifying that the platform should avoid collecting unnecessary student record data.",
      },
    ],
  },
  {
    title: "Technical References",
    icon: Code2,
    items: [
      {
        title: "React Documentation",
        organization: "React",
        href: "https://react.dev/",
        summary: "Used for component architecture, state management patterns, and accessibility-friendly React practices.",
      },
      {
        title: "Vite Guide",
        organization: "Vite",
        href: "https://vite.dev/guide/",
        summary: "Referenced for build configuration, local proxy setup, and environment variable handling.",
      },
      {
        title: "TanStack Query Documentation",
        organization: "TanStack",
        href: "https://tanstack.com/query/latest/docs/framework/react/overview",
        summary: "Used for data-fetching patterns, cache invalidation strategy, and async state management across the application.",
      },
      {
        title: "Radix UI Primitives",
        organization: "Radix UI",
        href: "https://www.radix-ui.com/primitives",
        summary: "Headless accessible primitives used for dialogs, menus, tabs, accordions, and other interactive components.",
      },
    ],
  },
];

export default function Sources() {
  return (
    <div className="page-shell max-w-5xl py-16">
      {/* Page intro: badge, title, and explanatory blurb (centered) */}
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">Sources</Badge>
        <h1 className="text-4xl font-bold text-foreground mb-4">Research and Citations</h1>
        <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          These official references informed the accessibility, privacy, and technical decisions in this project.
          All links were reviewed on June 22, 2026.
        </p>
      </div>

      {/* One <section> per citation group */}
      <div className="space-y-8">
        {sourceGroups.map((group) => (
          <section key={group.title}>
            {/* Group header: icon badge, group title, and a count of references in the group */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <group.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{group.title}</h2>
                <p className="text-sm text-muted-foreground">{group.items.length} official references</p>
              </div>
            </div>

            {/* One card per reference item within this group */}
            <div className="grid gap-4">
              {group.items.map((item) => (
                <div key={item.href} className="archive-card">
                  <div className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left: organization label, reference title, and usage summary */}
                      <div className="space-y-1">
                        <p className="section-label">{item.organization}</p>
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>
                      </div>
                      {/* Right: external link opening the source in a new tab (rel=noreferrer for safety) */}
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 transition-opacity shrink-0"
                      >
                        Visit source
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
