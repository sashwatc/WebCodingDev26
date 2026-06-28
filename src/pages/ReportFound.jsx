/**
 * ReportFound.jsx - Report a Found Item Page
 *
 * Purpose: a 3-step wizard where a finder logs an item they found. The newly
 * created FoundItem enters the system with status "FOUND" (moderation/intake),
 * becoming searchable and matchable against open lost reports.
 *
 * The wizard steps (tracked by `formStep`):
 *   1. Item Identity   — title, category, subcategory, photos, optional asset tag
 *   2. Time & Place    — date/time found, location, (admin-only) storage location
 *   3. Verify & Contact— description, color/brand/condition/features, AI tag and
 *                        field suggestions, finder name/email/role, consents
 * After a successful submit, `step` flips to 2 to show a confirmation screen.
 *
 * Notable behaviors:
 *   - Auto-saves a draft to localStorage and offers to restore it on return.
 *   - Warns before unload while there's unsaved content.
 *   - Can be opened with ?lost_report_id= to prefill from a matching lost report,
 *     and with ?event=/?zone= beacon params to prefill the location.
 *   - Optional deterministic "AI" helpers: clean up the description, generate
 *     tags, suggest editable fields, and look up a school asset tag.
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

// Wizard step metadata: drives the progress tracker and the per-step section header.
const STEPS = [
  { step: 1, labelKey: "report_found.step_identity", fallback: "Item Identity",          icon: Package,      sectionTitle: "Found Item Details",  sectionSub: "Tell us what you found" },
  { step: 2, labelKey: "report_found.step_location", fallback: "Time & Place",           icon: CalendarClock, sectionTitle: "When & Where",         sectionSub: "Help us locate the original owner" },
  { step: 3, labelKey: "report_found.step_details",  fallback: "Verification & Contact", icon: ShieldCheck,  sectionTitle: "Your Information",     sectionSub: "Private contact for follow-up" },
];

// Maps a free-text campus-zone beacon label (e.g. "North Gym") to one of the
// canonical LOCATIONS used in the form's select, so beacon links can prefill it.
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

// Builds the blank form state. Event/zone beacon ids are read from URL params
// up front so a beacon-originated report starts already tied to that context.
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
  // ?lost_report_id= — when present, prefill the form from that lost report.
  const linkedLostReportId = new URLSearchParams(location.search).get("lost_report_id") || "";
  const [step, setStep] = useState(1); // 1 = wizard, 2 = post-submit success screen
  const [helperProcessing, setHelperProcessing] = useState(false); // AI helper spinner
  const [form, setForm] = useState(() => createInitialForm(new URLSearchParams(location.search)));
  const [errors, setErrors] = useState({}); // validation errors (submit / step gates)
  const [fieldErrors, setFieldErrors] = useState({}); // per-field on-blur "Required" hints
  const [generatedTags, setGeneratedTags] = useState([]); // AI-suggested tags
  const [intakeSuggestion, setIntakeSuggestion] = useState(null); // editable field suggestions
  const aiProcessing = helperProcessing; // alias used by the AI helper buttons

  const [formStep, setFormStep] = useState(1); // current wizard step (1-3)
  const [prefilledReportId, setPrefilledReportId] = useState(""); // guards one-time prefill
  const [showDraftBanner, setShowDraftBanner] = useState(false); // restore-draft prompt
  const DRAFT_KEY = "ltf_report_found_draft"; // localStorage key for the autosaved draft

  // Load the linked lost report (for prefill) when ?lost_report_id= is present.
  const { data: linkedLostReport } = useQuery({
    queryKey: ["linkedLostReport", linkedLostReportId],
    queryFn: async () => {
      const reports = await appClient.entities.LostReport.filter({ id: linkedLostReportId });
      return reports[0] || null;
    },
    enabled: !!linkedLostReportId,
  });

  // Campus zones — only fetched when arriving via a zone beacon, to resolve its label.
  const { data: campusZones = [] } = useQuery({
    queryKey: ["campusZones"],
    queryFn: () => appClient.campusZones.list(),
    enabled: Boolean(form.campus_zone_id),
  });

  // Prefill the location from the beacon's campus zone (only if not already set).
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

  // One-time prefill from the linked lost report (without clobbering edits the
  // user already made). prefilledReportId guards against re-applying it.
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

  // Warn before navigating away if the report has unsaved content.
  useEffect(() => {
    const hasDraftContent = form.title.trim() !== "" || form.description.trim() !== "";
    const handler = (e) => {
      if (hasDraftContent) { e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [form.title, form.description]);

  // Check for a saved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.title?.trim() || draft?.description?.trim()) {
          setShowDraftBanner(true);
        }
      }
    } catch {
      // Ignore corrupt draft
    }
  }, []);

  // Auto-save draft whenever form changes
  useEffect(() => {
    if (!form.title.trim() && !form.description.trim()) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage failures
    }
  }, [form]);

  // Reset everything back to a blank wizard (used by "Submit another").
  const resetForm = () => {
    setForm(createInitialForm(new URLSearchParams(location.search)));
    setGeneratedTags([]);
    setErrors({});
    setFormStep(1);
    setPrefilledReportId("");
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setShowDraftBanner(false);
  };

  // Validate the current step's required fields before advancing the wizard.
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

  // Step back one wizard step (never below 1).
  const handlePrevStep = () => {
    setFormStep((prev) => Math.max(1, prev - 1));
  };

  // Generic controlled-field setter; clears any existing error for that field.
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Full-form validation run on final submit (covers every required field).
  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = t("report_found.item_title_required");
    if (!form.category) errs.category = t("report_found.category_required");
    if (!form.description.trim()) errs.description = t("report_found.description_required");
    if (!form.date_found) errs.date_found = t("report_found.date_found_required");
    if (!form.location_found) errs.location_found = t("report_found.location_required");
    // Name/email are required only for anonymous finders (logged-in users are known).
    if (!user && !form.finder_name.trim()) errs.finder_name = t("report_found.your_name_required");
    if (!user && !form.finder_email.trim()) errs.finder_email = t("report_found.email_required");
    else if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.finder_email.trim())) {
      errs.finder_email = t("report_found.email_invalid", "Enter a valid email address.");
    }
    if (!form.privacy_consent) errs.privacy_consent = t("report_found.privacy_consent_required");
    if (!form.terms_acknowledged) errs.terms_acknowledged = t("report_found.terms_required");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // AI helper: generate suggested tags from the title/description/category.
  const handleGenerateTags = async () => {
    if (!form.title && !form.description) return;
    setHelperProcessing(true);
    const tags = await generateTags(form.title, form.description, form.category);
    setGeneratedTags(tags);
    setHelperProcessing(false);
  };

  // AI helper: rewrite the raw description into a cleaner `ai_description`.
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

  // AI helper: deterministic field suggestions (category/color/brand/tags) the
  // finder can individually apply or dismiss. Never auto-approves anything.
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

  // Apply one suggested field into the form (tags handled specially), then dismiss it.
  const applyIntakeSuggestion = (field) => {
    if (!intakeSuggestion) return;
    if (field === "tags") {
      setGeneratedTags(Array.isArray(intakeSuggestion.tags) ? intakeSuggestion.tags : []);
    } else {
      updateField(field, intakeSuggestion[field] || "");
    }
    dismissIntakeSuggestion(field);
  };

  // Remove a single suggested field from the suggestion set without applying it.
  const dismissIntakeSuggestion = (field) => {
    if (!intakeSuggestion) return;
    setIntakeSuggestion((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (field === "tags") {
        next.tags = [];
      } else {
        delete next[field];
      }
      return next;
    });
  };

  // Primary submit: creates the FoundItem, backfilling tags/ai_description if the
  // user didn't generate them, assigning an item code, and seeding status "FOUND".
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      // Ensure tags exist (generate from content if none were produced).
      let tags = generatedTags;
      if (tags.length === 0 && data.title) {
        tags = await generateTags(data.title, data.description, data.category);
      }

      // Ensure a cleaned AI description exists.
      let aiDesc = data.ai_description;
      if (!aiDesc && data.description) {
        aiDesc = await cleanupDescription(data.description);
      }

      const createdItem = await appClient.entities.FoundItem.create({
        ...data,
        tags,
        ai_description: aiDesc,
        item_code: generateItemCode(), // human-readable tracking code
        status: "FOUND",
      });

      // If this report was created against a lost report, recompute matches now.
      if (data.linked_lost_report_id) {
        await appClient.matches.refreshFoundItem(createdItem.id);
      }

      return createdItem;
    },
    // Refresh dependent lists, clear the draft, and show the success screen.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchRecords"] });
      queryClient.invalidateQueries({ queryKey: ["homePreviewItems"] });
      queryClient.invalidateQueries({ queryKey: ["adminFoundItems"] });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setShowDraftBanner(false);
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

  // Asset-tag lookup: if a school asset tag is recognized, flag the item as
  // restricted-visibility so it's routed to the owning department.
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

  // Final submit: guard against double-submit, validate, then fire the mutation.
  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitMutation.isPending || submitMutation.isSuccess) return;
    if (!validate()) {
      toast({ title: t("report_found.missing_fields"), description: t("report_found.missing_fields_message"), variant: "destructive" });
      return;
    }

    submitMutation.mutate(form);
  };

  // ── Success screen (step 2): confirmation + submit-another / view-search ──
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

  // ── Wizard view (step 1): animated background, header, draft/beacon banners,
  //     progress tracker, per-step section header, and the 3-step form ──
  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
      {/* Decorative animated floating-items background */}
      <FloatingItemsCanvas />
    <div className="page-shell max-w-5xl py-10" style={{ position: "relative", zIndex: 1 }}>
      {/* Page header: kicker, title, subtitle */}
      <div className="page-header">
        <span className="page-kicker">{t("report_found.kicker")}</span>
        <h1 className="page-title">{t("report_found.title")}</h1>
        <p className="page-subtitle">{t("report_found.subtitle")}</p>
      </div>

      {/* Restore-draft banner: shown when a saved draft was found on mount */}
      {showDraftBanner && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="text-foreground">You have an unsaved draft from a previous session.</span>
          <div className="ml-4 flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                try {
                  const raw = localStorage.getItem(DRAFT_KEY);
                  if (raw) {
                    const draft = JSON.parse(raw);
                    setForm((prev) => ({ ...prev, ...draft }));
                  }
                } catch { /* ignore */ }
                setShowDraftBanner(false);
              }}
            >
              Restore draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
                setShowDraftBanner(false);
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Reassurance panel: how the listing is published and that it's reviewed first */}
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

      {/* Beacon notice: shown when opened from an event/zone beacon link */}
      {(form.event_hub_id || form.campus_zone_id) && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          You are reporting from a demo event beacon. This does not use GPS; correct the location if needed.
        </div>
      )}

      {/* Progress Tracker — step circles + connector lines reflecting formStep */}
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

      {/* Section header — title/subtitle for the current step (from STEPS) */}
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

      {/* Wizard form — only the active step's <section> renders at a time */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-shell">
          {/* STEP 1 — Item Identity: title, category/subcategory, photos, asset tag */}
          {formStep === 1 && (
            <section className="space-y-6 animate-in fade-in duration-300">

              {/* Title (required) with on-blur required hint */}
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

              {/* Photo upload (stores returned URLs onto form.photo_urls) */}
              <PhotoUploader photos={form.photo_urls} onChange={(urls) => updateField("photo_urls", urls)} />

              {/* Optional school asset tag + "Check tag" lookup */}
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

          {/* STEP 2 — Time & Place: date/time found, location, storage (admin-only) */}
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

          {/* STEP 3 — Verify & Contact: description + AI helpers, attributes,
              field suggestions, suggested tags, finder contact, and consents */}
          {formStep === 3 && (
            <section className="space-y-6 animate-in fade-in duration-300">

              {/* Description + "Enhance" (AI cleanup) and its suggested result */}
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

              {/* Optional field suggestions panel — request, then apply/dismiss each */}
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
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="secondary" size="sm" onClick={() => applyIntakeSuggestion("category")}>
                              Use category: {translateCategory(t, intakeSuggestion.category)}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="px-1.5 text-muted-foreground" onClick={() => dismissIntakeSuggestion("category")} aria-label="Dismiss category suggestion">✕</Button>
                          </div>
                        ) : null}
                        {intakeSuggestion.color ? (
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="secondary" size="sm" onClick={() => applyIntakeSuggestion("color")}>
                              Use color: {translateColor(t, intakeSuggestion.color)}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="px-1.5 text-muted-foreground" onClick={() => dismissIntakeSuggestion("color")} aria-label="Dismiss color suggestion">✕</Button>
                          </div>
                        ) : null}
                        {intakeSuggestion.brand ? (
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="secondary" size="sm" onClick={() => applyIntakeSuggestion("brand")}>
                              Use brand: {intakeSuggestion.brand}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="px-1.5 text-muted-foreground" onClick={() => dismissIntakeSuggestion("brand")} aria-label="Dismiss brand suggestion">✕</Button>
                          </div>
                        ) : null}
                        {Array.isArray(intakeSuggestion.tags) && intakeSuggestion.tags.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="secondary" size="sm" onClick={() => applyIntakeSuggestion("tags")}>
                              Use {intakeSuggestion.tags.length} tags
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="px-1.5 text-muted-foreground" onClick={() => dismissIntakeSuggestion("tags")} aria-label="Dismiss tags suggestion">✕</Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Suggested tags panel — generate tags and show them as badges */}
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

              {/* Signed-in notice: finder contact is associated with this account */}
              {user && (
                <div className="soft-panel px-4 py-4 text-sm text-foreground">
                  {t("report_found.signed_in_as", { name: user.full_name })}
                </div>
              )}

              {/* Finder contact — name/email required only for anonymous finders */}
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

              {/* Required consents: privacy consent + terms acknowledgement */}
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

              {/* Back + final Submit (disabled while the create mutation is pending) */}
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
