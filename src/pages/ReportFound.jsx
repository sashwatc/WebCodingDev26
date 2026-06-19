/**
 * FindBack AI - Report Found Item Page
 * Multi-section form with validation, photo upload, AI tag generation,
 * and description cleanup. Items go into moderation queue by default.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { translateCategory, translateColor, translateCondition, translateLocation } from "@/lib/i18n-helpers";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [form, setForm] = useState(() => createInitialForm());
  const [errors, setErrors] = useState({});
  const [generatedTags, setGeneratedTags] = useState([]);

  const [formStep, setFormStep] = useState(1);

  const resetForm = () => {
    setForm(createInitialForm());
    setGeneratedTags([]);
    setErrors({});
    setFormStep(1);
  };

  const handleNextStep = () => {
    const errs = {};
    if (formStep === 1) {
      if (!form.title.trim()) errs.title = t("report_found.item_title_required");
      if (!form.category) errs.category = t("report_found.category_required");
    } else if (formStep === 2) {
      if (!form.date_found) errs.date_found = t("report_found.date_found_required");
      if (!form.location_found) errs.location_found = t("report_found.location_required");
    }
    
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setFormStep((prev) => prev + 1);
    } else {
      toast({
        title: t("report_found.missing_fields"),
        description: t("report_found.missing_fields_message"),
        variant: "destructive",
      });
    }
  };

  const handlePrevStep = () => {
    setFormStep((prev) => Math.max(1, prev - 1));
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = t("report_found.item_title_required");
    if (!form.category) errs.category = t("report_found.category_required");
    if (!form.description.trim()) errs.description = t("report_found.description_required");
    if (!form.date_found) errs.date_found = t("report_found.date_found_required");
    if (!form.location_found) errs.location_found = t("report_found.location_required");
    if (!user && !form.finder_name.trim()) errs.finder_name = t("report_found.your_name_required");
    if (!user && !form.finder_email.trim()) errs.finder_email = t("report_found.email_required");
    if (!form.privacy_consent) errs.privacy_consent = t("report_found.privacy_consent_required");
    if (!form.terms_acknowledged) errs.terms_acknowledged = t("report_found.terms_required");
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
      title: t("report_found.description_enhanced"),
      description: t("report_found.description_enhanced_message"),
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
        title: t("report_found.error"),
        description: error.message || t("report_found.submit_failed"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      toast({ title: t("report_found.missing_fields"), description: t("report_found.missing_fields_message"), variant: "destructive" });
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
          <h1 className="text-2xl font-semibold text-slate-950">{t("report_found.submitted_title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            {t("report_found.submitted_description")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => {
                resetForm();
                setStep(1);
              }}
            >
              {t("report_found.submit_another")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/Search")}>
              {t("report_found.view_search_page")}
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
        <span className="page-kicker">{t("report_found.kicker")}</span>
        <h1 className="page-title">{t("report_found.title")}</h1>
        <p className="page-subtitle">{t("report_found.subtitle")}</p>
      </div>

      <div className="mb-6 surface-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-slate-900">{t("report_found.public_listing_title")}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t("report_found.public_listing_description")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-slate-900">{t("report_found.reviewed_first_title")}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t("report_found.reviewed_first_description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="mb-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center relative">
          {/* Progress bar background line */}
          <div className="absolute left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 top-1/2 -translate-y-1/2 z-0" />
          {/* Active progress bar line */}
          <div 
            className="absolute left-0 h-0.5 bg-primary top-1/2 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((formStep - 1) / 2) * 100}%` }}
          />

          {[
            { step: 1, label: t("report_found.step_identity", "Item Identity") },
            { step: 2, label: t("report_found.step_location", "Time & Place") },
            { step: 3, label: t("report_found.step_details", "Verification & Contact") }
          ].map((item) => {
            const isCompleted = formStep > item.step;
            const isActive = formStep === item.step;
            return (
              <div key={item.step} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted 
                      ? "bg-emerald-600 text-white" 
                      : isActive 
                        ? "bg-primary text-white ring-4 ring-primary/20" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isCompleted ? "✓" : item.step}
                </div>
                <span className={`text-xs font-medium mt-2 ${isActive ? "text-primary font-semibold" : "text-slate-500"}`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-shell">
          {formStep === 1 && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <Tag className="h-5 w-5 text-primary" />
                  {t("report_found.item_details")}
                </h2>
                <p className="text-sm text-slate-600">
                  {t("report_found.item_details_description")}
                </p>
              </div>

              <div>
                <Label htmlFor="title">{t("report_found.item_title")}</Label>
                <Input
                  id="title"
                  placeholder={t("report_found.item_title_placeholder")}
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className={errors.title ? "border-red-400" : ""}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("common.category")} *</Label>
                  <Select value={form.category} onValueChange={(value) => updateField("category", value)}>
                    <SelectTrigger className={errors.category ? "border-red-400" : ""}>
                      <SelectValue placeholder={t("report_found.select_category")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>{translateCategory(t, category.value)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>
                <div>
                  <Label htmlFor="subcategory">{t("report_found.subcategory")}</Label>
                  <Input
                    id="subcategory"
                    placeholder={t("report_found.subcategory_placeholder")}
                    value={form.subcategory}
                    onChange={(event) => updateField("subcategory", event.target.value)}
                  />
                </div>
              </div>

              <PhotoUploader photos={form.photo_urls} onChange={(urls) => updateField("photo_urls", urls)} />

              <div className="flex justify-end pt-4">
                <Button type="button" size="lg" onClick={handleNextStep} className="px-8">
                  {t("common.next", "Next")} →
                </Button>
              </div>
            </section>
          )}

          {formStep === 2 && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t("report_found.location_and_time")}
                </h2>
                <p className="text-sm text-slate-600">
                  {t("report_found.location_and_time_description")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("report_found.date_found")}</Label>
                  <Input
                    type="date"
                    value={form.date_found}
                    onChange={(event) => updateField("date_found", event.target.value)}
                    className={errors.date_found ? "border-red-400" : ""}
                  />
                  {errors.date_found && <p className="mt-1 text-xs text-red-500">{errors.date_found}</p>}
                </div>
                <div>
                  <Label>{t("report_found.time_found")}</Label>
                  <Input type="time" value={form.time_found} onChange={(event) => updateField("time_found", event.target.value)} />
                </div>
              </div>

              <div>
                <Label>{t("report_found.location_found")}</Label>
                <Select value={form.location_found} onValueChange={(value) => updateField("location_found", value)}>
                  <SelectTrigger className={errors.location_found ? "border-red-400" : ""}>
                    <SelectValue placeholder={t("report_found.select_location")} />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>{translateLocation(t, location)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location_found && <p className="mt-1 text-xs text-red-500">{errors.location_found}</p>}
              </div>

              <div>
                <Label htmlFor="storage">{t("report_found.storage_location")}</Label>
                <Input
                  id="storage"
                  placeholder={t("report_found.storage_placeholder")}
                  value={form.storage_location}
                  onChange={(event) => updateField("storage_location", event.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">{t("report_found.storage_admin_only")}</p>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" size="lg" onClick={handlePrevStep}>
                  ← {t("common.back")}
                </Button>
                <Button type="button" size="lg" onClick={handleNextStep} className="px-8">
                  {t("common.next", "Next")} →
                </Button>
              </div>
            </section>
          )}

          {formStep === 3 && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <User className="h-5 w-5 text-primary" />
                  {t("report_found.your_information")}
                </h2>
                <p className="text-sm text-slate-600">
                  {t("report_found.your_information_description")}
                </p>
              </div>

              <div>
                <Label htmlFor="description">{t("report_found.description_label")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("report_found.description_placeholder")}
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
                    {t("report_found.enhance_description")}
                  </Button>
                )}
                {form.ai_description && (
                  <div className="soft-panel mt-3 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("report_found.ai_suggestion")}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{form.ai_description}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("common.color")}</Label>
                  <Select value={form.color} onValueChange={(value) => updateField("color", value)}>
                    <SelectTrigger><SelectValue placeholder={t("report_found.select_color")} /></SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => (
                        <SelectItem key={color} value={color}>{translateColor(t, color)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="brand">{t("common.brand")}</Label>
                  <Input
                    id="brand"
                    placeholder={t("report_found.brand_placeholder")}
                    value={form.brand}
                    onChange={(event) => updateField("brand", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("common.condition")}</Label>
                  <Select value={form.condition} onValueChange={(value) => updateField("condition", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>{translateCondition(t, condition.value)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="features">{t("report_found.distinguishing_features")}</Label>
                  <Input
                    id="features"
                    placeholder={t("report_found.features_placeholder")}
                    value={form.distinguishing_features}
                    onChange={(event) => updateField("distinguishing_features", event.target.value)}
                  />
                </div>
              </div>

              {(form.title || form.description) && (
                <div className="soft-panel px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t("report_found.suggested_tags")}</p>
                      <p className="text-xs text-slate-500">{t("report_found.suggested_tags_description")}</p>
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
                      {t("report_found.generate_tags")}
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

              {user && (
                <div className="soft-panel px-4 py-4 text-sm text-slate-700">
                  {t("report_found.signed_in_as", { name: user.full_name })}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="finder_name">{`${t("report_found.your_name")} ${!user ? "*" : `(${t("common.optional")})`}`}</Label>
                  <Input
                    id="finder_name"
                    value={form.finder_name}
                    onChange={(event) => updateField("finder_name", event.target.value)}
                    className={errors.finder_name ? "border-red-400" : ""}
                  />
                  {errors.finder_name && <p className="mt-1 text-xs text-red-500">{errors.finder_name}</p>}
                </div>
                <div>
                  <Label htmlFor="finder_email">{`${t("report_found.your_email")} ${!user ? "*" : `(${t("common.optional")})`}`}</Label>
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
                <Label>{t("report_found.your_role")}</Label>
                <Select value={form.finder_role} onValueChange={(value) => updateField("finder_role", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">{t("report_found.role_student")}</SelectItem>
                    <SelectItem value="staff">{t("report_found.role_staff")}</SelectItem>
                    <SelectItem value="admin">{t("report_found.role_admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <ConsentCheckboxField
                  id="privacy"
                  checked={form.privacy_consent}
                  onCheckedChange={(value) => updateField("privacy_consent", value)}
                  error={errors.privacy_consent}>
                  {t("report_found.privacy_consent_text")}
                </ConsentCheckboxField>

                <ConsentCheckboxField
                  id="terms"
                  checked={form.terms_acknowledged}
                  onCheckedChange={(value) => updateField("terms_acknowledged", value)}
                  error={errors.terms_acknowledged}>
                  {t("report_found.terms_text")}
                </ConsentCheckboxField>
              </div>

              <div className="flex justify-between pt-4 gap-3">
                <Button type="button" variant="outline" size="lg" onClick={handlePrevStep}>
                  ← {t("common.back")}
                </Button>
                <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1 gap-2">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                  {isSubmitting ? t("report_found.submitting") : t("report_found.submit_button")}
                </Button>
              </div>
            </section>
          )}
        </div>
      </form>
    </div>
  );
}
