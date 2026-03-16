/**
 * FindBack AI - Privacy Policy Page
 */
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3"><Shield className="w-3 h-3 mr-1" />Privacy</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-400">Last updated: March 2026</p>
      </div>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. Information We Collect</h2>
          <p>FindBack AI collects information necessary to facilitate the lost-and-found process, including: names, school email addresses, student IDs (optional), item descriptions, photos, and location data related to found items.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. How We Use Information</h2>
          <p>All data collected is used exclusively for matching lost items with found items and facilitating the return process. We do not sell, trade, or share personal data with third parties.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Data Protection</h2>
          <p>Sensitive information such as storage locations and contact details are restricted to authorized administrators only. All data is stored securely using industry-standard encryption.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Student Privacy (FERPA Compliance)</h2>
          <p>FindBack AI is designed with FERPA guidelines in mind. Student educational records are not collected. Student IDs are optional and used solely for identity verification during the claim process.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Data Retention</h2>
          <p>Records are retained for the current school year and archived at the end of each term. Users may request deletion of their personal data by contacting the school administration.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">6. Contact</h2>
          <p>For privacy-related questions, contact lostandfound@school.edu or visit the Main Office.</p>
        </section>
      </div>
    </div>
  );
}