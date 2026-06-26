/**
 * FindBack AI - FAQ / Help Page
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BRAND_NAME } from "@/lib/constants";

const faqs = [
  {
    q: "How do I report a found item?",
    a: "Open Report Found Item from the navigation and fill in as many details as possible. Photos, color, brand, location, and distinguishing marks make the item easier to review and search.",
  },
  {
    q: "How do I search for something I lost?",
    a: "Use the Search Items page to browse published items. You can filter by category, color, location, and status, or use descriptive text such as “black bottle near gym.”",
  },
  {
    q: "What happens after I submit a lost-item report?",
    a: "The matching engine compares your report with found items using category, brand, color, description overlap, date proximity, and location proximity. Suggested matches include readable reasons and still require normal claim review.",
  },
  {
    q: "How do I claim an item?",
    a: "Open the item details page and choose Submit Claim. You will be asked for identifying details that help prove ownership before an administrator reviews the request.",
  },
  {
    q: "What can administrators see that students cannot?",
    a: "Admin views can access storage locations, review queues, claim risk signals, and moderation tools. Public users only see the information needed to identify and claim an item.",
  },
  {
    q: "Is this build connected to a live backend?",
    a: "Yes. The frontend is built to call the Spring Boot API for shared data, uploads, and sign-in records. In local development, Vite proxies /api requests to the backend on port 8080.",
  },
  {
    q: "Is my information private?",
    a: "The app is designed to collect only what is needed for a lost-and-found workflow. Records are stored through the configured backend, and sensitive storage or review details stay limited to admin views.",
  },
  {
    q: `Can staff members use ${BRAND_NAME} too?`,
    a: "Yes. The workflow is designed for both students and staff, with an additional admin mode for review and moderation tasks.",
  },
  {
    q: "What if there is no match yet?",
    a: "You can still submit a lost-item report. The report stays available for comparison against future found-item submissions in the current data set.",
  },
];

export default function FAQ() {
  return (
    <div className="page-shell max-w-3xl py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">Help Center</Badge>
        <h1 className="text-4xl font-bold text-foreground mb-3">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Quick answers about reporting, searching, claims, privacy, and the judging build.</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.q} value={`item-${index}`} className="bg-card rounded-lg border border-border px-4">
            <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
