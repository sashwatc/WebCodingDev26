/**
 * FindBack AI - FAQ / Help Page
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { BRAND_NAME } from "@/lib/constants";

const CATEGORIES = ["General", "Claim Issue", "Reporting Issue", "Pickup Issue", "Other"];

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

function ContactSupport() {
  const { user, isAuthenticated } = useAuth();
  const [subject, setSubject]   = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || message.trim().length < 20) {
      setError("Please fill in all fields. Message must be at least 20 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await appClient.entities.Notification.create({
        title: subject.trim(),
        message: `[${category || "General"}] ${message.trim()}`,
        type: "support_ticket",
        user_email: user.email,
        is_read: false,
        link: "/UserDashboard",
      });
      setSuccess(true);
      setSubject(""); setCategory(""); setMessage("");
    } catch (err) {
      setError(err?.message || "Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 rounded-2xl border border-border bg-card p-8">
      <h2 className="text-2xl font-bold text-foreground">Contact Support</h2>
      <p className="mt-1 text-sm text-muted-foreground">Can't find your answer above? Send us a message.</p>

      {/* Office hours */}
      <div className="mt-4 rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
        <span className="font-semibold">PVHS Main Office</span> — School days, 8:00 AM to 3:30 PM
      </div>

      {!isAuthenticated ? (
        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/Home" className="font-medium text-primary underline underline-offset-2">Sign in</Link> to submit a support ticket.
        </p>
      ) : success ? (
        <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Ticket submitted — staff will respond within 1 school day.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <Label htmlFor="faq-subject">Subject *</Label>
            <Input id="faq-subject" value={subject} onChange={e => setSubject(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <Label htmlFor="faq-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="faq-category" className="mt-1.5">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="faq-message">Message * <span className="text-muted-foreground font-normal">(min 20 chars)</span></Label>
            <Textarea id="faq-message" rows={4} value={message} onChange={e => setMessage(e.target.value)} className="mt-1.5 resize-none" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit Ticket"}</Button>
        </form>
      )}
    </section>
  );
}

export default function FAQ() {
  useEffect(() => { document.title = "FAQ & Support — Lost Then Found"; }, []);
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-3">Help Center</Badge>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Frequently Asked Questions</h1>
        <p className="text-slate-500">Quick answers about reporting, searching, claims, privacy, and the judging build.</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.q} value={`item-${index}`} className="bg-white rounded-lg border px-4">
            <AccordionTrigger className="text-left font-medium text-slate-900 hover:no-underline">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-slate-500 leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <ContactSupport />
    </div>
  );
}
