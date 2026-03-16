/**
 * FindBack AI - Report Lost Item Page
 * Students report lost belongings. After submission, AI analyzes the report
 * and suggests matching found items with confidence scores.
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CATEGORIES, LOCATIONS, COLORS, URGENCY_LEVELS } from "@/lib/constants";
import { findMatches } from "@/lib/ai-services";
import PhotoUploader from "@/components/shared/PhotoUploader";
import {
  AlertTriangle, Loader2, Brain, CheckCircle2,
  Sparkles, Eye
} from "lucide-react";

export default function ReportLost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1); // 1=form, 2=ai-matching, 3=results
  const [matches, setMatches] = useState([]);

  const [form, setForm] = useState({
    item_type: "", category: "", description: "", color: "",
    brand: "", last_seen_location: "", date_lost: "", photo_url: "",
    contact_name: "", contact_email: "", student_id: "",
    urgency: "medium", extra_notes: "",
  });
  const [errors, setErrors] = useState({});

  // Fetch found items for AI matching
  const { data: foundItems = [] } = useQuery({
    queryKey: ["foundItemsForMatching"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 100),
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.item_type.trim()) errs.item_type = "Item type is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.date_lost) errs.date_lost = "Date lost is required";
    if (!form.contact_name.trim()) errs.contact_name = "Your name is required";
    if (!form.contact_email.trim()) errs.contact_email = "Email is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Step 1: Create the lost report
      const report = await appClient.entities.LostReport.create({
        ...data,
        status: "open",
      });

      // Step 2: Run AI matching
      setStep(2);
      const aiMatches = await findMatches(data, foundItems);

      // Step 3: Update report with matches
      if (aiMatches.length > 0) {
        await appClient.entities.LostReport.update(report.id, {
          matched_items: aiMatches,
          status: "matched",
        });
      }

      return { report, matches: aiMatches };
    },
    onSuccess: ({ matches: aiMatches }) => {
      queryClient.invalidateQueries({ queryKey: ["lostReports"] });
      setMatches(aiMatches);
      setStep(3);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
      setStep(1);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    submitMutation.mutate(form);
  };

  // AI Matching animation screen
  if (step === 2) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-teal-50 flex items-center justify-center mb-6 animate-pulse">
          <Brain className="w-8 h-8 text-teal-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Matching Your Report</h2>
        <p className="text-slate-500 mb-6">
          Comparing your lost item against {foundItems.length} found items in the current data set...
        </p>
        <div className="max-w-xs mx-auto">
          <Progress value={66} className="h-2" />
        </div>
        <p className="text-xs text-slate-400 mt-3">This usually takes a few seconds</p>
      </div>
    );
  }

  // Results screen with AI matches
  if (step === 3) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Report Submitted</h2>
          <p className="text-slate-500">
            Your lost item report is now active. Here are the strongest suggested matches:
          </p>
        </div>

        {/* AI Match Results */}
        {matches.length > 0 ? (
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                {matches.length} Potential Match{matches.length > 1 ? "es" : ""} Found
              </h3>
            </div>
            {matches.map((match, i) => {
              const item = foundItems.find(f => f.id === match.found_item_id);
              if (!item) return null;
              return (
                <Card key={i} className="border-l-4 border-l-teal-500 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {item.photo_urls?.[0] && (
                        <img src={item.photo_urls[0]} alt={item.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 truncate">{item.title}</h4>
                          <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-xs">
                            {match.confidence}% match
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-2 line-clamp-2">{item.ai_description || item.description}</p>
                        {match.reasons?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {match.reasons.map((reason, j) => (
                              <Badge key={j} variant="outline" className="text-xs">{reason}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link to={`/ItemDetails?id=${item.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 flex-shrink-0">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <p className="text-slate-500 mb-2">No strong matches found yet.</p>
              <p className="text-sm text-slate-400">
                We'll continue scanning new found items and notify you if a match appears.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("/Search")} className="gap-2">
            <Eye className="w-4 h-4" /> Browse All Found Items
          </Button>
          <Button variant="outline" onClick={() => navigate("/UserDashboard")}>
            Go to My Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Report a Lost Item</h1>
        <p className="mt-2 text-slate-500">
          Describe what you lost and the matching engine will look for the closest matches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Lost Item Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_type">Item Type *</Label>
                <Input id="item_type" placeholder="e.g. Water Bottle, AirPods" value={form.item_type} onChange={(e) => updateField("item_type", e.target.value)} className={errors.item_type ? "border-red-400" : ""} />
                {errors.item_type && <p className="text-xs text-red-500 mt-1">{errors.item_type}</p>}
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="lost_desc">Description *</Label>
              <Textarea id="lost_desc" placeholder="Describe your item in detail — any markings, stickers, contents, etc." rows={4} value={form.description} onChange={(e) => updateField("description", e.target.value)} className={errors.description ? "border-red-400" : ""} />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <Select value={form.color} onValueChange={(v) => updateField("color", v)}>
                  <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                  <SelectContent>{COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lost_brand">Brand</Label>
                <Input id="lost_brand" placeholder="e.g. Apple, Nike" value={form.brand} onChange={(e) => updateField("brand", e.target.value)} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Date Lost *</Label>
                <Input type="date" value={form.date_lost} onChange={(e) => updateField("date_lost", e.target.value)} className={errors.date_lost ? "border-red-400" : ""} />
                {errors.date_lost && <p className="text-xs text-red-500 mt-1">{errors.date_lost}</p>}
              </div>
              <div>
                <Label>Last Seen Location</Label>
                <Select value={form.last_seen_location} onValueChange={(v) => updateField("last_seen_location", v)}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Urgency Level</Label>
              <Select value={form.urgency} onValueChange={(v) => updateField("urgency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <PhotoUploader photos={form.photo_url ? [form.photo_url] : []} onChange={(urls) => updateField("photo_url", urls[0] || "")} maxPhotos={1} label="Reference Photo (optional)" />

            <div>
              <Label htmlFor="extra_notes">Additional Notes</Label>
              <Textarea id="extra_notes" placeholder="Any other details that might help identify your item" rows={2} value={form.extra_notes} onChange={(e) => updateField("extra_notes", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_name">Full Name *</Label>
                <Input id="contact_name" value={form.contact_name} onChange={(e) => updateField("contact_name", e.target.value)} className={errors.contact_name ? "border-red-400" : ""} />
                {errors.contact_name && <p className="text-xs text-red-500 mt-1">{errors.contact_name}</p>}
              </div>
              <div>
                <Label htmlFor="contact_email">Email *</Label>
                <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => updateField("contact_email", e.target.value)} className={errors.contact_email ? "border-red-400" : ""} />
                {errors.contact_email && <p className="text-xs text-red-500 mt-1">{errors.contact_email}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="student_id">Student ID</Label>
              <Input id="student_id" placeholder="Optional — helps verify identity" value={form.student_id} onChange={(e) => updateField("student_id", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={submitMutation.isPending} className="w-full bg-[hsl(213,56%,24%)] hover:bg-[hsl(213,56%,20%)] text-white gap-2 shadow-md">
          {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          {submitMutation.isPending ? "Submitting..." : "Submit & Find Matches"}
        </Button>
      </form>
    </div>
  );
}
