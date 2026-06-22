import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, BookOpen, Shield, Code2 } from "lucide-react";

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
        summary: "Reference for the local development/build workflow and lightweight deployment structure.",
      },
      {
        title: "TanStack Query React Overview",
        organization: "TanStack",
        href: "https://tanstack.com/query/latest/docs/framework/react/overview",
        summary: "Reference for query caching, invalidation, and async UI state coordination.",
      },
      {
        title: "Spring Boot Documentation",
        organization: "Spring",
        href: "https://docs.spring.io/spring-boot/index.html",
        summary: "Reference for backend controller, service, validation, and application configuration patterns.",
      },
      {
        title: "MongoDB Indexes",
        organization: "MongoDB",
        href: "https://www.mongodb.com/docs/manual/indexes/",
        summary: "Reference for unique and compound index behavior used by recovery cases and custody events.",
      },
    ],
  },
];

export default function Sources() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">Sources</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Research and Citations</h1>
        <p className="text-slate-500 max-w-3xl mx-auto leading-relaxed">
          These official references informed the accessibility, privacy, and technical decisions in this project.
          All links were reviewed on June 22, 2026.
        </p>
      </div>

      <div className="space-y-8">
        {sourceGroups.map((group) => (
          <section key={group.title}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <group.icon className="w-5 h-5 text-[hsl(213,56%,24%)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{group.title}</h2>
                <p className="text-sm text-slate-500">{group.items.length} official references</p>
              </div>
            </div>

            <div className="grid gap-4">
              {group.items.map((item) => (
                <Card key={item.href} className="border-slate-200 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {item.organization}
                        </p>
                        <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{item.summary}</p>
                      </div>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(213,56%,24%)] hover:text-[hsl(213,56%,18%)]"
                      >
                        Visit source
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
