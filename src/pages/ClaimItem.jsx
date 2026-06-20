/**
 * FindBack AI - Claim Item Page
 * Secure claim form with verification fields, proof upload,
 * and AI risk scoring on submission.
 */

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SlideButton } from "@/components/ui/slide-button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { scoreClaimRisk } from "@/lib/ai-services";
import { ConsentCheckboxField } from "@/components/shared/ConsentCheckboxField";
import PhotoUploader from "@/components/shared/PhotoUploader";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { formatLocalizedDate, translateCategory, translateLocation } from "@/lib/i18n-helpers";
import {
  Loader2,
  ArrowLeft,
  Package,
  FileCheck,
  Search,
  Clock3,
  CheckCircle2,
} from "lucide-react";

const createInitialForm = (user) => ({
  claimant_name: user?.full_name || "",
  claimant_email: user?.email || "",
  student_id: "",
  reason: "",
  identifying_details: "",
  proof_photo_url: "",
  pickup_availability: "",
  truthful: false,
});

export default function ClaimItem() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const urlParams = new URLSearchParams(location.search);
  const itemId = urlParams.get("id");

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(() => createInitialForm(user));
  const [errors, setErrors] = useState({});

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ["claimItem", itemId],
    queryFn: () => appClient.entities.FoundItem.filter({ id: itemId }),
    enabled: !!itemId,
    select: (data) => data?.[0],
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      claimant_name: prev.claimant_name || user.full_name || "",
      claimant_email: prev.claimant_email || user.email || "",
    }));
  }, [user]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.claimant_name.trim()) errs.claimant_name = t("claim_item.name_required");
    if (!form.claimant_email.trim()) errs.claimant_email = t("claim_item.email_required");
    if (!form.reason.trim()) errs.reason = t("claim_item.reason_required");
    if (!form.truthful) errs.truthful = t("claim_item.truthful_required");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const riskResult = await scoreClaimRisk(form, item);

      const claim = await appClient.entities.Claim.create({
        found_item_id: item.id,
        found_item_title: item.title,
        claimant_name: form.claimant_name,
        claimant_email: form.claimant_email,
        student_id: form.student_id,
        reason: form.reason,
        identifying_details: form.identifying_details,
        proof_photo_url: form.proof_photo_url,
        pickup_availability: form.pickup_availability,
        status: "submitted",
        risk_score: riskResult.risk_score,
        risk_flags: riskResult.risk_flags || [],
      });

      await appClient.entities.FoundItem.update(item.id, { status: "claimed" });

      return claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSubmitted(true);
    },
    onError: () => {
      toast({ title: t("claim_item.error"), description: t("claim_item.submit_failed"), variant: "destructive" });
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <FileCheck className="h-8 w-8 text-emerald-700" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">{t("claim_item.submitted_title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            {t("claim_item.submitted_description")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/UserDashboard")}>{t("claim_item.view_my_claims")}</Button>
            <Button variant="outline" onClick={() => navigate("/Search")}>{t("claim_item.back_to_search")}</Button>
          </div>
        </div>
      </div>
    );
  }

  if (itemLoading) {
    return (
      <div className="page-shell py-20">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-950">{t("claim_item.item_not_found")}</h2>
          <p className="mt-2 text-sm text-slate-500">{t("claim_item.item_not_found_description")}</p>
          <Button className="mt-6" onClick={() => navigate("/Search")}>{t("claim_item.back_to_search")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-6xl py-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-5 gap-1 text-slate-500"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>

      <div className="page-header mb-8">
        <span className="page-kicker">{t("claim_item.kicker")}</span>
        <h1 className="page-title">{t("claim_item.title")}</h1>
        <p className="page-subtitle">{t("claim_item.subtitle")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr] items-start">
        {/* Left Side: Sticky Details Card & Review Info */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="surface-card overflow-hidden">
            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
              {item.photo_urls?.[0] ? (
                <img
                  src={item.photo_urls[0]}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-50">
                  <Package className="h-10 w-10 text-slate-300" />
                </div>
              )}
              <div className="absolute left-3 top-3">
                <StatusBadge status={item.status} />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <Badge variant="outline" className="text-xs mb-1.5">{translateCategory(t, item.category)}</Badge>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{item.title}</h2>
                <p className="mt-1.5 text-xs text-slate-500">
                  {translateLocation(t, item.location_found) || t("common.unknown_location")} • {item.date_found ? formatLocalizedDate(item.date_found, "MMM d, yyyy") : t("common.date_unavailable")}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-1">
                  {t("common.description")}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {item.ai_description || item.description}
                </p>
              </div>
            </div>
          </div>

          <div className="soft-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("claim_item.review_flow")}</p>
            <div className="mt-4 space-y-3.5 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <Search className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <span>{t("claim_item.review_compare")}</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <span>{t("claim_item.review_pickup")}</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                <span>{t("claim_item.review_close")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: The Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-shell">
            <section className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-950">{t("claim_item.your_information")}</h2>
                <p className="text-sm text-slate-600">
                  {t("claim_item.your_information_description")}
                </p>
              </div>

              {user && (
                <div className="soft-panel flex flex-wrap items-center gap-2 px-4 py-3 text-sm text-slate-700">
                  <Badge variant="secondary" className="bg-slate-200 text-slate-700">{t("claim_item.signed_in")}</Badge>
                  {t("claim_item.submitting_as", { name: user.full_name, email: user.email })}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="c_name">{t("claim_item.full_name")}</Label>
                  <Input
                    id="c_name"
                    value={form.claimant_name}
                    onChange={(event) => updateField("claimant_name", event.target.value)}
                    className={errors.claimant_name ? "border-red-400" : ""}
                  />
                  {errors.claimant_name && <p className="mt-1 text-xs text-red-500">{errors.claimant_name}</p>}
                </div>
                <div>
                  <Label htmlFor="c_email">{t("common.email")} *</Label>
                  <Input
                    id="c_email"
                    type="email"
                    value={form.claimant_email}
                    onChange={(event) => updateField("claimant_email", event.target.value)}
                    className={errors.claimant_email ? "border-red-400" : ""}
                  />
                  {errors.claimant_email && <p className="mt-1 text-xs text-red-500">{errors.claimant_email}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="c_sid">{t("claim_item.student_id")}</Label>
                <Input
                  id="c_sid"
                  placeholder={t("claim_item.student_id_placeholder")}
                  value={form.student_id}
                  onChange={(event) => updateField("student_id", event.target.value)}
                />
              </div>
            </section>

            <section className="space-y-5">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-950">{t("claim_item.ownership_verification")}</h2>
                <p className="text-sm text-slate-600">
                  {t("claim_item.ownership_description")}
                </p>
              </div>

              <div>
                <Label htmlFor="c_reason">{t("claim_item.reason")}</Label>
                <Textarea
                  id="c_reason"
                  rows={4}
                  placeholder={t("claim_item.reason_placeholder")}
                  value={form.reason}
                  onChange={(event) => updateField("reason", event.target.value)}
                  className={errors.reason ? "border-red-400" : ""}
                />
                {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
              </div>

              <div>
                <Label htmlFor="c_details">{t("claim_item.identifying_details")}</Label>
                <Textarea
                  id="c_details"
                  rows={4}
                  placeholder={t("claim_item.identifying_placeholder")}
                  value={form.identifying_details}
                  onChange={(event) => updateField("identifying_details", event.target.value)}
                />
              </div>

              <PhotoUploader
                photos={form.proof_photo_url ? [form.proof_photo_url] : []}
                onChange={(urls) => updateField("proof_photo_url", urls[0] || "")}
                maxPhotos={1}
                label={t("claim_item.supporting_photo")}
              />

              <div>
                <Label htmlFor="c_pickup">{t("claim_item.pickup_availability")}</Label>
                <Input
                  id="c_pickup"
                  placeholder={t("claim_item.pickup_placeholder")}
                  value={form.pickup_availability}
                  onChange={(event) => updateField("pickup_availability", event.target.value)}
                />
              </div>
            </section>

            <section className="space-y-5">
              <ConsentCheckboxField
                id="truthful"
                checked={form.truthful}
                onCheckedChange={(value) => updateField("truthful", value)}
                error={errors.truthful}
                tone="amber">
                {t("claim_item.truthful_text")}
              </ConsentCheckboxField>
              <div className="flex justify-center pt-2">
                <SlideButton
                  status={
                    submitMutation.isPending
                      ? "loading"
                      : submitMutation.isSuccess
                        ? "success"
                        : submitMutation.isError
                          ? "error"
                          : "idle"
                  }
                  onDragComplete={() => handleSubmit()}
                  className="bg-primary text-white hover:bg-primary/90"
                />
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}
