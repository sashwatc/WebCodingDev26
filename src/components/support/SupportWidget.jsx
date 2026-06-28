/**
 * Lost Then Found - Global Support Widget
 * A floating help button available on every page. Lets any user (or an
 * anonymous visitor) send a question on any topic straight to the admin via
 * the support-ticket API. Not limited to lost/found items.
 */

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { appClient } from "@/api/appClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LifeBuoy, CheckCircle2 } from "lucide-react";

// Selectable support topics shown as chips in the form.
const CATEGORIES = ["Question", "Lost Item", "Found Item", "Account Issue", "Other"];

export default function SupportWidget() {
  // Current user (may be undefined for anonymous visitors) — used to prefill email.
  const { user } = useAuth();
  const { toast } = useToast();
  // Dialog open/closed.
  const [open, setOpen] = useState(false);
  // Form fields.
  const [category, setCategory] = useState("Question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  // In-flight submit flag.
  const [submitting, setSubmitting] = useState(false);
  // Holds the created ticket once submitted (drives the success view).
  const [submitted, setSubmitted] = useState(null);

  // Keep the email in sync if the user signs in while the widget is mounted.
  // Only fills when currently empty so it never clobbers manual input.
  React.useEffect(() => {
    if (user?.email) setEmail((prev) => prev || user.email);
  }, [user?.email]);

  // Reset the form back to its defaults (also exits the success view).
  const resetForm = () => {
    setCategory("Question");
    setSubject("");
    setMessage("");
    setSubmitted(null);
  };

  // Validate required fields, then create a support ticket via the API.
  // On success store the ticket (shows confirmation); on failure show a toast.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || !email.trim()) {
      toast({ title: "Please complete the required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await appClient.support.createTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim(),
      });
      setSubmitted(ticket);
    } catch (err) {
      toast({
        title: "Could not send your question",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Close the dialog, deferring the form reset until the close animation ends.
  const close = () => {
    setOpen(false);
    // Reset after the dialog close animation so the form doesn't flash empty.
    setTimeout(resetForm, 200);
  };

  return (
    <>
      {/* Floating launcher — available on every page */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Get help or ask a question"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:bottom-5 sm:right-5"
      >
        <LifeBuoy className="h-5 w-5" />
        <span className="hidden text-sm font-semibold sm:inline">Help</span>
      </button>

      {/* Support dialog: opening sets open; closing routes through close() so
          the form resets after the animation */}
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="max-w-md">
          {/* Two views: success confirmation (after submit) vs. the entry form */}
          {submitted ? (
            /* ── Success view: ticket number + follow-up actions ──────────── */
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Question sent</h2>
              {/* Ticket identifier — tolerant of multiple field name shapes */}
              <p className="mt-2 text-sm text-muted-foreground">
                Ticket{" "}
                <span className="font-mono font-bold text-foreground">
                  {submitted.ticketNumber || submitted.ticket_number || submitted.id}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Our staff will respond within 1 school day.
              </p>
              {/* Reset for another question, or close the dialog */}
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={resetForm}>Ask another</Button>
                <Button onClick={close}>Done</Button>
              </div>
            </div>
          ) : (
            /* ── Entry form: topic chips, subject, question, email, submit ── */
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-primary" /> Ask a question
                </DialogTitle>
                <DialogDescription>
                  Send any question to our staff — about an item, your account, or anything else.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Topic selector: single-select chip row backed by `category` */}
                <div>
                  <Label>Topic</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          category === c
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Required: short subject line */}
                <div className="space-y-1.5">
                  <Label htmlFor="support-subject">Subject <span className="text-red-600">*</span></Label>
                  <Input
                    id="support-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary"
                    autoFocus
                  />
                </div>

                {/* Required: free-text question body */}
                <div className="space-y-1.5">
                  <Label htmlFor="support-message">Your question <span className="text-red-600">*</span></Label>
                  <Textarea
                    id="support-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                  />
                </div>

                {/* Required: reply-to email (prefilled for signed-in users) */}
                <div className="space-y-1.5">
                  <Label htmlFor="support-email">Your email <span className="text-red-600">*</span></Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                {/* Submit: disabled while sending or if any required field is blank */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !subject.trim() || !message.trim() || !email.trim()}
                >
                  {submitting ? "Sending…" : "Send to staff"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
