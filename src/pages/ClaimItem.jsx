/**
 * FindBack AI - Claim Item Page
 * Secure claim form with verification fields, proof upload,
 * and AI risk scoring on submission.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { scoreClaimRisk } from "@/lib/ai-services";
import PhotoUploader from "@/components/shared/PhotoUploader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loader2, Shield, ArrowLeft, Package, FileCheck
} from "lucide-react";

export default function ClaimItem() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get("id");

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    claimant_name: "", claimant_email: "", student_id: "",
    reason: "", identifying_details: "", proof_photo_url: "",
    pickup_availability: "", truthful: false,
  });
  const [errors, setErrors] = useState({});

  // Fetch the item being claimed
  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ["claimItem", itemId],
    queryFn: () => appClient.entities.FoundItem.filter({ id: itemId }),
    enabled: !!itemId,
    select: (data) => data?.[0],
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
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
      // Run AI risk scoring
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

      // Update item status
      await appClient.entities.FoundItem.update(item.id, { status: "claimed" });

      return claim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      setSubmitted(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit claim.", variant: "destructive" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <FileCheck className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Claim Submitted!</h1>
        <p className="text-slate-500 mb-2">
          Your claim has been received and is now under review by our admin team.
        </p>
        <p className="text-sm text-slate-400 mb-8">
          You'll receive an update once your claim has been processed.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate("/UserDashboard")}>View My Claims</Button>
          <Button variant="outline" onClick={() => navigate("/Search")}>Back to Search</Button>
        </div>
      </div>
    );
  }

  if (itemLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Item Not Found</h2>
        <Button onClick={() => navigate("/Search")}>Back to Search</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Button variant="ghost" size="sm" className="mb-4 gap-1 text-slate-500" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit a Claim</h1>
      <p className="text-slate-500 mb-6">Verify that this item belongs to you.</p>

      {/* Item Preview */}
      <Card className="mb-6 bg-slate-50 border-slate-200">
        <CardContent className="p-4 flex items-center gap-4">
          {item.photo_urls?.[0] ? (
            <img src={item.photo_urls[0]} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-slate-900">{item.title}</h3>
            <p className="text-sm text-slate-500">{item.location_found} • {item.date_found}</p>
          </div>
          <StatusBadge status={item.status} className="ml-auto" />
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c_name">Full Name *</Label>
                <Input id="c_name" value={form.claimant_name} onChange={(e) => updateField("claimant_name", e.target.value)} className={errors.claimant_name ? "border-red-400" : ""} />
                {errors.claimant_name && <p className="text-xs text-red-500 mt-1">{errors.claimant_name}</p>}
              </div>
              <div>
                <Label htmlFor="c_email">Email *</Label>
                <Input id="c_email" type="email" value={form.claimant_email} onChange={(e) => updateField("claimant_email", e.target.value)} className={errors.claimant_email ? "border-red-400" : ""} />
                {errors.claimant_email && <p className="text-xs text-red-500 mt-1">{errors.claimant_email}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="c_sid">Student ID</Label>
              <Input id="c_sid" placeholder="Helps verify your identity" value={form.student_id} onChange={(e) => updateField("student_id", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ownership Verification</CardTitle>
            <CardDescription>Provide details that only the true owner would know.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="c_reason">Why do you believe this is yours? *</Label>
              <Textarea id="c_reason" rows={3} placeholder="Describe when and where you lost it, what it looks like..." value={form.reason} onChange={(e) => updateField("reason", e.target.value)} className={errors.reason ? "border-red-400" : ""} />
              {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
            </div>
            <div>
              <Label htmlFor="c_details">Identifying Details Only You Would Know</Label>
              <Textarea id="c_details" rows={3} placeholder="Scratches, stickers, contents, lock combo, wallpaper, etc." value={form.identifying_details} onChange={(e) => updateField("identifying_details", e.target.value)} />
            </div>
            <PhotoUploader photos={form.proof_photo_url ? [form.proof_photo_url] : []} onChange={(urls) => updateField("proof_photo_url", urls[0] || "")} maxPhotos={1} label="Proof Photo (optional)" />
            <div>
              <Label htmlFor="c_pickup">Pickup Availability</Label>
              <Input id="c_pickup" placeholder="e.g. After school Mon-Wed, lunch period" value={form.pickup_availability} onChange={(e) => updateField("pickup_availability", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Truthful Confirmation */}
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <Checkbox id="truthful" checked={form.truthful} onCheckedChange={(v) => updateField("truthful", v)} />
          <label htmlFor="truthful" className="text-sm text-amber-800 leading-snug cursor-pointer">
            I confirm that all information provided is truthful and accurate. I understand that submitting false claims may result in disciplinary action. *
          </label>
        </div>
        {errors.truthful && <p className="text-xs text-red-500">{errors.truthful}</p>}

        <Button type="submit" size="lg" disabled={submitMutation.isPending} className="w-full bg-[hsl(213,56%,24%)] hover:bg-[hsl(213,56%,20%)] text-white gap-2 shadow-md">
          {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
          {submitMutation.isPending ? "Verifying & Submitting..." : "Submit Claim"}
        </Button>
      </form>
    </div>
  );
}