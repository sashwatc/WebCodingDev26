import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { CATEGORIES, LOCATIONS, COLORS } from "@/lib/constants";
import { translateCategory, translateColor } from "@/lib/i18n-helpers";
import PhotoUploader from "@/components/shared/PhotoUploader";
import {
  AlertCircle, Camera, CheckCircle2, ChevronLeft, ChevronRight,
  FileText, Loader2, Sparkles, Tag,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const DRAFT_KEY = "ltf-report-found-draft";

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good",      label: "Good" },
  { value: "fair",      label: "Fair" },
  { value: "poor",      label: "Poor" },
];

const STEPS = [
  { number: 1, label: "Photos",      icon: Camera },
  { number: 2, label: "Item Details", icon: Tag },
  { number: 3, label: "Features",    icon: FileText },
  { number: 4, label: "Review",      icon: CheckCircle2 },
];

const STEP_TRIGGER_FIELDS = {
  2: ["title", "category", "date_found", "location_found"],
  3: ["description"],
};

// ── Zod schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  photo_urls:             z.array(z.string()).default([]),
  title:                  z.string().min(1, "Item title is required"),
  category:               z.string().min(1, "Category is required"),
  color:                  z.string().default(""),
  brand:                  z.string().default(""),
  date_found:             z.string().min(1, "Date found is required"),
  time_found:             z.string().default(""),
  location_found:         z.string().min(1, "Location is required"),
  condition:              z.string().default("good"),
  description:            z.string().min(1, "Description is required"),
  distinguishing_features: z.string().default(""),
  storage_location:       z.string().default(""),
});

// ── Sub-components (defined outside to avoid unmount-on-render) ───────────────

