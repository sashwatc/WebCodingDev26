/**
 * ReportLost.jsx - Report a Lost Item Page
 *
 * Purpose: a 3-step wizard where a student/staffer reports something they lost.
 * On submit it creates a LostReport (status "open") and immediately runs a match
 * query against the found-item inventory, then shows the suggested matches.
 *
 * The wizard steps (tracked by `formStep`):
 *   1. Item Identity — item type, category, color, brand, reference photos
 *   2. Time & Place  — date lost, last-seen location, urgency, extra notes
 *   3. Verify        — description, private contact name/email, student id, consent
 *
 * Screen flow via `step`:
 *   1 = the wizard form, 2 = a transient "matching…" loading screen,
 *   3 = the results screen listing potential found-item matches (or "no matches").
 *
 * Notable behaviors: autosaves a draft to localStorage (with restore banner),
 * warns before unload with unsaved content, prefills contact from the signed-in
 * user, and prefills location from an event/zone beacon (?event=/?zone=).
 */

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import FloatingItemsCanvas from "@/components/shared/FloatingItemsCanvas";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { translateCategory, translateColor, translateLocation, translateUrgency } from "@/lib/i18n-helpers";
import { ConsentCheckboxField } from "@/components/shared/ConsentCheckboxField";
import PhotoUploader from "@/components/shared/PhotoUploader";
import {
  Brain,
  Briefcase,
  CalendarClock,
  Eye,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// Wizard step metadata: drives the progress tracker and per-step section header.
const STEPS = [
  { step: 1, labelKey: "report_found.step_identity", fallback: "Item Identity", icon: Briefcase, sectionTitle: "Lost Item Details", sectionSub: "Tell us what the item is" },
  { step: 2, labelKey: "report_found.step_location", fallback: "Time & Place",  icon: CalendarClock, sectionTitle: "When & Where", sectionSub: "Help us narrow down the search" },
  { step: 3, labelKey: "report_found.step_details", fallback: "Verification & Contact", icon: ShieldCheck, sectionTitle: "Verify & Contact", sectionSub: "Your private contact information" },
];

// Maps a free-text campus-zone beacon label to a canonical LOCATIONS value, so a
// beacon link can prefill the "last seen" location select.
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

export default function ReportLost() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1=form, 2=matching screen, 3=results
  const [matches, setMatches] = useState([]); // suggested found-item matches after submit
  const initialParams = new URLSearchParams(location.search); // for beacon prefill
  // The controlled report form (beacon event/zone ids seeded from URL params).
  const [form, setForm] = useState({
    item_type: "",
    category: "",
    description: "",
    color: "",
    brand: "",
    last_seen_location: "",
    date_lost: "",
    photo_urls: [],
    contact_name: "",
    contact_email: "",
    student_id: "",
    urgency: "medium",
    extra_notes: "",
    event_hub_id: initialParams.get("event") || initialParams.get("event_hub_id") || "",
    campus_zone_id: initialParams.get("zone") || initialParams.get("campus_zone_id") || "",
    confirm_accuracy: false,
  });
  const [errors, setErrors] = useState({}); // validation errors (step gates + submit)
  const [formStep, setFormStep] = useState(1); // current wizard step (1-3)
  const [showDraftBanner, setShowDraftBanner] = useState(false); // restore-draft prompt
  const DRAFT_KEY = "ltf_report_lost_draft"; // localStorage key for the autosaved draft

  // Validate the current step's required fields before advancing the wizard.
  const handleNextStep = () => {
    const errs = {};
    if (formStep === 1) {
      if (!form.item_type.trim()) errs.item_type = t("report_lost.item_type_required");
      if (!form.category) errs.category = t("report_lost.category_required", "Please select a category.");
    } else if (formStep === 2) {
      if (!form.date_lost) errs.date_lost = t("report_lost.date_lost_required");
    }
    
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setFormStep((prev) => prev + 1);
    } else {
      toast({
        title: t("report_lost.missing_fields"),
        description: t("report_lost.missing_fields_message"),
        variant: "destructive",
      });
    }
  };

  // Step back one wizard step (never below 1).
  const handlePrevStep = () => {
    setFormStep((prev) => Math.max(1, prev - 1));
  };

  // Recent found items — used to resolve/label the match results on screen 3.
  const { data: foundItems = [] } = useQuery({
    queryKey: ["foundItemsForMatching"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 100),
  });

  // Campus zones — only fetched when arriving via a zone beacon, to resolve its label.
  const { data: campusZones = [] } = useQuery({
    queryKey: ["campusZones"],
    queryFn: () => appClient.campusZones.list(),
    enabled: Boolean(form.campus_zone_id),
  });

  // Prefill last-seen location from the beacon's campus zone (if not already set).
  useEffect(() => {
    if (!form.campus_zone_id || form.last_seen_location) {
      return;
    }
    const zone = campusZones.find((entry) => entry.id === form.campus_zone_id);
    const nextLocation = locationFromZoneLabel(zone?.label || "");
    if (nextLocation) {
      setForm((current) => ({ ...current, last_seen_location: nextLocation }));
    }
  }, [campusZones, form.campus_zone_id, form.last_seen_location]);

  // Auto-populate contact fields from the logged-in user so the report
  // is always associated with their account in the dashboard.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      contact_email: prev.contact_email || user.email || "",
      contact_name:  prev.contact_name  || user.full_name || "",
    }));
  }, [user]);

  // Warn before navigating away if the report has meaningful unsaved content.
  useEffect(() => {
    const hasDraft = form.urgency !== "medium" || form.description.trim() !== "";
    const h = (e) => {
      if (hasDraft) e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [form.urgency, form.description]);

  // Surface a restore-draft banner on mount if a prior draft exists.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.item_type?.trim() || draft?.description?.trim()) {
          setShowDraftBanner(true);
        }
      }
    } catch {
      // Ignore corrupt draft
    }
  }, []);

  // Auto-save the draft as the report is filled in.
  useEffect(() => {
    if (!form.item_type.trim() && !form.description.trim()) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // Ignore storage failures
    }
  }, [form]);

  // Generic controlled-field setter; clears any existing error for that field.
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Full-form validation run on final submit (all required fields + email format).
  const validate = () => {
    const nextErrors = {};
    if (!form.item_type.trim()) nextErrors.item_type = t("report_lost.item_type_required");
    if (!form.description.trim()) nextErrors.description = t("report_lost.description_required");
    if (!form.date_lost) nextErrors.date_lost = t("report_lost.date_lost_required");
    if (!form.contact_name.trim()) nextErrors.contact_name = t("report_lost.contact_name_required");
    if (!form.contact_email.trim()) nextErrors.contact_email = t("report_lost.contact_email_required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim())) {
      nextErrors.contact_email = t("claim_item.email_invalid", "Enter a valid email address.");
    }
    if (!form.confirm_accuracy) nextErrors.confirm_accuracy = t("report_lost.confirm_required");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Primary submit: create the LostReport (status "open"), then ask the backend
  // for candidate found-item matches to display on the results screen.
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const report = await appClient.entities.LostReport.create({
        ...data,
        title: data.item_type, // mirror item_type into the title field
        status: "open",
      });

      const matches = await appClient.matches.forLostReport(report.id);
      return { report, matches };
    },
    // Refresh dependent lists, drop the draft, store matches, show results (step 3).
    onSuccess: ({ matches: backendMatches }) => {
      queryClient.invalidateQueries({ queryKey: ["searchRecords"] });
      queryClient.invalidateQueries({ queryKey: ["homePreviewItems"] });
      queryClient.invalidateQueries({ queryKey: ["userLostReports"] });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setShowDraftBanner(false);
      setMatches(backendMatches);
      setStep(3);
    },
    // On failure, toast and return the user to the form.
    onError: () => {
      toast({ title: t("report_lost.error"), description: t("report_lost.submit_failed"), variant: "destructive" });
      setStep(1);
    },
  });

  // Final submit: guard against double-submit, validate, then fire the mutation.
  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitMutation.isPending || submitMutation.isSuccess) return;
    if (!validate()) {
      toast({ title: t("report_lost.missing_fields"), description: t("report_lost.missing_fields_message"), variant: "destructive" });
      return;
    }
    submitMutation.mutate(form);
  };

  // ── Screen 2: transient "analysing / matching" loading state ──
  if (step === 2) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted animate-pulse">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-foreground">{t("report_lost.matching_title")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("report_lost.matching_description", { count: foundItems.length })}
          </p>
          <div className="mx-auto max-w-xs">
            <Progress value={66} className="h-2.5" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("report_lost.matching_hint")}</p>
        </div>
      </div>
    );
  }

  // ── Screen 3: results — list potential found-item matches (or empty state) ──
  if (step === 3) {
    return (
      <div className="page-shell max-w-4xl py-10">
        {/* Submitted confirmation header */}
        <div className="page-header text-center">
          <span className="page-kicker">{t("report_lost.submitted_kicker")}</span>
          <h2 className="page-title">{t("report_lost.submitted_title")}</h2>
          <p className="page-subtitle mx-auto">
            {t("report_lost.submitted_subtitle")}
          </p>
        </div>

        {/* If matches exist, render each as a card; otherwise show the no-match panel */}
        {matches.length > 0 ? (
          <div className="mb-8 space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                {t("report_lost.potential_matches", { count: matches.filter((match) => foundItems.some((foundItem) => foundItem.id === match.found_item_id)).length })}
              </h3>
            </div>
            {matches.map((match, index) => {
              // Resolve the match to its found-item record; skip if not in the list.
              const item = foundItems.find((foundItem) => foundItem.id === match.found_item_id);
              if (!item) return null;

              return (
                <Card key={index}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {item.photo_urls?.[0] ? (
                        <img src={item.photo_urls[0]} alt={item.title} className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="truncate font-semibold text-foreground">{item.title}</h4>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            {t("report_lost.match_badge", { count: match.confidence })}
                          </Badge>
                        </div>
                        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{item.ai_description || item.description}</p>
                        {/* Why this matched: list of reason badges from the matcher */}
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
                          <Eye className="w-3.5 h-3.5" /> {t("common.view")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // Empty state: no candidate matches were found
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <p className="mb-2 text-muted-foreground">{t("report_lost.no_matches_title")}</p>
              <p className="text-sm text-muted-foreground">
                {t("report_lost.no_matches_description")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results-screen actions: browse found items or go to the dashboard */}
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("/Search")} className="gap-2">
            <Eye className="w-4 h-4" /> {t("report_lost.browse_found_items")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/UserDashboard")}>
            {t("report_lost.go_to_dashboard")}
          </Button>
        </div>
      </div>
    );
  }

  // ── Screen 1: the wizard form (animated background, banners, tracker, steps) ──
  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
      {/* Decorative animated floating-items background */}
      <FloatingItemsCanvas />
    <div className="page-shell max-w-4xl py-10" style={{ position: "relative", zIndex: 1 }}>
      {/* Page header: kicker, title, subtitle */}
      <div className="page-header">
        <span className="page-kicker">{t("report_lost.kicker")}</span>
        <h1 className="page-title">{t("report_lost.title")}</h1>
        <p className="page-subtitle">{t("report_lost.subtitle")}</p>
      </div>

      {/* Restore-draft banner: shown when a saved draft was found on mount */}
      {showDraftBanner && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="text-foreground">You have an unsaved report draft from a previous session.</span>
          <div className="ml-4 flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                try {
                  const raw = localStorage.getItem(DRAFT_KEY);
                  if (raw) setForm((prev) => ({ ...prev, ...JSON.parse(raw) }));
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
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="form-shell">
          {/* STEP 1 — Item Identity: type, category, color, brand, reference photos */}
          {formStep === 1 && (
            <section className="space-y-6 animate-in fade-in duration-300 p-6 sm:p-8">

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="item_type">{t("report_lost.item_type")}</Label>
                  <Input id="item_type" placeholder={t("report_lost.item_type_placeholder")} value={form.item_type} onChange={(event) => updateField("item_type", event.target.value)} className={errors.item_type ? "border-red-400" : ""} />
                  {errors.item_type && <p className="mt-1 text-xs text-red-500">{errors.item_type}</p>}
                </div>
                <div>
                  <Label>{t("common.category")}</Label>
                  <Select value={form.category} onValueChange={(value) => updateField("category", value)}>
                    <SelectTrigger className={errors.category ? "border-red-400" : ""}><SelectValue placeholder={t("report_found.select_category")} /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => <SelectItem key={category.value} value={category.value}>{translateCategory(t, category.value)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("common.color")}</Label>
                  <Select value={form.color} onValueChange={(value) => updateField("color", value)}>
                    <SelectTrigger><SelectValue placeholder={t("report_found.select_color")} /></SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => <SelectItem key={color} value={color}>{translateColor(t, color)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lost_brand">{t("common.brand")}</Label>
                  <Input id="lost_brand" placeholder={t("report_lost.brand_placeholder")} value={form.brand} onChange={(event) => updateField("brand", event.target.value)} />
                </div>
              </div>

              <PhotoUploader photos={form.photo_urls} onChange={(urls) => updateField("photo_urls", urls)} maxPhotos={5} label={t("report_lost.reference_photo", "Reference Photos")} />

              <div className="flex justify-end pt-4">
                <Button type="button" size="lg" onClick={handleNextStep} className="px-8">
                  {t("common.next", "Next")} →
                </Button>
              </div>
            </section>
          )}

          {/* STEP 2 — Time & Place: date lost, last-seen location, urgency, notes */}
          {formStep === 2 && (
            <section className="space-y-6 animate-in fade-in duration-300 p-6 sm:p-8">

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t("report_lost.date_lost")}</Label>
                  <Input type="date" value={form.date_lost} onChange={(event) => updateField("date_lost", event.target.value)} className={errors.date_lost ? "border-red-400" : ""} />
                  {errors.date_lost && <p className="mt-1 text-xs text-red-500">{errors.date_lost}</p>}
                </div>
                <div>
                  <Label>{t("report_lost.last_seen_location")}</Label>
                  <Select value={form.last_seen_location} onValueChange={(value) => updateField("last_seen_location", value)}>
                    <SelectTrigger><SelectValue placeholder={t("report_found.select_location")} /></SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => <SelectItem key={location} value={location}>{translateLocation(t, location)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{t("report_lost.urgency_level")}</Label>
                <Select value={form.urgency} onValueChange={(value) => updateField("urgency", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {URGENCY_LEVELS.map((urgency) => <SelectItem key={urgency.value} value={urgency.value}>{translateUrgency(t, urgency.value)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="extra_notes">{t("report_lost.additional_notes")}</Label>
                <Textarea id="extra_notes" placeholder={t("report_lost.additional_notes_placeholder")} rows={3} value={form.extra_notes} onChange={(event) => updateField("extra_notes", event.target.value)} />
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

          {/* STEP 3 — Verify & Contact: description, private contact, student id, consent */}
          {formStep === 3 && (
            <section className="space-y-6 animate-in fade-in duration-300 p-6 sm:p-8">

              <div>
                <Label htmlFor="lost_desc">{t("report_lost.description_label")}</Label>
                <Textarea id="lost_desc" placeholder={t("report_lost.description_placeholder")} rows={4} value={form.description} onChange={(event) => updateField("description", event.target.value)} className={errors.description ? "border-red-400" : ""} />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              {/* Private contact fields (name + email) — not shown publicly */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact_name">
                    {t("report_lost.full_name")}
                    <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <LockKeyhole className="h-3 w-3" aria-hidden="true" />Private
                    </span>
                  </Label>
                  <Input id="contact_name" value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} className={errors.contact_name ? "border-red-400" : ""} />
                  {errors.contact_name && <p className="mt-1 text-xs text-red-500">{errors.contact_name}</p>}
                </div>
                <div>
                  <Label htmlFor="contact_email">
                    {t("common.email")} *
                    <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                      <LockKeyhole className="h-3 w-3" aria-hidden="true" />Private
                    </span>
                  </Label>
                  <Input id="contact_email" type="email" value={form.contact_email} onChange={(event) => updateField("contact_email", event.target.value)} className={errors.contact_email ? "border-red-400" : ""} />
                  {errors.contact_email && <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="student_id">{t("report_lost.student_id")}</Label>
                <Input id="student_id" placeholder={t("report_lost.student_id_placeholder")} value={form.student_id} onChange={(event) => updateField("student_id", event.target.value)} />
              </div>

              {/* Required: confirm the reported details are accurate */}
              <ConsentCheckboxField
                id="confirm_accuracy"
                checked={form.confirm_accuracy}
                onCheckedChange={(value) => updateField("confirm_accuracy", value)}
                error={errors.confirm_accuracy}
                tone="amber">
                {t("report_lost.confirm_text")}
              </ConsentCheckboxField>

              {/* Back + final Submit (disabled while the create+match request runs) */}
              <div className="flex justify-between pt-4 gap-3">
                <Button type="button" variant="outline" size="lg" onClick={handlePrevStep}>
                  ← {t("common.back")}
                </Button>
                <Button type="submit" size="lg" disabled={submitMutation.isPending} className="flex-1 gap-2">
                  {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                  {submitMutation.isPending ? t("report_lost.submitting") : t("report_lost.submit_button")}
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
