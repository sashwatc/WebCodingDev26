/**
 * Accessibility page
 *
 * A static accessibility statement. The user reads: a hero intro, a checklist
 * of currently-implemented accessibility features, and a "Standards and Intent"
 * panel describing the WCAG/ARIA goals plus links to cited standards (Sources)
 * and a support mailto link. No state, effects, or data fetching.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { BRAND_NAME, SCHOOL_NAME, SUPPORT_EMAIL } from "@/lib/constants";

// Bullet list of accessibility features rendered (with check icons) in the
// "Current Accessibility Features" card.
const implementedFeatures = [
  "Semantic landmarks and heading structure across routed pages",
  "Working skip link that moves keyboard users directly to main content",
  "Screen-reader route announcements on page change",
  "Keyboard-accessible dialogs, menus, tabs, drawers, and form controls",
  "Visible focus treatment through component-level focus states",
  "Labels, helper copy, and validation feedback on key form fields",
  "Alt text on meaningful item images and descriptive button labels",
  "Reduced-motion support that respects user preferences",
  "Optional dyslexic reading mode and optional high-contrast display mode",
  "Responsive layouts that remain usable when zoomed and on smaller screens",
  "Status labels that communicate meaning with text, not color alone",
];

export default function Accessibility() {
  // Pure presentational component — renders static content only.
  return (
    <div className="page-shell max-w-4xl py-16">
      {/* Hero: badge, title, and intro statement */}
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3">Accessibility</Badge>
        <h1 className="text-4xl font-bold text-foreground mb-3">Accessibility Statement</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {BRAND_NAME} is designed to be usable by students, staff, and community members at {SCHOOL_NAME} with a wide
          range of access needs. This statement reflects the current judging build.
        </p>
      </div>

      {/* Two-column body: features checklist (left) + standards/intent (right) */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
        {/* Features card: renders each implementedFeatures entry with a check icon */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Current Accessibility Features</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {implementedFeatures.map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Standards/intent card: WCAG goals, ongoing-review note, action links */}
        <div className="surface-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Standards and Intent</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The project is designed against WCAG 2.2 AA guidance and WAI-ARIA authoring practices.
              Accessible Radix primitives are used for several interactive UI patterns.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Ongoing review</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is a student-built prototype, so accessibility work is treated as ongoing rather than "finished."
              The goal is continuous improvement, especially for keyboard flow, motion settings, and content clarity.
            </p>
          </div>
          {/* Action links: cited standards (Sources page) + support mailto */}
          <div className="flex flex-wrap gap-3">
            <Link to="/Sources">
              <Button variant="outline">View cited standards</Button>
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              <Button variant="outline">Contact for support</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
