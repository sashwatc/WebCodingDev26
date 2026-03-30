/**
 * FindBack AI - Report Lost Item Page
 * Students report lost belongings and receive suggested matches.
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { CATEGORIES, LOCATIONS, COLORS, URGENCY_LEVELS } from "@/lib/constants";
import { findMatches } from "@/lib/ai-services";
import { ConsentCheckboxField } from "@/components/shared/ConsentCheckboxField";
import PhotoUploader from "@/components/shared/PhotoUploader";
import {
  AlertTriangle,
  Brain,
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function ReportLost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState({
    item_type: "",
    category: "",
    description: "",
    color: "",
    brand: "",
    last_seen_location: "",
    date_lost: "",
    photo_url: "",
    contact_name: "",
    contact_email: "",
    student_id: "",
    urgency: "medium",
    extra_notes: "",
    confirm_accuracy: false,
  });
  const [errors, setErrors] = useState({});

  const { data: foundItems = [] } = useQuery({
    queryKey: ["foundItemsForMatching"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 100),
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.item_type.trim()) nextErrors.item_type = "Item type is required";
    if (!form.description.trim()) nextErrors.description = "Description is required";
    if (!form.date_lost) nextErrors.date_lost = "Date lost is required";
    if (!form.contact_name.trim()) nextErrors.contact_name = "Your name is required";
    if (!form.contact_email.trim()) nextErrors.contact_email = "Email is required";
    if (!form.confirm_accuracy) nextErrors.confirm_accuracy = "Please confirm the report details";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const report = await appClient.entities.LostReport.create({
        ...data,
        status: "open",
      });

      setStep(2);
      const aiMatches = await findMatches(data, foundItems);

      if (aiMatches.length > 0) {
        await appClient.entities.LostReport.update(report.id, {
          matched_items: aiMatches,
          status: "matched",
        });
      }

      return { report, matches: aiMatches };
    },
    onSuccess: ({ matches: aiMatches }) => {
      queryClient.invalidateQueries();
      setMatches(aiMatches);
      setStep(3);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
      setStep(1);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    submitMutation.mutate(form);
  };

  if (step === 2) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 animate-pulse">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">Matching Your Report</h2>
          <p className="mb-6 text-slate-600">
            Comparing your lost item against {foundItems.length} found items in the current data set...
          </p>
          <div className="mx-auto max-w-xs">
            <Progress value={66} className="h-2.5" />
          </div>
          <p className="mt-3 text-xs text-slate-400">This usually takes a few seconds</p>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="page-shell max-w-4xl py-10">
        <div className="page-header text-center">
          <span className="page-kicker">Lost Report Submitted</span>
          <h2 className="page-title">Your report is active.</h2>
          <p className="page-subtitle mx-auto">
            Here are the strongest suggested matches based on the current item records.
          </p>
        </div>

        {matches.length > 0 ? (
          <div className="mb-8 space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-slate-900">
                {matches.length} Potential Match{matches.length > 1 ? "es" : ""} Found
              </h3>
            </div>
            {matches.map((match, index) => {
              const item = foundItems.find((foundItem) => foundItem.id === match.found_item_id);
              if (!item) return null;

              return (
                <Card key={index}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {item.photo_urls?.[0] ? (
                        <img src={item.photo_urls[0]} alt={item.title} className="h-20 w-20 rounded-[18px] object-cover flex-shrink-0" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="truncate font-semibold text-slate-900">{item.title}</h4>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            {match.confidence}% match
                          </Badge>
                        </div>
                        <p className="mb-2 line-clamp-2 text-sm text-slate-600">{item.ai_description || item.description}</p>
                        {match.reasons?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {match.reasons.map((reason) => (
                              <Badge key={reason} variant="outline" className="text-xs">{reason}</Badge>
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
              <p className="mb-2 text-slate-600">No strong matches found yet.</p>
              <p className="text-sm text-slate-400">
                We&apos;ll continue scanning new found items and notify you if a match appears.
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

  return (
    <div className="page-shell max-w-4xl py-10">
      <div className="page-header">
        <span className="page-kicker">Report Lost Item</span>
        <h1 className="page-title">Describe what went missing.</h1>
        <p className="page-subtitle">
          The matching engine will compare your report against currently stored found-item records and surface the closest matches.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="form-shell divide-y divide-slate-200">
          <Card className="rounded-none border-0 bg-transparent shadow-none">
            <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Lost Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0 sm:p-8 sm:pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="item_type">Item Type *</Label>
                  <Input id="item_type" placeholder="e.g. Water Bottle, AirPods" value={form.item_type} onChange={(event) => updateField("item_type", event.target.value)} className={errors.item_type ? "border-red-400" : ""} />
                  {errors.item_type && <p className="mt-1 text-xs text-red-500">{errors.item_type}</p>}
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(value) => updateField("category", value)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="lost_desc">Description *</Label>
                <Textarea id="lost_desc" placeholder="Describe your item in detail — any markings, stickers, contents, etc." rows={4} value={form.description} onChange={(event) => updateField("description", event.target.value)} className={errors.description ? "border-red-400" : ""} />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Color</Label>
                  <Select value={form.color} onValueChange={(value) => updateField("color", value)}>
                    <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => <SelectItem key={color} value={color}>{color}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lost_brand">Brand</Label>
                  <Input id="lost_brand" placeholder="e.g. Apple, Nike" value={form.brand} onChange={(event) => updateField("brand", event.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Date Lost *</Label>
                  <Input type="date" value={form.date_lost} onChange={(event) => updateField("date_lost", event.target.value)} className={errors.date_lost ? "border-red-400" : ""} />
                  {errors.date_lost && <p className="mt-1 text-xs text-red-500">{errors.date_lost}</p>}
                </div>
                <div>
                  <Label>Last Seen Location</Label>
                  <Select value={form.last_seen_location} onValueChange={(value) => updateField("last_seen_location", value)}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Urgency Level</Label>
                <Select value={form.urgency} onValueChange={(value) => updateField("urgency", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {URGENCY_LEVELS.map((urgency) => <SelectItem key={urgency.value} value={urgency.value}>{urgency.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <PhotoUploader photos={form.photo_url ? [form.photo_url] : []} onChange={(urls) => updateField("photo_url", urls[0] || "")} maxPhotos={1} label="Reference Photo (optional)" />

              <div>
                <Label htmlFor="extra_notes">Additional Notes</Label>
                <Textarea id="extra_notes" placeholder="Any other details that might help identify your item" rows={2} value={form.extra_notes} onChange={(event) => updateField("extra_notes", event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-0 bg-transparent shadow-none">
            <CardHeader className="p-6 pb-4 sm:p-8 sm:pb-4">
              <CardTitle className="text-lg">Your Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0 sm:p-8 sm:pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact_name">Full Name *</Label>
                  <Input id="contact_name" value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} className={errors.contact_name ? "border-red-400" : ""} />
                  {errors.contact_name && <p className="mt-1 text-xs text-red-500">{errors.contact_name}</p>}
                </div>
                <div>
                  <Label htmlFor="contact_email">Email *</Label>
                  <Input id="contact_email" type="email" value={form.contact_email} onChange={(event) => updateField("contact_email", event.target.value)} className={errors.contact_email ? "border-red-400" : ""} />
                  {errors.contact_email && <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="student_id">Student ID</Label>
                <Input id="student_id" placeholder="Optional — helps verify identity" value={form.student_id} onChange={(event) => updateField("student_id", event.target.value)} />
              </div>

              <ConsentCheckboxField
                id="confirm_accuracy"
                checked={form.confirm_accuracy}
                onCheckedChange={(value) => updateField("confirm_accuracy", value)}
                error={errors.confirm_accuracy}
                tone="amber">
                I confirm this lost-item report is accurate to the best of my knowledge. *
              </ConsentCheckboxField>
            </CardContent>
          </Card>

          <div className="p-6 sm:p-8">
            <Button type="submit" size="lg" disabled={submitMutation.isPending} className="w-full gap-2">
              {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
              {submitMutation.isPending ? "Submitting..." : "Submit and Find Matches"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
