/**
 * FindBack AI - FAQ / Help Page
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";

const faqs = [
  { q: "How do I report a found item?", a: "Click 'Report Found Item' in the navigation. Fill out the form with as much detail as possible including photos, location, and description. The item will be reviewed by an admin before being made public." },
  { q: "How do I search for my lost item?", a: "Use the 'Search Items' page to browse all found items. You can filter by category, color, location, and date. You can also type natural language queries like 'black water bottle near gym'." },
  { q: "What happens after I submit a lost item report?", a: "Our AI engine will automatically compare your report against all found items in our database and show you potential matches with confidence scores. You'll also be notified if new matches appear later." },
  { q: "How does the AI matching work?", a: "FindBack AI analyzes multiple attributes including item category, color, brand, description keywords, date proximity, and location proximity to calculate a match confidence score." },
  { q: "How do I claim an item?", a: "When you find your item in the search results, click 'View Details' and then 'Submit Claim'. You'll need to provide identifying details that only the true owner would know." },
  { q: "What happens after I submit a claim?", a: "Your claim goes into the admin review queue. An administrator will verify your identity and the details you provided. You'll receive status updates throughout the process." },
  { q: "Is my personal information safe?", a: "Yes. Contact information and storage locations are only visible to administrators. We follow school privacy guidelines and never share data with third parties." },
  { q: "How long are items kept?", a: "Found items are kept for 30 days. After that, they may be archived or donated per school policy. High-value items may be kept longer." },
  { q: "Can staff members use FindBack AI?", a: "Absolutely. Staff can report found items and access the system just like students. Administrators have additional privileges for managing the platform." },
  { q: "What if I can't find my item?", a: "If your item isn't in the database yet, submit a lost item report. Our AI will continuously monitor new found items and notify you when a potential match appears." },
];

export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">Help Center</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Frequently Asked Questions</h1>
        <p className="text-slate-500">Everything you need to know about FindBack AI.</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="bg-white rounded-lg border px-4">
            <AccordionTrigger className="text-left font-medium text-slate-900 hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-500 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}