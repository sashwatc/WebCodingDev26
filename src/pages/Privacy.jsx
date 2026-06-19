/**
 * FindBack AI - Privacy Policy Page
 */

import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/constants";

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
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3"><Shield className="w-3 h-3 mr-1" />Privacy</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-400">Last updated: March 16, 2026</p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-slate-200">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">{section.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-sm text-slate-500">
        See <Link to="/Sources" className="font-semibold text-[hsl(213,56%,24%)] hover:underline">Sources and Citations</Link> for the official privacy references used in this project.
      </div>
    </div>
  );
}
