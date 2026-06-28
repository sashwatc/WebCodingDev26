/**
 * Privacy.jsx — Static Privacy Policy page.
 *
 * A purely presentational, read-only page. It renders a heading and a list of
 * privacy-policy sections (defined in the `sections` array below) as cards, then
 * a footer linking to the Sources & Citations page. No state, data fetching, or
 * user interaction — brand name and support email are pulled from constants so
 * the copy stays consistent app-wide.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/constants";

// The policy content: each entry becomes one titled card, rendered in order.
// Body text interpolates BRAND_NAME / SUPPORT_EMAIL from constants.
const sections = [
  {
    title: "1. Information Stored in This Build",
    body: `${BRAND_NAME} stores the information needed to demonstrate a lost-and-found workflow, such as names, email addresses, optional student IDs, item descriptions, photos, dates, and locations.`,
  },
  {
    title: "2. Where Data Is Stored",
    body: "Records and uploaded photos are stored through the configured Spring Boot backend. Local development uses the backend service running separately from this frontend.",
  },
  {
    title: "3. How Information Is Used",
    body: "Information is used only to support the demo workflow: item reporting, searching, match scoring, claim review, and dashboard notifications within this local session.",
  },
  {
    title: "4. FERPA-Informed Approach",
    body: "The project is designed with FERPA guidance in mind by avoiding unnecessary educational record data and limiting information to what is useful for item recovery and ownership verification.",
  },
  {
    title: "5. Data Retention in Demo Mode",
    body: "Hosted deployments keep data in the configured backend. Demo data and retention behavior are controlled by the backend environment used for the presentation.",
  },
  {
    title: "6. Contact and References",
    body: `For privacy-related questions, contact ${SUPPORT_EMAIL}. Official privacy references used for this page are listed on the Sources and Citations page.`,
  },
];

export default function Privacy() {
  return (
    <div className="page-shell max-w-4xl py-16">
      {/* Header: Privacy badge, title, and last-updated date */}
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3">
          <Shield className="w-3 h-3 mr-1" />Privacy
        </Badge>
        <h1 className="text-4xl font-bold text-foreground mb-3">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: March 16, 2026</p>
      </div>

      {/* Policy sections: one card per entry in the `sections` array */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="surface-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">{section.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      {/* Footer: cross-link to the Sources & Citations page */}
      <div className="mt-6 text-sm text-muted-foreground">
        See{" "}
        <Link to="/Sources" className="font-semibold text-primary hover:underline">
          Sources and Citations
        </Link>{" "}
        for the official privacy references used in this project.
      </div>
    </div>
  );
}
