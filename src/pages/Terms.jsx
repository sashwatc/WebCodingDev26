/**
 * FindBack AI - Terms of Use Page
 */
import React from "react";
import { Badge } from "@/components/ui/badge";

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-3">Legal</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Terms of Use</h1>
        <p className="text-sm text-slate-400">Last updated: March 2026</p>
      </div>
      <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. Acceptable Use</h2>
          <p>FindBack AI is provided for legitimate lost-and-found purposes within the school community. Users must submit accurate information and may not use the platform for fraudulent claims, harassment, or any unlawful activity.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">2. False Claims</h2>
          <p>Submitting false or fraudulent claims is strictly prohibited and may result in disciplinary action per school policy. Our AI system monitors for suspicious claim patterns.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Content Responsibility</h2>
          <p>Users are responsible for the accuracy of information they submit. The school reserves the right to remove any content deemed inappropriate or inaccurate.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">4. Limitation of Liability</h2>
          <p>FindBack AI facilitates item matching and claim management but does not guarantee the return of lost items. The school is not liable for items that cannot be recovered.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Modifications</h2>
          <p>These terms may be updated periodically. Continued use of the platform constitutes acceptance of any changes.</p>
        </section>
      </div>
    </div>
  );
}