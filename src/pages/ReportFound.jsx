/**
 * FindBack AI - Report Found Item Page
 * Multi-section form with validation, photo upload, AI tag generation,
 * and description cleanup. Items go into moderation queue by default.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CATEGORIES, LOCATIONS, COLORS, CONDITIONS, generateItemCode } from "@/lib/constants";
import { generateTags, cleanupDescription } from "@/lib/ai-services";
import { ConsentCheckboxField } from "@/components/shared/ConsentCheckboxField";
import PhotoUploader from "@/components/shared/PhotoUploader";
import { useAuth } from "@/lib/AuthContext";
import {
  PlusCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  MapPin,
  User,
  Tag,
  Shield,
  LockKeyhole,
} from "lucide-react";

const createInitialForm = () => ({
  title: "",
  category: "",
  subcategory: "",
  description: "",
  color: "",
  brand: "",
  date_found: "",
  time_found: "",
  location_found: "",
  storage_location: "",
  condition: "good",
  photo_urls: [],
  distinguishing_features: "",
  finder_name: "",
  finder_email: "",
  finder_role: "student",
  privacy_consent: false,
  terms_acknowledged: false,
  ai_description: "",
});

export default function ReportFound() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [form, setForm] = useState(() => createInitialForm());
  const [errors, setErrors] = useState({});
  const [generatedTags, setGeneratedTags] = useState([]);

  const resetForm = () => {
    setForm(createInitialForm());
    setGeneratedTags([]);
    setErrors({});
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Item title is required";
    if (!form.category) errs.category = "Please select a category";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.date_found) errs.date_found = "Date found is required";
    if (!form.location_found) errs.location_found = "Location is required";
    if (!user && !form.finder_name.trim()) errs.finder_name = "Your name is required";
    if (!user && !form.finder_email.trim()) errs.finder_email = "Email is required";
    if (!form.privacy_consent) errs.privacy_consent = "Privacy consent is required";
    if (!form.terms_acknowledged) errs.terms_acknowledged = "Please acknowledge the terms";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerateTags = async () => {
    if (!form.title && !form.description) return;
    setAiProcessing(true);
    const tags = await generateTags(form.title, form.description, form.category);
    setGeneratedTags(tags);
    setAiProcessing(false);
  };

  const handleCleanDescription = async () => {
    if (!form.description.trim()) return;
    setAiProcessing(true);
    const cleaned = await cleanupDescription(form.description);
    updateField("ai_description", cleaned);
    setAiProcessing(false);
    toast({
      title: "Description enhanced",
      description: "A cleaner version of your description was suggested.",
    });
  };

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      let tags = generatedTags;
      if (tags.length === 0 && data.title) {
        tags = await generateTags(data.title, data.description, data.category);
      }

      let aiDesc = data.ai_description;
      if (!aiDesc && data.description) {
        aiDesc = await cleanupDescription(data.description);
      }

      return appClient.entities.FoundItem.create({
        ...data,
        tags,
        ai_description: aiDesc,
        item_code: generateItemCode(),
        status: "pending_review",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setStep(2);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
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
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-md bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Item submitted for review.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Your report is now in the moderation queue. After approval, it will become searchable for claimants while private storage details remain restricted to administrators.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                resetForm();
                setStep(1);
              }}
            >
              Submit Another
            </Button>
            <Button variant="outline" onClick={() => navigate("/Search")}>
              View Search Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isSubmitting = submitMutation.isPending;

  return (
    <div className="page-shell max-w-5xl py-10">
      <div className="page-header">
        <span className="page-kicker">Report Found Item</span>
        <h1 className="page-title">Create a clear found-item record.</h1>
        <p className="page-subtitle">
          Enter the details students will search for later, keep storage information private, and send the item into
          the admin review queue.
        </p>
      </div>

      <div className="mb-6 surface-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-slate-900">Public listing, private storage</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Search pages stay public, but the storage or pickup field is restricted to administrators.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-slate-900">Every record is reviewed first</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Submitted items are saved immediately, but only approved records appear in public search results.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-shell">
          <section>
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                <Tag className="h-5 w-5 text-primary" />
                Item details
              </h2>
              <p className="text-sm text-slate-600">
                Write the record the way a student would search for it later.
              </p>
            </div>

            <div>
              <Label htmlFor="title">Item title *</Label>
              <Input
                id="title"
                placeholder="Example: black Nike water bottle"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className={errors.title ? "border-red-400" : ""}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(value) => updateField("category", value)}>
                  <SelectTrigger className={errors.category ? "border-red-400" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  placeholder="Example: water bottle"
                  value={form.subcategory}
                  onChange={(event) => updateField("subcategory", event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe color, markings, contents, stickers, damage, or anything a real owner would notice."
                rows={4}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                className={errors.description ? "border-red-400" : ""}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              {form.description.length > 10 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-1 text-primary"
                  onClick={handleCleanDescription}
                  disabled={aiProcessing}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Enhance Description
                </Button>
              )}
              {form.ai_description && (
                <div className="soft-panel mt-3 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">AI suggestion</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{form.ai_description}</p>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Color</Label>
                <Select value={form.color} onValueChange={(value) => updateField("color", value)}>
                  <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="Example: Nike, Apple, JanSport"
                  value={form.brand}
                  onChange={(event) => updateField("brand", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(value) => updateField("condition", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>{condition.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="features">Distinguishing features</Label>
                <Input
                  id="features"
                  placeholder="Scratches, engravings, labels, or stickers"
                  value={form.distinguishing_features}
                  onChange={(event) => updateField("distinguishing_features", event.target.value)}
                />
              </div>
            </div>

            <PhotoUploader photos={form.photo_urls} onChange={(urls) => updateField("photo_urls", urls)} />

            {(form.title || form.description) && (
              <div className="soft-panel px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Suggested tags</p>
                    <p className="text-xs text-slate-500">Useful for search, but kept visually lightweight.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleGenerateTags}
                    disabled={aiProcessing}
                  >
                    {aiProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Generate Tags
                  </Button>
                </div>
                {generatedTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {generatedTags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                <MapPin className="h-5 w-5 text-primary" />
                Location and time
              </h2>
              <p className="text-sm text-slate-600">
                Keep the public discovery details clear, then record private storage information separately.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Date found *</Label>
                <Input
                  type="date"
                  value={form.date_found}
                  onChange={(event) => updateField("date_found", event.target.value)}
                  className={errors.date_found ? "border-red-400" : ""}
                />
                {errors.date_found && <p className="mt-1 text-xs text-red-500">{errors.date_found}</p>}
              </div>
              <div>
                <Label>Time found (approx.)</Label>
                <Input type="time" value={form.time_found} onChange={(event) => updateField("time_found", event.target.value)} />
              </div>
            </div>

            <div>
              <Label>Location found *</Label>
              <Select value={form.location_found} onValueChange={(value) => updateField("location_found", value)}>
                <SelectTrigger className={errors.location_found ? "border-red-400" : ""}>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location_found && <p className="mt-1 text-xs text-red-500">{errors.location_found}</p>}
            </div>

            <div>
              <Label htmlFor="storage">Storage or pickup location</Label>
              <Input
                id="storage"
                placeholder="Example: main office lost-and-found cabinet"
                value={form.storage_location}
                onChange={(event) => updateField("storage_location", event.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">This field is visible only to administrators.</p>
            </div>
          </section>

          <section>
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                <User className="h-5 w-5 text-primary" />
                Your information
              </h2>
              <p className="text-sm text-slate-600">
                Contact details are stored only so staff can verify the record if needed.
              </p>
            </div>

            {user && (
              <div className="soft-panel px-4 py-4 text-sm text-slate-700">
                Signed in as <span className="font-semibold text-slate-900">{user.full_name}</span>. Contact fields stay
                blank unless you choose to fill them in.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="finder_name">Your name {!user ? "*" : "(optional)"}</Label>
                <Input
                  id="finder_name"
                  value={form.finder_name}
                  onChange={(event) => updateField("finder_name", event.target.value)}
                  className={errors.finder_name ? "border-red-400" : ""}
                />
                {errors.finder_name && <p className="mt-1 text-xs text-red-500">{errors.finder_name}</p>}
              </div>
              <div>
                <Label htmlFor="finder_email">Your email {!user ? "*" : "(optional)"}</Label>
                <Input
                  id="finder_email"
                  type="email"
                  value={form.finder_email}
                  onChange={(event) => updateField("finder_email", event.target.value)}
                  className={errors.finder_email ? "border-red-400" : ""}
                />
                {errors.finder_email && <p className="mt-1 text-xs text-red-500">{errors.finder_email}</p>}
              </div>
            </div>
            <div>
              <Label>Your role</Label>
              <Select value={form.finder_role} onValueChange={(value) => updateField("finder_role", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
              <ConsentCheckboxField
                id="privacy"
                checked={form.privacy_consent}
                onCheckedChange={(value) => updateField("privacy_consent", value)}
                error={errors.privacy_consent}>
                I consent to my contact information being stored in this demo build and used only for reuniting the
                item with its owner. *
              </ConsentCheckboxField>

              <ConsentCheckboxField
                id="terms"
                checked={form.terms_acknowledged}
                onCheckedChange={(value) => updateField("terms_acknowledged", value)}
                error={errors.terms_acknowledged}>
                I confirm that this record is accurate to the best of my knowledge. *
              </ConsentCheckboxField>
            </div>

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full gap-2">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
              {isSubmitting ? "Submitting and processing..." : "Submit Found Item"}
            </Button>
          </section>
        </div>
      </form>
    </div>
  );
}
