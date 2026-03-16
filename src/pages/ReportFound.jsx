/**
 * FindBack AI - Report Found Item Page
 * Multi-section form with validation, photo upload, AI tag generation,
 * and description cleanup. Items go into moderation queue by default.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CATEGORIES, LOCATIONS, COLORS, CONDITIONS, generateItemCode } from "@/lib/constants";
import { generateTags, cleanupDescription } from "@/lib/ai-services";
import PhotoUploader from "@/components/shared/PhotoUploader";
import {
  PlusCircle, Loader2, CheckCircle2, Sparkles, MapPin,
  Calendar, Clock, User, Mail, Tag
} from "lucide-react";

export default function ReportFound() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [aiProcessing, setAiProcessing] = useState(false);

  const [form, setForm] = useState({
    title: "", category: "", subcategory: "", description: "",
    color: "", brand: "", date_found: "", time_found: "",
    location_found: "", storage_location: "", condition: "good",
    photo_urls: [], distinguishing_features: "",
    finder_name: "", finder_email: "", finder_role: "student",
    privacy_consent: false, terms_acknowledged: false,
  });

  const [errors, setErrors] = useState({});
  const [generatedTags, setGeneratedTags] = useState([]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Validation logic
  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Item title is required";
    if (!form.category) errs.category = "Please select a category";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.date_found) errs.date_found = "Date found is required";
    if (!form.location_found) errs.location_found = "Location is required";
    if (!form.finder_name.trim()) errs.finder_name = "Your name is required";
    if (!form.finder_email.trim()) errs.finder_email = "Email is required";
    if (!form.privacy_consent) errs.privacy_consent = "Privacy consent is required";
    if (!form.terms_acknowledged) errs.terms_acknowledged = "Please acknowledge the terms";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // AI tag generation
  const handleGenerateTags = async () => {
    if (!form.title && !form.description) return;
    setAiProcessing(true);
    const tags = await generateTags(form.title, form.description, form.category);
    setGeneratedTags(tags);
    setAiProcessing(false);
  };

  // AI description cleanup
  const handleCleanDescription = async () => {
    if (!form.description.trim()) return;
    setAiProcessing(true);
    const cleaned = await cleanupDescription(form.description);
    updateField("ai_description", cleaned);
    setAiProcessing(false);
    toast({ title: "Description enhanced", description: "AI cleaned up your description." });
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Generate tags if not already done
      let tags = generatedTags;
      if (tags.length === 0 && data.title) {
        tags = await generateTags(data.title, data.description, data.category);
      }
      // Generate AI description
      let aiDesc = data.ai_description;
      if (!aiDesc && data.description) {
        aiDesc = await cleanupDescription(data.description);
      }
      return base44.entities.FoundItem.create({
        ...data,
        tags,
        ai_description: aiDesc,
        item_code: generateItemCode(),
        status: "pending_review",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foundItems"] });
      setStep(2);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" });
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

  // Success screen
  if (step === 2) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Item Submitted Successfully!</h1>
        <p className="text-slate-500 mb-8">
          Your found item has been submitted and is awaiting admin review.
          You'll be notified once it's approved and visible to others.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => { setStep(1); setForm({ title: "", category: "", subcategory: "", description: "", color: "", brand: "", date_found: "", time_found: "", location_found: "", storage_location: "", condition: "good", photo_urls: [], distinguishing_features: "", finder_name: "", finder_email: "", finder_role: "student", privacy_consent: false, terms_acknowledged: false }); }}>
            Submit Another
          </Button>
          <Button variant="outline" onClick={() => navigate("/Search")}>
            View All Items
          </Button>
        </div>
      </div>
    );
  }

  const isSubmitting = submitMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Report a Found Item</h1>
        <p className="mt-2 text-slate-500">
          Help reunite someone with their belongings. Fill out the details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Item Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-5 h-5 text-teal-600" />
              Item Details
            </CardTitle>
            <CardDescription>Describe the found item as accurately as possible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Item Title *</Label>
              <Input id="title" placeholder="e.g. Black Nike Water Bottle" value={form.title} onChange={(e) => updateField("title", e.target.value)} className={errors.title ? "border-red-400" : ""} />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger className={errors.category ? "border-red-400" : ""}><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input id="subcategory" placeholder="e.g. Water Bottle" value={form.subcategory} onChange={(e) => updateField("subcategory", e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="Describe the item — size, markings, contents, stickers, etc." rows={4} value={form.description} onChange={(e) => updateField("description", e.target.value)} className={errors.description ? "border-red-400" : ""} />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              {form.description.length > 10 && (
                <Button type="button" variant="ghost" size="sm" className="mt-1 text-teal-600 gap-1" onClick={handleCleanDescription} disabled={aiProcessing}>
                  <Sparkles className="w-3.5 h-3.5" /> AI Enhance Description
                </Button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Color</Label>
                <Select value={form.color} onValueChange={(v) => updateField("color", v)}>
                  <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                  <SelectContent>
                    {COLORS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" placeholder="e.g. Nike, Apple, JanSport" value={form.brand} onChange={(e) => updateField("brand", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => updateField("condition", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="features">Distinguishing Features</Label>
              <Input id="features" placeholder="Stickers, engravings, markings, etc." value={form.distinguishing_features} onChange={(e) => updateField("distinguishing_features", e.target.value)} />
            </div>

            <PhotoUploader photos={form.photo_urls} onChange={(urls) => updateField("photo_urls", urls)} />

            {/* AI Tag Generation */}
            {(form.title || form.description) && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">AI-Generated Tags</span>
                  <Button type="button" variant="outline" size="sm" className="gap-1 text-xs" onClick={handleGenerateTags} disabled={aiProcessing}>
                    {aiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Generate Tags
                  </Button>
                </div>
                {generatedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {generatedTags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Time Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              Location & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Date Found *</Label>
                <Input type="date" value={form.date_found} onChange={(e) => updateField("date_found", e.target.value)} className={errors.date_found ? "border-red-400" : ""} />
                {errors.date_found && <p className="text-xs text-red-500 mt-1">{errors.date_found}</p>}
              </div>
              <div>
                <Label>Time Found (approx.)</Label>
                <Input type="time" value={form.time_found} onChange={(e) => updateField("time_found", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Location Found *</Label>
              <Select value={form.location_found} onValueChange={(v) => updateField("location_found", v)}>
                <SelectTrigger className={errors.location_found ? "border-red-400" : ""}><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.location_found && <p className="text-xs text-red-500 mt-1">{errors.location_found}</p>}
            </div>
            <div>
              <Label htmlFor="storage">Storage / Pickup Location (admin-only visibility)</Label>
              <Input id="storage" placeholder="e.g. Main Office lost & found bin" value={form.storage_location} onChange={(e) => updateField("storage_location", e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">This info will only be visible to administrators.</p>
            </div>
          </CardContent>
        </Card>

        {/* Finder Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="finder_name">Your Name *</Label>
                <Input id="finder_name" value={form.finder_name} onChange={(e) => updateField("finder_name", e.target.value)} className={errors.finder_name ? "border-red-400" : ""} />
                {errors.finder_name && <p className="text-xs text-red-500 mt-1">{errors.finder_name}</p>}
              </div>
              <div>
                <Label htmlFor="finder_email">Your Email *</Label>
                <Input id="finder_email" type="email" value={form.finder_email} onChange={(e) => updateField("finder_email", e.target.value)} className={errors.finder_email ? "border-red-400" : ""} />
                {errors.finder_email && <p className="text-xs text-red-500 mt-1">{errors.finder_email}</p>}
              </div>
            </div>
            <div>
              <Label>Your Role</Label>
              <Select value={form.finder_role} onValueChange={(v) => updateField("finder_role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2">
                <Checkbox id="privacy" checked={form.privacy_consent} onCheckedChange={(v) => updateField("privacy_consent", v)} />
                <label htmlFor="privacy" className="text-sm text-slate-600 leading-snug cursor-pointer">
                  I consent to my contact information being stored securely and used only for the purpose of reuniting this item with its owner. *
                </label>
              </div>
              {errors.privacy_consent && <p className="text-xs text-red-500 ml-6">{errors.privacy_consent}</p>}

              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={form.terms_acknowledged} onCheckedChange={(v) => updateField("terms_acknowledged", v)} />
                <label htmlFor="terms" className="text-sm text-slate-600 leading-snug cursor-pointer">
                  I confirm that the information provided is accurate to the best of my knowledge. *
                </label>
              </div>
              {errors.terms_acknowledged && <p className="text-xs text-red-500 ml-6">{errors.terms_acknowledged}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-[hsl(213,56%,24%)] hover:bg-[hsl(213,56%,20%)] text-white gap-2 shadow-md">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
          {isSubmitting ? "Submitting & Running AI Analysis..." : "Submit Found Item"}
        </Button>
      </form>
    </div>
  );
}