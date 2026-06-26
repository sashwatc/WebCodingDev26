/**
 * Lost Then Found - Report Found Item Page
 * Multi-section form with validation, photo upload, tag suggestions,
 * and description cleanup. Items go into moderation queue by default.
 */

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FloatingItemsCanvas from "@/components/shared/FloatingItemsCanvas";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  CalendarClock,
  Package,
  ShieldCheck,
  Shield,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

const STEPS = [
  { step: 1, labelKey: "report_found.step_identity", fallback: "Item Identity",          icon: Package,      sectionTitle: "Found Item Details",  sectionSub: "Tell us what you found" },
  { step: 2, labelKey: "report_found.step_location", fallback: "Time & Place",           icon: CalendarClock, sectionTitle: "When & Where",         sectionSub: "Help us locate the original owner" },
  { step: 3, labelKey: "report_found.step_details",  fallback: "Verification & Contact", icon: ShieldCheck,  sectionTitle: "Your Information",     sectionSub: "Private contact for follow-up" },
];

function locationFromZoneLabel(label = "") {
  const normalized = label.toLowerCase();
  if (normalized.includes("gym") || normalized.includes("athletic")) return "Gymnasium";
  if (normalized.includes("library")) return "Library";
  if (normalized.includes("office")) return "Main Office";
  if (normalized.includes("cafeteria")) return "Cafeteria";
  if (normalized.includes("bus")) return "Bus Loop";
  if (normalized.includes("auditorium")) return "Auditorium";
  return "";
}

const createInitialForm = (params = new URLSearchParams()) => ({
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
  linked_lost_report_id: "",
  event_hub_id: params.get("event") || params.get("event_hub_id") || "",
  campus_zone_id: params.get("zone") || params.get("campus_zone_id") || "",
  asset_tag: "",
  restricted_visibility: false,
  private_verification_clues: [],
  privacy_consent: false,
  terms_acknowledged: false,
  ai_description: "",
});

