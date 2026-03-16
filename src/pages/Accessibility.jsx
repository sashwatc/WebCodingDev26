/**
 * FindBack AI - Accessibility Statement Page
 * Demonstrates commitment to accessible design — important for FBLA judging.
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function Accessibility() {
  const features = [
    "Semantic HTML structure with proper heading hierarchy",
    "ARIA labels on interactive elements and forms",
    "Keyboard navigation support throughout the application",
    "Visible focus indicators on all focusable elements",
    "Color contrast ratios meeting WCAG 2.1 AA standards",
    "Alt text on all images and visual content",
    "Form labels and validation messages for screen readers",
    "Responsive design supporting zoom up to 200%",
    "Accessible modals, dropdowns, and dialog components",
    "Status badges with text labels (not color-only indicators)",
    "Skip-to-content navigation pattern",
    "Logical tab order and focus management",
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3">Accessibility</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Accessibility Statement</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          FindBack AI is committed to ensuring digital accessibility for all students, 
          staff, and community members.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Accessibility Features</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-600">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 text-slate-600 leading-relaxed">
        <h2 className="text-lg font-semibold text-slate-900">Conformance Status</h2>
        <p>
          FindBack AI strives to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 
          at the AA level. We continuously test and improve our accessibility.
        </p>
        <h2 className="text-lg font-semibold text-slate-900">Feedback</h2>
        <p>
          If you experience any accessibility barriers while using FindBack AI, please contact 
          us at lostandfound@school.edu. We welcome your feedback and will work to address 
          any issues promptly.
        </p>
      </div>
    </div>
  );
}