/**
 * Support — the "Get Help" page where users submit a support ticket.
 *
 * What the user sees/does:
 *   - A header plus a link to browse the FAQ and an "Office Hours" info card.
 *   - A form to file a support ticket: pick a category, enter subject,
 *     description, an optional related item ID, and their email.
 *   - On submit, the ticket is created via the backend (appClient.support),
 *     and the page swaps to a success confirmation showing the ticket number,
 *     with options to submit another or jump to their dashboard.
 *
 * Data flow: ticket creation is a one-off async call (not TanStack Query).
 * Validation, loading, and error feedback are handled locally with toasts.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { Clock, HelpCircle, MessageSquare } from "lucide-react";

// Selectable ticket categories rendered as a row of toggle buttons.
const CATEGORIES = ["Lost Item","Found Item","Account Issue","Other"];

export default function Support() {
  const { user } = useAuth();        // current signed-in user (used to pre-fill email)
  const { toast } = useToast();      // toast helper for validation/error feedback
  // --- Form field state ---
  const [category, setCategory] = useState("");        // selected category (required)
  const [subject, setSubject] = useState("");          // ticket subject (required)
  const [description, setDescription] = useState("");  // ticket body/message (required)
  const [linkedItem, setLinkedItem] = useState("");    // optional related item ID
  const [email, setEmail] = useState(user?.email || ""); // contact email, pre-filled from auth
  // --- Submission state ---
  const [submitted, setSubmitted] = useState(null);    // holds the created ticket; truthy => show success view
  const [submitting, setSubmitting] = useState(false); // in-flight flag to disable the submit button

  // Validate required fields, create the ticket via the backend, and on success
  // store the returned ticket (which flips the page to the confirmation view).
  // Errors surface as a destructive toast; `submitting` always resets in finally.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Guard: subject, description, and category are all required.
    if (!subject.trim() || !description.trim() || !category) {
      toast({ title: "Please complete required fields", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      // Create the ticket server-side; linked_item_id is null when left blank.
      const ticket = await appClient.support.createTicket({
        category,
        subject: subject.trim(),
        message: description.trim(),
        email: email.trim(),
        linked_item_id: linkedItem.trim() || null,
      });
      setSubmitted(ticket);
    } catch (err) {
      toast({
        title: "Could not submit ticket",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Clear the form and return from the success view back to the blank ticket form.
  // (Note: email is intentionally not reset so a repeat submitter keeps their address.)
  const reset = () => { setCategory(""); setSubject(""); setDescription(""); setLinkedItem(""); setSubmitted(null); };

  // SUCCESS VIEW: once a ticket has been created, render a confirmation card
  // instead of the form. Shows the ticket number (tolerating different field
  // name shapes from the backend) and next-step actions.
  if (submitted) {
    return (
      <div className="page-shell max-w-2xl py-16 text-center">
        <div className="surface-card p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <MessageSquare className="h-7 w-7"/>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Ticket submitted</h1>
          <p className="mt-2 text-muted-foreground">Ticket <span className="font-mono font-bold text-foreground">{submitted.ticketNumber || submitted.ticket_number || submitted.id}</span></p>
          <p className="mt-1 text-sm text-muted-foreground">Our staff will respond within 1 school day.</p>
          {/* Post-submit actions: file another ticket or go to the user's dashboard */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reset} variant="outline">Submit another</Button>
            <Button asChild variant="outline"><Link to="/UserDashboard">My Dashboard</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: the support form (shown until a ticket is successfully created).
  return (
    <div className="page-shell max-w-2xl py-16 space-y-8">
      {/* Page header */}
      <div className="page-header">
        <span className="page-kicker">Help & Support</span>
        <h1 className="page-title">Get Help</h1>
        <p className="page-subtitle">Search our FAQ or submit a support ticket below.</p>
      </div>

      {/* Quick link to the FAQ page */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link to="/FAQ"><HelpCircle className="h-4 w-4 mr-1.5"/>Browse FAQ</Link></Button>
      </div>

      {/* Office hours info card (static reference) */}
      <div className="surface-card p-6">
        <p className="section-label mb-3">Office Hours</p>
        <div className="space-y-2 text-sm text-foreground">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/><span>Main Office: Mon–Fri, 7:30 AM – 3:30 PM</span></div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/><span>Pickup window: Mon–Fri, 11:30 AM – 12:30 PM</span></div>
        </div>
      </div>

      {/* Support ticket form — submission handled by handleSubmit */}
      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-5">
        <p className="text-base font-semibold text-foreground">Submit a support ticket</p>
        {/* Category picker: toggle buttons; active category is visually highlighted */}
        <div>
          <Label>Category <span className="text-red-600">*</span></Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map(c=>(
              <button key={c} type="button"
                onClick={()=>setCategory(c)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${category===c ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >{c}</button>
            ))}
          </div>
        </div>
        {/* Subject field (required) */}
        <div className="space-y-1.5">
          <Label htmlFor="ticket-subject">Subject <span className="text-red-600">*</span></Label>
          <Input id="ticket-subject" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Brief summary of your issue"/>
        </div>
        {/* Description field (required) */}
        <div className="space-y-1.5">
          <Label htmlFor="ticket-desc">Description <span className="text-red-600">*</span></Label>
          <Textarea id="ticket-desc" rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe your issue in detail..."/>
        </div>
        {/* Optional related item ID field */}
        <div className="space-y-1.5">
          <Label htmlFor="ticket-item">Related item ID <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="ticket-item" value={linkedItem} onChange={e=>setLinkedItem(e.target.value)} placeholder="Item ID from the URL, e.g. abc123"/>
        </div>
        {/* Contact email field (required, pre-filled from auth) */}
        <div className="space-y-1.5">
          <Label htmlFor="ticket-email">Your email <span className="text-red-600">*</span></Label>
          <Input id="ticket-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"/>
        </div>
        {/* Submit button: disabled while submitting or when any required field is empty; label reflects in-flight state */}
        <Button type="submit" className="w-full" disabled={submitting || !category || !subject.trim() || !description.trim() || !email.trim()}>{submitting ? "Submitting…" : "Submit ticket"}</Button>
      </form>
    </div>
  );
}