export default function ReportFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const linkedLostReportId = new URLSearchParams(location.search).get("lost_report_id") || "";
  const [step, setStep] = useState(1);
  const [helperProcessing, setHelperProcessing] = useState(false);
  const [form, setForm] = useState(() => createInitialForm(new URLSearchParams(location.search)));
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [generatedTags, setGeneratedTags] = useState([]);
  const [intakeSuggestion, setIntakeSuggestion] = useState(null);
  const aiProcessing = helperProcessing;

  const [formStep, setFormStep] = useState(1);
  const [prefilledReportId, setPrefilledReportId] = useState("");

  const { data: linkedLostReport } = useQuery({
    queryKey: ["linkedLostReport", linkedLostReportId],
    queryFn: async () => {
      const reports = await appClient.entities.LostReport.filter({ id: linkedLostReportId });
      return reports[0] || null;
    },
    enabled: !!linkedLostReportId,
  });

  const { data: campusZones = [] } = useQuery({
    queryKey: ["campusZones"],
    queryFn: () => appClient.campusZones.list(),
    enabled: Boolean(form.campus_zone_id),
  });

  useEffect(() => {
    if (!form.campus_zone_id || form.location_found) {
      return;
    }
    const zone = campusZones.find((entry) => entry.id === form.campus_zone_id);
    const nextLocation = locationFromZoneLabel(zone?.label || "");
    if (nextLocation) {
      setForm((current) => ({ ...current, location_found: nextLocation }));
    }
  }, [campusZones, form.campus_zone_id, form.location_found]);

  // Auto-populate finder fields from the logged-in user.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      finder_email: prev.finder_email || user.email || "",
      finder_name:  prev.finder_name  || user.full_name || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!linkedLostReport || prefilledReportId === linkedLostReport.id) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      title: prev.title || linkedLostReport.item_type || "",
      category: prev.category || linkedLostReport.category || "",
      description: prev.description || linkedLostReport.description || "",
      color: prev.color || linkedLostReport.color || "",
      brand: prev.brand || linkedLostReport.brand || "",
      linked_lost_report_id: linkedLostReport.id,
    }));
    setPrefilledReportId(linkedLostReport.id);
  }, [linkedLostReport, prefilledReportId]);

  useEffect(() => {
    const hasDraftContent = form.title.trim() !== "" || form.description.trim() !== "";
    const handler = (e) => {
      if (hasDraftContent) { e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.title, form.description]);

  const resetForm = () => {
    setForm(createInitialForm(new URLSearchParams(location.search)));
    setGeneratedTags([]);
    setErrors({});
    setFormStep(1);
    setPrefilledReportId("");
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
    setHelperProcessing(true);
    const tags = await generateTags(form.title, form.description, form.category);
    setGeneratedTags(tags);
    setHelperProcessing(false);
  };

  const handleCleanDescription = async () => {
    if (!form.description.trim()) return;
    setHelperProcessing(true);
    const cleaned = await cleanupDescription(form.description);
    updateField("ai_description", cleaned);
    setHelperProcessing(false);
    toast({
      title: t("report_found.description_enhanced"),
      description: t("report_found.description_enhanced_message"),
    });
  };

  const intakeSuggestionMutation = useMutation({
    mutationFn: () =>
      appClient.aiAssistance.suggestFoundItemFields({
        title: form.title,
        description: form.description,
        photo_urls: form.photo_urls,
      }),
    onSuccess: (suggestion) => {
      setIntakeSuggestion(suggestion);
      toast({
        title: "Editable suggestions ready",
        description: "Review each suggestion before applying it. AI never approves ownership or claims.",
      });
    },
    onError: (error) => {
      toast({
        title: "Suggestions unavailable",
        description: error.message || "Deterministic assistance could not be loaded.",
        variant: "destructive",
      });
    },
  });

  const applyIntakeSuggestion = (field) => {
    if (!intakeSuggestion) return;
    if (field === "tags") {
      setGeneratedTags(Array.isArray(intakeSuggestion.tags) ? intakeSuggestion.tags : []);
      return;
    }
    updateField(field, intakeSuggestion[field] || "");
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

      const createdItem = await appClient.entities.FoundItem.create({
        ...data,
        tags,
        ai_description: aiDesc,
        item_code: generateItemCode(),
        status: "FOUND",
      });

      if (data.linked_lost_report_id) {
        await appClient.matches.refreshFoundItem(createdItem.id);
      }

      return createdItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchRecords"] });
      queryClient.invalidateQueries({ queryKey: ["homePreviewItems"] });
      queryClient.invalidateQueries({ queryKey: ["adminFoundItems"] });
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

  const assetLookupMutation = useMutation({
    mutationFn: (tag) => appClient.assets.lookup(tag),
    onSuccess: (result) => {
      if (result.recognized) {
        updateField("restricted_visibility", true);
        toast({
          title: "School asset recognized",
          description: result.message,
        });
      } else {
        toast({
          title: "Asset tag not recognized",
          description: result.message,
        });
      }
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitMutation.isPending || submitMutation.isSuccess) return;
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
          <h1 className="text-2xl font-semibold text-foreground">{t("report_found.submitted_title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
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
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
      <FloatingItemsCanvas />
    <div className="page-shell max-w-5xl py-10" style={{ position: "relative", zIndex: 1 }}>
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
              <p className="font-semibold text-foreground">{t("report_found.public_listing_title")}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("report_found.public_listing_description")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">{t("report_found.reviewed_first_title")}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("report_found.reviewed_first_description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(form.event_hub_id || form.campus_zone_id) && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          You are reporting from a demo event beacon. This does not use GPS; correct the location if needed.
        </div>
      )}

      {/* Progress Tracker */}
      <div className="mb-4 bg-card border border-border rounded-xl px-6 py-5">
        <div className="flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const isCompleted = formStep > s.step;
            const isActive = formStep === s.step;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.step}>
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-600/20 border-2 border-emerald-500"
                      : isActive
                        ? "bg-primary/10 border-2 border-primary ring-4 ring-primary/15"
                        : "bg-muted border border-border"
                  }`}>
                    {isCompleted
                      ? <span className="text-emerald-400 text-sm font-bold">✓</span>
                      : isActive
                        ? <Icon className="w-4 h-4 text-primary" />
                        : <span className="text-xs font-bold text-muted-foreground">{s.step}</span>
                    }
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                    {t(s.labelKey, s.fallback)}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 mx-3 h-px bg-border relative -mt-5">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/60 transition-all duration-500"
                      style={{ width: isCompleted ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Section header */}
      {(() => {
        const current = STEPS[formStep - 1];
        const Icon = current.icon;
        return (
          <div className="mb-6 bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[15px] font-bold leading-none text-foreground">{current.sectionTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{current.sectionSub}</p>
            </div>
          </div>
        );
      })()}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-shell">
          {formStep === 1 && (
            <section className="space-y-6 animate-in fade-in duration-300">

              <div>
                <Label htmlFor="title">{t("report_found.item_title")}</Label>
                <Input
                  id="title"
                  placeholder={t("report_found.item_title_placeholder")}
                  value={form.title}
                  onChange={(event) => { updateField("title", event.target.value); setFieldErrors((e) => ({ ...e, title: "" })); }}
                  onBlur={() => { if (!form.title.trim()) setFieldErrors((e) => ({ ...e, title: "Required" })); }}
                  className={errors.title || fieldErrors.title ? "border-red-400" : ""}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                {fieldErrors.title && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.title}</p>}
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

              <div className="rounded-lg border border-border bg-muted p-4">
                <Label htmlFor="asset_tag">Optional school asset tag</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="asset_tag"
                    placeholder="PVHS-CB-1042"
                    value={form.asset_tag}
                    onChange={(event) => updateField("asset_tag", event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!form.asset_tag || assetLookupMutation.isPending}
                    onClick={() => assetLookupMutation.mutate(form.asset_tag)}
                  >
                    {assetLookupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check tag"}
                  </Button>
                </div>
                {form.restricted_visibility && (
                  <p className="mt-2 text-xs font-medium text-emerald-800">
                    Recognized school-owned property. It will be routed to the appropriate department.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="button" size="lg" onClick={handleNextStep} className="px-8">
                  {t("common.next", "Next")} →
                </Button>
              </div>
            </section>
          )}

          {formStep === 2 && (
            <section className="space-y-6 animate-in fade-in duration-300">

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
                <p className="mt-1 text-xs text-muted-foreground">{t("report_found.storage_admin_only")}</p>
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

              <div>
                <Label htmlFor="description">{t("report_found.description_label")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("report_found.description_placeholder")}
                  rows={4}
                  value={form.description}
                  onChange={(event) => { updateField("description", event.target.value); setFieldErrors((e) => ({ ...e, description: "" })); }}
                  onBlur={() => { if (!form.description.trim()) setFieldErrors((e) => ({ ...e, description: "Required" })); }}
                  className={errors.description || fieldErrors.description ? "border-red-400" : ""}
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                {fieldErrors.description && <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.description}</p>}
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("report_found.ai_suggestion")}</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{form.ai_description}</p>
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

              {((form.photo_urls || []).length > 0 || form.title || form.description) && (
                <div className="soft-panel px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Optional field suggestions</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Uses public item details only. Suggestions are editable and never approve ownership or claims.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => intakeSuggestionMutation.mutate()}
                      disabled={intakeSuggestionMutation.isPending}
                    >
                      {intakeSuggestionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Suggest fields
                    </Button>
                  </div>

                  {intakeSuggestion ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs leading-5 text-muted-foreground">
                        {intakeSuggestion.explanation || "Deterministic fallback generated these editable suggestions."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {intakeSuggestion.category ? (
                          <Button type="button" variant="secondary" size="sm" onClick={() => applyIntakeSuggestion("category")}>
                            Use category: {translateCategory(t, intakeSuggestion.category)}
                          </Button>
                        ) : null}
                        {intakeSuggestion.color ? (
                          <Button type="button" variant="secondary" size="sm" onClick={() => applyIntakeSuggestion("color")}>
                            Use color: {translateColor(t, intakeSuggestion.color)}
                          </Button>
                        ) : null}
                        {intakeSuggestion.brand ? (
                          <Button type="button" variant="secondary" size="sm" onClick={() => applyIntakeSuggestion("brand")}>
                            Use brand: {intakeSuggestion.brand}
                          </Button>
                        ) : null}
                        {Array.isArray(intakeSuggestion.tags) && intakeSuggestion.tags.length > 0 ? (
                          <Button type="button" variant="secondary" size="sm" onClick={() => applyIntakeSuggestion("tags")}>
                            Use {intakeSuggestion.tags.length} tags
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {(form.title || form.description) && (
                <div className="soft-panel px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("report_found.suggested_tags")}</p>
                      <p className="text-xs text-muted-foreground">{t("report_found.suggested_tags_description")}</p>
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
                <div className="soft-panel px-4 py-4 text-sm text-foreground">
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

              <div className="space-y-3 rounded-[18px] border border-border bg-muted px-4 py-4">
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
    </div>
  );
}