function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 border-b border-slate-100 py-2.5 last:border-none">
      <span className="w-32 shrink-0 text-[11px] font-semibold uppercase tracking-[0.10em] text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-800 leading-relaxed">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportFound() {
  useEffect(() => { document.title = "Report Found Item — Lost Then Found"; }, []);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [createdItem, setCreatedItem] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const {
    register, control, handleSubmit, trigger, watch, setValue, getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      photo_urls: [], title: "", category: "", color: "", brand: "",
      date_found: "", time_found: "", location_found: "", condition: "good",
      description: "", distinguishing_features: "", storage_location: "",
    },
    mode: "onBlur",
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") setValue(key, val);
      });
    } catch { /* ignore corrupt draft */ }
  }, [setValue]);

  // Autosave draft on every field change
  useEffect(() => {
    const { unsubscribe } = watch((values) => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(values)); } catch { /* ignore */ }
    });
    return unsubscribe;
  }, [watch]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = async () => {
    const fields = STEP_TRIGGER_FIELDS[step];
    if (fields) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── AI suggestions ─────────────────────────────────────────────────────────

  const aiMutation = useMutation({
    mutationFn: () => {
      const { title, description, photo_urls } = getValues();
      return appClient.aiAssistance.suggestFoundItemFields({ title, description, photo_urls });
    },
    onSuccess: (suggestion) => {
      setAiSuggestion(suggestion);
      toast({ title: "Suggestions ready", description: "Review and apply each suggestion individually." });
    },
    onError: (error) => {
      toast({ title: "Suggestions unavailable", description: error.message, variant: "destructive" });
    },
  });

  const applyAiField = (field, value) => {
    setValue(field, value, { shouldDirty: true, shouldTouch: true });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: (data) => appClient.items.create(data),
    onSuccess: (item) => {
      localStorage.removeItem(DRAFT_KEY);
      setCreatedItem(item);
    },
    onError: (error) => {
      setSubmitError(error.message || "Submission failed. Please try again.");
    },
  });

  const onSubmit = (data) => {
    setSubmitError(null);
    submitMutation.mutate(data);
  };

  // ── Success screen ──────────────────────────────────────────────────────────

  if (createdItem) {
    return (
      <div className="page-shell max-w-xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Item reported!</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
            <strong>{createdItem.title || "Your item"}</strong> has been logged and is pending staff review.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {createdItem.id && (
              <Button asChild>
                <Link to={`/ItemDetails?id=${createdItem.id}`}>View Item</Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/Search")}>
              Browse Items
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const fieldError = (name) =>
    errors[name] ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
        {errors[name].message}
      </p>
    ) : null;

  const values = watch();

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="page-shell max-w-2xl py-10">
      <div className="page-header">
        <span className="page-kicker">Found something?</span>
        <h1 className="page-title">Report a Found Item</h1>
        <p className="page-subtitle">
          Help reunite an item with its owner by logging what you found.
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Step {step} of 4</p>
          <p className="text-xs text-slate-400">{STEPS[step - 1].label}</p>
        </div>
        <div
          className="relative h-1.5 rounded-full bg-slate-200"
          role="progressbar"
          aria-label={`Step ${step} of 4`}
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={4}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 flex justify-between">
          {STEPS.map(({ number, label, icon: Icon }) => {
            const done   = step > number;
            const active = step === number;
            return (
              <div key={number} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done   ? "bg-emerald-600 text-white" :
                    active ? "bg-primary text-white ring-4 ring-primary/20" :
                             "bg-slate-100 text-slate-400"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? "✓" : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                </div>
                <span className={`hidden text-[10px] font-medium sm:block ${active ? "text-primary" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="surface-card px-6 py-8 sm:px-8">

          {/* ── Step 1: Photos ──────────────────────────────────────────────── */}
          {step === 1 && (
            <section className="animate-in fade-in space-y-6 duration-200">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
                  Photos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add up to 5 photos. Clear images help the owner recognize their item faster.
                </p>
              </div>
              <Controller
                name="photo_urls"
                control={control}
                render={({ field }) => (
                  <PhotoUploader
                    photos={field.value}
                    onChange={field.onChange}
                    maxPhotos={5}
                    enableCrop
                  />
                )}
              />
            </section>
          )}

          {/* ── Step 2: Item Details ────────────────────────────────────────── */}
          {step === 2 && (
            <section className="animate-in fade-in space-y-6 duration-200">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Tag className="h-5 w-5 text-primary" aria-hidden="true" />
                  Item Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Describe the item so the owner can identify it.
                </p>
              </div>

              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Item title <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Black AirPods Pro case"
                  className={`mt-1.5 min-h-[44px] ${errors.title ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                  aria-required="true"
                  aria-describedby={errors.title ? "title-error" : undefined}
                  {...register("title")}
                />
                {errors.title && (
                  <p id="title-error" className="mt-1 flex items-center gap-1 text-xs text-red-500" role="alert">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="rf-category" className="text-sm font-medium">
                    Category <span className="text-red-500" aria-hidden="true">*</span>
                  </Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="rf-category"
                          className={`mt-1.5 min-h-[44px] ${errors.category ? "border-red-400" : ""}`}
                          aria-required="true"
                        >
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {translateCategory(t, cat.value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {fieldError("category")}
                </div>
                <div>
                  <Label htmlFor="rf-condition" className="text-sm font-medium">Condition</Label>
                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="rf-condition" className="mt-1.5 min-h-[44px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="rf-color" className="text-sm font-medium">Color</Label>
                  <Controller
                    name="color"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="rf-color" className="mt-1.5 min-h-[44px]">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLORS.map((color) => (
                            <SelectItem key={color} value={color}>{translateColor(t, color)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g. Apple, Nike"
                    className="mt-1.5 min-h-[44px]"
                    {...register("brand")}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="date_found" className="text-sm font-medium">
                    Date found <span className="text-red-500" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="date_found"
                    type="date"
                    className={`mt-1.5 min-h-[44px] ${errors.date_found ? "border-red-400" : ""}`}
                    aria-required="true"
                    {...register("date_found")}
                  />
                  {fieldError("date_found")}
                </div>
                <div>
                  <Label htmlFor="time_found" className="text-sm font-medium">Time found</Label>
                  <Input
                    id="time_found"
                    type="time"
                    className="mt-1.5 min-h-[44px]"
                    {...register("time_found")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rf-location" className="text-sm font-medium">
                  Location found <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Controller
                  name="location_found"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="rf-location"
                        className={`mt-1.5 min-h-[44px] ${errors.location_found ? "border-red-400" : ""}`}
                        aria-required="true"
                      >
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {fieldError("location_found")}
              </div>
            </section>
          )}

          {/* ── Step 3: Features + Storage ──────────────────────────────────── */}
          {step === 3 && (
            <section className="animate-in fade-in space-y-6 duration-200">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  Distinguishing Features
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add details that help staff verify ownership.
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-red-500" aria-hidden="true">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what the item looks like, visible wear, labels, contents if applicable…"
                  rows={4}
                  className={`mt-1.5 min-h-[44px] ${errors.description ? "border-red-400" : ""}`}
                  aria-required="true"
                  {...register("description")}
                />
                {fieldError("description")}
              </div>

              <div>
                <Label htmlFor="distinguishing_features" className="text-sm font-medium">
                  Distinguishing features
                </Label>
                <Textarea
                  id="distinguishing_features"
                  placeholder="Stickers, engravings, damage, custom markings, initials…"
                  rows={3}
                  className="mt-1.5 min-h-[44px]"
                  {...register("distinguishing_features")}
                />
              </div>

              <div>
                <Label htmlFor="storage_location" className="text-sm font-medium">
                  Storage location
                  <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Visible to staff only
                  </span>
                </Label>
                <Input
                  id="storage_location"
                  placeholder="e.g. Main Office shelf B, Room 204 lost & found bin"
                  className="mt-1.5 min-h-[44px]"
                  {...register("storage_location")}
                />
              </div>

              {/* AI suggest panel */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">AI field suggestions</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      Editable only — AI never approves ownership or claims.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] gap-1.5"
                    disabled={aiMutation.isPending}
                    onClick={() => aiMutation.mutate()}
                  >
                    {aiMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                    Suggest fields
                  </Button>
                </div>

                {aiSuggestion && (
                  <div className="mt-4 space-y-3">
                    {aiSuggestion.explanation && (
                      <p className="text-xs leading-5 text-slate-500">{aiSuggestion.explanation}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestion.category && (
                        <Button type="button" variant="secondary" size="sm" className="min-h-[44px]"
                          onClick={() => applyAiField("category", aiSuggestion.category)}>
                          Category: {translateCategory(t, aiSuggestion.category)}
                        </Button>
                      )}
                      {aiSuggestion.color && (
                        <Button type="button" variant="secondary" size="sm" className="min-h-[44px]"
                          onClick={() => applyAiField("color", aiSuggestion.color)}>
                          Color: {translateColor(t, aiSuggestion.color)}
                        </Button>
                      )}
                      {aiSuggestion.brand && (
                        <Button type="button" variant="secondary" size="sm" className="min-h-[44px]"
                          onClick={() => applyAiField("brand", aiSuggestion.brand)}>
                          Brand: {aiSuggestion.brand}
                        </Button>
                      )}
                      {aiSuggestion.description && (
                        <Button type="button" variant="secondary" size="sm" className="min-h-[44px]"
                          onClick={() => applyAiField("description", aiSuggestion.description)}>
                          Use suggested description
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Step 4: Review + Submit ─────────────────────────────────────── */}
          {step === 4 && (
            <section className="animate-in fade-in space-y-6 duration-200">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  Review &amp; Submit
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Double-check your report before submitting.
                </p>
              </div>

              {values.photo_urls.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.10em] text-slate-400">
                    Photos ({values.photo_urls.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {values.photo_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white px-5 py-1">
                <ReviewRow label="Title" value={values.title} />
                <ReviewRow label="Category" value={values.category ? translateCategory(t, values.category) : ""} />
                <ReviewRow label="Condition" value={CONDITION_OPTIONS.find((o) => o.value === values.condition)?.label} />
                <ReviewRow label="Color" value={values.color ? translateColor(t, values.color) : ""} />
                <ReviewRow label="Brand" value={values.brand} />
                <ReviewRow label="Date Found" value={values.date_found} />
                <ReviewRow label="Time Found" value={values.time_found} />
                <ReviewRow label="Location" value={values.location_found} />
                <ReviewRow label="Description" value={values.description} />
                <ReviewRow label="Features" value={values.distinguishing_features} />
                <ReviewRow label="Storage" value={values.storage_location} />
              </div>

              {submitError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Submission failed</p>
                    <p className="mt-0.5 text-xs text-red-600">{submitError}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Step navigation ─────────────────────────────────────────────── */}
          <div className={`mt-8 flex flex-col-reverse gap-3 sm:flex-row ${step === 1 ? "sm:justify-end" : "sm:justify-between"}`}>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="min-h-[44px] w-full gap-2 sm:w-auto"
                onClick={handleBack}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                type="button"
                size="lg"
                className="min-h-[44px] w-full gap-2 sm:w-auto"
                onClick={handleNext}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="lg"
                className="min-h-[44px] w-full gap-2 sm:w-auto sm:flex-1"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Submitting…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Submit Report</>
                )}
              </Button>
            )}
          </div>

        </div>
      </form>
    </div>
  );
}
