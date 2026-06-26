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

const CATEGORIES = ["Lost Item","Found Item","Account Issue","Other"];

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [linkedItem, setLinkedItem] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !category) {
      toast({ title: "Please complete required fields", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
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

  const reset = () => { setCategory(""); setSubject(""); setDescription(""); setLinkedItem(""); setSubmitted(null); };

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
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reset} variant="outline">Submit another</Button>
            <Button asChild variant="outline"><Link to="/UserDashboard">My Dashboard</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-2xl py-16 space-y-8">
      <div className="page-header">
        <span className="page-kicker">Help & Support</span>
        <h1 className="page-title">Get Help</h1>
        <p className="page-subtitle">Search our FAQ or submit a support ticket below.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline"><Link to="/FAQ"><HelpCircle className="h-4 w-4 mr-1.5"/>Browse FAQ</Link></Button>
      </div>

      <div className="surface-card p-6">
        <p className="section-label mb-3">Office Hours</p>
        <div className="space-y-2 text-sm text-foreground">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/><span>Main Office: Mon–Fri, 7:30 AM – 3:30 PM</span></div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground"/><span>Pickup window: Mon–Fri, 11:30 AM – 12:30 PM</span></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-5">
        <p className="text-base font-semibold text-foreground">Submit a support ticket</p>
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
        <div className="space-y-1.5">
          <Label htmlFor="ticket-subject">Subject <span className="text-red-600">*</span></Label>
          <Input id="ticket-subject" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Brief summary of your issue"/>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-desc">Description <span className="text-red-600">*</span></Label>
          <Textarea id="ticket-desc" rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe your issue in detail..."/>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-item">Related item ID <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="ticket-item" value={linkedItem} onChange={e=>setLinkedItem(e.target.value)} placeholder="Item ID from the URL, e.g. abc123"/>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-email">Your email <span className="text-red-600">*</span></Label>
          <Input id="ticket-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"/>
        </div>
        <Button type="submit" className="w-full" disabled={submitting || !category || !subject.trim() || !description.trim() || !email.trim()}>{submitting ? "Submitting…" : "Submit ticket"}</Button>
      </form>
    </div>
  );
}
