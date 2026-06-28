/**
 * Terms — a static "Terms of Use" legal page.
 *
 * Purpose: presents the project's terms of use as a series of titled sections.
 * It is a read-only informational page with no state, effects, data fetching,
 * or handlers. The user simply reads the numbered terms sections.
 *
 * Content is driven by the hard-coded `terms` array; some entries interpolate
 * the app's BRAND_NAME constant so the product name stays consistent.
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { BRAND_NAME } from "@/lib/constants";

// Static legal content. Each entry is one term section with a `title` heading
// and a `body` paragraph. Bodies using template literals inject BRAND_NAME so
// the displayed product name follows the shared constant.
const terms = [
  {
    title: "1. Acceptable Use",
    body: `${BRAND_NAME} is intended for legitimate lost-and-found activity within a school environment. Users should provide accurate details and should not misuse the system for harassment, fraud, or false submissions.`,
  },
  {
    title: "2. Honest Claims and Reports",
    body: "Submitting misleading ownership claims or fake found-item records is prohibited. Administrators may review risk signals, proof details, and item history before approving a return.",
  },
  {
    title: "3. Local Demo Environment",
    body: "This version of the app is a standalone judging build. It is designed to demonstrate workflow and functionality rather than operate as a live school production system.",
  },
  {
    title: "4. Availability and Accuracy",
    body: `${BRAND_NAME} improves organization and item matching, but it does not guarantee that every lost item will be recovered or that every suggested match is correct.`,
  },
  {
    title: "5. Content Responsibility",
    body: "Users are responsible for the information and images they submit. Administrators may edit, reject, or remove records that are inaccurate, incomplete, or inappropriate.",
  },
  {
    title: "6. Changes to the Project",
    body: "The project may be updated as part of development, judging preparation, or future deployment planning. Continued use of the app indicates acceptance of the current version.",
  },
];

export default function Terms() {
  return (
    <div className="page-shell max-w-4xl py-16">
      {/* Page heading: "Legal" badge, title, and last-updated date (centered) */}
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3">Legal</Badge>
        <h1 className="text-4xl font-bold text-foreground mb-3">Terms of Use</h1>
        <p className="text-sm text-muted-foreground">Last updated: March 16, 2026</p>
      </div>

      {/* One card per term section, rendered from the `terms` array */}
      <div className="space-y-4">
        {terms.map((section) => (
          <div key={section.title} className="surface-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">{section.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
