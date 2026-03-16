/**
 * FindBack AI - Terms of Use Page
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const terms = [
  {
    title: "1. Acceptable Use",
    body: "FindBack AI is intended for legitimate lost-and-found activity within a school environment. Users should provide accurate details and should not misuse the system for harassment, fraud, or false submissions.",
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
    body: "FindBack AI improves organization and item matching, but it does not guarantee that every lost item will be recovered or that every suggested match is correct.",
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
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3">Legal</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Terms of Use</h1>
        <p className="text-sm text-slate-400">Last updated: March 16, 2026</p>
      </div>

      <div className="space-y-4">
        {terms.map((section) => (
          <Card key={section.title} className="border-slate-200">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{section.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
