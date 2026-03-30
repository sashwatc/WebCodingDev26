/**
 * FindBack AI - Claim Item Page
 * Secure claim form with verification fields, proof upload,
 * and AI risk scoring on submission.
 */

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import {
  Loader2,
  Shield,
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
    if (!form.claimant_name.trim()) errs.claimant_name = "Name is required";
    if (!form.claimant_email.trim()) errs.claimant_email = "Email is required";
    if (!form.reason.trim()) errs.reason = "Please explain why this is yours";
    if (!form.truthful) errs.truthful = "You must confirm this is truthful";
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
      toast({ title: "Error", description: "Failed to submit claim.", variant: "destructive" });
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
          <h1 className="text-2xl font-semibold text-slate-950">Claim submitted for review.</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Your ownership details are now in the review queue. The admin team can verify the claim and the return will stay open until you confirm the item was received.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate("/UserDashboard")}>View My Claims</Button>
            <Button variant="outline" onClick={() => navigate("/Search")}>Back to Search</Button>
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
          <h2 className="text-xl font-semibold text-slate-950">Item not found</h2>
          <p className="mt-2 text-sm text-slate-500">This listing is no longer available or the link is invalid.</p>
          <Button className="mt-6" onClick={() => navigate("/Search")}>Back to Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-4xl py-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-5 gap-1 text-slate-500"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="page-header">
        <span className="page-kicker">Claim Item</span>
        <h1 className="page-title">Verify that this item belongs to you.</h1>
        <p className="page-subtitle">
          Share details that only the owner would know. Claims are reviewed before the return is marked complete.
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="surface-card p-5">
          <div className="flex items-start gap-4">
            {item.photo_urls?.[0] ? (
              <img
                src={item.photo_urls[0]}
                alt={item.title}
                className="h-20 w-20 rounded-[18px] object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-[18px] bg-slate-100">
                <Package className="h-7 w-7 text-slate-400" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950">{item.title}</h2>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {item.location_found || "Location unknown"} • {item.date_found || "Date unavailable"}
              </p>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                {item.ai_description || item.description}
              </p>
            </div>
          </div>
        </div>

        <div className="soft-panel p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Review flow</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <Search className="mt-0.5 h-4 w-4 text-primary" />
              <span>Admins compare your details against the item record.</span>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
              <span>Pickup timing can be coordinated after approval.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <span>The claim closes only after you confirm receipt.</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-shell">
          <section>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-950">Your information</h2>
              <p className="text-sm text-slate-600">
                These details let staff reach you and confirm identity during pickup.
              </p>
            </div>

            {user && (
              <div className="soft-panel flex flex-wrap items-center gap-2 px-4 py-3 text-sm text-slate-700">
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">Signed in</Badge>
                Submitting as {user.full_name} ({user.email})
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="c_name">Full Name *</Label>
                <Input
                  id="c_name"
                  value={form.claimant_name}
                  onChange={(event) => updateField("claimant_name", event.target.value)}
                  className={errors.claimant_name ? "border-red-400" : ""}
                />
                {errors.claimant_name && <p className="mt-1 text-xs text-red-500">{errors.claimant_name}</p>}
              </div>
              <div>
                <Label htmlFor="c_email">Email *</Label>
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
              <Label htmlFor="c_sid">Student ID</Label>
              <Input
                id="c_sid"
                placeholder="Optional, but useful for verification"
                value={form.student_id}
                onChange={(event) => updateField("student_id", event.target.value)}
              />
            </div>
          </section>

          <section>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-950">Ownership verification</h2>
              <p className="text-sm text-slate-600">
                Provide details that would not normally appear in the public listing.
              </p>
            </div>

            <div>
              <Label htmlFor="c_reason">Why do you believe this is yours? *</Label>
              <Textarea
                id="c_reason"
                rows={4}
                placeholder="Describe when you lost it, where you last saw it, and what makes you confident it is yours."
                value={form.reason}
                onChange={(event) => updateField("reason", event.target.value)}
                className={errors.reason ? "border-red-400" : ""}
              />
              {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
            </div>

            <div>
              <Label htmlFor="c_details">Identifying details only you would know</Label>
              <Textarea
                id="c_details"
                rows={4}
                placeholder="Scratches, stickers, lock code format, wallpaper, contents, or anything not obvious from the outside."
                value={form.identifying_details}
                onChange={(event) => updateField("identifying_details", event.target.value)}
              />
            </div>

            <PhotoUploader
              photos={form.proof_photo_url ? [form.proof_photo_url] : []}
              onChange={(urls) => updateField("proof_photo_url", urls[0] || "")}
              maxPhotos={1}
              label="Supporting photo (optional)"
            />

            <div>
              <Label htmlFor="c_pickup">Pickup availability</Label>
              <Input
                id="c_pickup"
                placeholder="Example: lunch period, after school Monday-Wednesday"
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
              I confirm that the information provided is truthful and accurate. I understand that false claims may
              lead to disciplinary action. *
            </ConsentCheckboxField>

            <Button type="submit" size="lg" disabled={submitMutation.isPending} className="w-full gap-2">
              {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
              {submitMutation.isPending ? "Verifying and submitting..." : "Submit Claim"}
            </Button>
          </section>
        </div>
      </form>
    </div>
  );
}
