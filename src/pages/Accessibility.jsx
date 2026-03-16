/**
 * FindBack AI - Accessibility Statement Page
 * Summarizes the current accessibility implementation and the standards used to guide it.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const implementedFeatures = [
  "Semantic landmarks and heading structure across routed pages",
  "Working skip link that moves keyboard users directly to main content",
  "Screen-reader route announcements on page change",
  "Keyboard-accessible dialogs, menus, tabs, drawers, and form controls",
  "Visible focus treatment through component-level focus states",
  "Labels, helper copy, and validation feedback on key form fields",
  "Alt text on meaningful item images and descriptive button labels",
  "Reduced-motion support that respects user preferences",
  "Responsive layouts that remain usable when zoomed and on smaller screens",
  "Status labels that communicate meaning with text, not color alone",
];

export default function Accessibility() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3">Accessibility</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Accessibility Statement</h1>
        <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
          FindBack AI is designed to be usable by students, staff, and community members with a wide range of
          access needs. This statement reflects the implementation reviewed on March 16, 2026.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Accessibility Features</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {implementedFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Standards and Intent</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                The project is designed against WCAG 2.2 AA guidance and WAI-ARIA authoring practices.
                Accessible Radix primitives are used for several interactive UI patterns.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Ongoing review</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                This is a student-built prototype, so accessibility work is treated as ongoing rather than “finished.”
                The goal is continuous improvement, especially for keyboard flow, motion settings, and content clarity.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/Sources">
                <Button variant="outline">View cited standards</Button>
              </Link>
              <a href="mailto:lostandfound@school.edu">
                <Button variant="outline">Contact for support</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
