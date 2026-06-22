/**
 * FindBack AI - Report Lost Item Page
 * Students report lost belongings and receive suggested matches.
 */

import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
import { findMatches } from "@/lib/ai-services";
import { translateCategory, translateColor, translateLocation, translateUrgency } from "@/lib/i18n-helpers";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [matches, setMatches] = useState([]);
  const initialParams = new URLSearchParams(location.search);
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
    event_hub_id: initialParams.get("event") || initialParams.get("event_hub_id") || "",
    campus_zone_id: initialParams.get("zone") || initialParams.get("campus_zone_id") || "",
    confirm_accuracy: false,
  });
  const [errors, setErrors] = useState({});
  const [formStep, setFormStep] = useState(1);

  const handleNextStep = () => {
    const errs = {};
    if (formStep === 1) {
      if (!form.item_type.trim()) errs.item_type = t("report_lost.item_type_required");
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

  const handlePrevStep = () => {
    setFormStep((prev) => Math.max(1, prev - 1));
  };

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
    if (!form.item_type.trim()) nextErrors.item_type = t("report_lost.item_type_required");
    if (!form.description.trim()) nextErrors.description = t("report_lost.description_required");
    if (!form.date_lost) nextErrors.date_lost = t("report_lost.date_lost_required");
    if (!form.contact_name.trim()) nextErrors.contact_name = t("report_lost.contact_name_required");
    if (!form.contact_email.trim()) nextErrors.contact_email = t("report_lost.contact_email_required");
    if (!form.confirm_accuracy) nextErrors.confirm_accuracy = t("report_lost.confirm_required");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const report = await appClient.entities.LostReport.create({
        ...data,
        status: "open",
      });
      await appClient.recoveryMesh.refreshRecoveryCase(report.id);

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
      toast({ title: t("report_lost.error"), description: t("report_lost.submit_failed"), variant: "destructive" });
      setStep(1);
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      toast({ title: t("report_lost.missing_fields"), description: t("report_lost.missing_fields_message"), variant: "destructive" });
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
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">{t("report_lost.matching_title")}</h2>
          <p className="mb-6 text-slate-600">
            {t("report_lost.matching_description", { count: foundItems.length })}
          </p>
          <div className="mx-auto max-w-xs">
            <Progress value={66} className="h-2.5" />
          </div>
          <p className="mt-3 text-xs text-slate-400">{t("report_lost.matching_hint")}</p>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="page-shell max-w-4xl py-10">
        <div className="page-header text-center">
          <span className="page-kicker">{t("report_lost.submitted_kicker")}</span>
          <h2 className="page-title">{t("report_lost.submitted_title")}</h2>
          <p className="page-subtitle mx-auto">
            {t("report_lost.submitted_subtitle")}
          </p>
        </div>

        {matches.length > 0 ? (
          <div className="mb-8 space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-slate-900">
                {t("report_lost.potential_matches", { count: matches.length })}
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
                        <img src={item.photo_urls[0]} alt={item.title} className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="truncate font-semibold text-slate-900">{item.title}</h4>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            {t("report_lost.match_badge", { count: match.confidence })}
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
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <p className="mb-2 text-slate-600">{t("report_lost.no_matches_title")}</p>
              <p className="text-sm text-slate-400">
                {t("report_lost.no_matches_description")}
              </p>
            </CardContent>
          </Card>
        )}

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

  return (
    <div className="page-shell max-w-4xl py-10">
      <div className="page-header">
        <span className="page-kicker">{t("report_lost.kicker")}</span>
        <h1 className="page-title">{t("report_lost.title")}</h1>
        <p className="page-subtitle">{t("report_lost.subtitle")}</p>
      </div>

      {(form.event_hub_id || form.campus_zone_id) && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          You are reporting from a demo event beacon. This does not use GPS; correct the location if needed.
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="form-shell">
          {formStep === 1 && (
            <section className="space-y-6 animate-in fade-in duration-300 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  {t("report_lost.details")}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="item_type">{t("report_lost.item_type")}</Label>
                  <Input id="item_type" placeholder={t("report_lost.item_type_placeholder")} value={form.item_type} onChange={(event) => updateField("item_type", event.target.value)} className={errors.item_type ? "border-red-400" : ""} />
                  {errors.item_type && <p className="mt-1 text-xs text-red-500">{errors.item_type}</p>}
                </div>
                <div>
                  <Label>{t("common.category")}</Label>
                  <Select value={form.category} onValueChange={(value) => updateField("category", value)}>
                    <SelectTrigger><SelectValue placeholder={t("report_found.select_category")} /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => <SelectItem key={category.value} value={category.value}>{translateCategory(t, category.value)}</SelectItem>)}
                    </SelectContent>
                  </Select>
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

              <PhotoUploader photos={form.photo_url ? [form.photo_url] : []} onChange={(urls) => updateField("photo_url", urls[0] || "")} maxPhotos={1} label={t("report_lost.reference_photo")} />

              <div className="flex justify-end pt-4">
                <Button type="button" size="lg" onClick={handleNextStep} className="px-8">
                  {t("common.next", "Next")} →
                </Button>
              </div>
            </section>
          )}

          {formStep === 2 && (
            <section className="space-y-6 animate-in fade-in duration-300 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  {t("report_lost.details")}
                </h2>
              </div>

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

          {formStep === 3 && (
            <section className="space-y-6 animate-in fade-in duration-300 p-6 sm:p-8">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  {t("report_lost.contact_information")}
                </h2>
              </div>

              <div>
                <Label htmlFor="lost_desc">{t("report_lost.description_label")}</Label>
                <Textarea id="lost_desc" placeholder={t("report_lost.description_placeholder")} rows={4} value={form.description} onChange={(event) => updateField("description", event.target.value)} className={errors.description ? "border-red-400" : ""} />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact_name">{t("report_lost.full_name")}</Label>
                  <Input id="contact_name" value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} className={errors.contact_name ? "border-red-400" : ""} />
                  {errors.contact_name && <p className="mt-1 text-xs text-red-500">{errors.contact_name}</p>}
                </div>
                <div>
                  <Label htmlFor="contact_email">{t("common.email")} *</Label>
                  <Input id="contact_email" type="email" value={form.contact_email} onChange={(event) => updateField("contact_email", event.target.value)} className={errors.contact_email ? "border-red-400" : ""} />
                  {errors.contact_email && <p className="mt-1 text-xs text-red-500">{errors.contact_email}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="student_id">{t("report_lost.student_id")}</Label>
                <Input id="student_id" placeholder={t("report_lost.student_id_placeholder")} value={form.student_id} onChange={(event) => updateField("student_id", event.target.value)} />
              </div>

              <ConsentCheckboxField
                id="confirm_accuracy"
                checked={form.confirm_accuracy}
                onCheckedChange={(value) => updateField("confirm_accuracy", value)}
                error={errors.confirm_accuracy}
                tone="amber">
                {t("report_lost.confirm_text")}
              </ConsentCheckboxField>

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
  );
}
