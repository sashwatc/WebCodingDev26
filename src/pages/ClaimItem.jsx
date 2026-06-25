import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import PhotoUploader from "@/components/shared/PhotoUploader";
import { ArrowLeft, FileCheck, Loader2, Package, Shield } from "lucide-react";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  claimant_name:        z.string().min(1, "Full name is required"),
  claimant_email:       z.string().email("Enter a valid email address"),
  student_id:           z.string().default(""),
  pickup_availability:  z.string().default(""),
  reason:               z.string().min(10, "Please explain why you believe this is yours (at least 10 characters)"),
  identifying_details:  z.string().min(10, "Please describe a unique feature (at least 10 characters)"),
  proof_photo_url:      z.string().default(""),
});

const STEP_FIELDS = {
  1: ["claimant_name", "claimant_email"],
  2: ["reason", "identifying_details"],
};

const STEP_LABELS = ["Your Identity", "Ownership Proof", "Review + Submit"];

// ── Sub-components ────────────────────────────────────────────────────────────

function StepBar({ step }) {
  return (
    <div className="mb-8 flex items-center" role="list" aria-label="Form steps">
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1;
        const done   = step > idx;
        const active = step === idx;
        return (
          <React.Fragment key={label}>
            <div className="flex shrink-0 flex-col items-center" role="listitem">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done   ? "bg-emerald-600 text-white" :
                  active ? "bg-primary text-white ring-2 ring-primary/20" :
                           "bg-slate-100 text-slate-400"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : idx}
              </div>
              <span className={`mt-1 text-[11px] font-medium whitespace-nowrap ${
                active ? "text-primary" : done ? "text-emerald-600" : "text-slate-400"
              }`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`mb-4 h-px flex-1 transition-colors ${done ? "bg-emerald-400" : "bg-border"}`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ItemContextCard({ item }) {
  if (!item) return null;
  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.photo_urls?.[0] ? (
          <img src={item.photo_urls[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-muted-foreground">
          Claiming
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
          {item.title || "Untitled item"}
        </p>
      </div>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-x-4 border-b border-border py-3 last:border-none">
      <dt className="pt-0.5 text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClaimItem() {
  useEffect(() => { document.title = "Claim Item — Lost Then Found"; }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const { user }  = useAuth();

  const found_item_id = new URLSearchParams(location.search).get("id");
  const draftKey = `ltf-claim-draft-${found_item_id}`;

  const [step, setStep]             = useState(1);
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [succeeded, setSucceeded]   = useState(false);

  // ── Draft ────────────────────────────────────────────────────────────────

  const initialValues = useMemo(() => {
    try {
      const raw = found_item_id && localStorage.getItem(draftKey);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
      claimant_name:       user?.full_name || "",
      claimant_email:      user?.email     || "",
      student_id:          "",
      pickup_availability: "",
      reason:              "",
      identifying_details: "",
      proof_photo_url:     "",
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Form ─────────────────────────────────────────────────────────────────

  const {
    register,
    trigger,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  // Pre-fill from auth once loaded (handles async auth case)
  useEffect(() => {
    if (!user) return;
    const v = getValues();
    if (!v.claimant_name)  setValue("claimant_name",  user.full_name || "");
    if (!v.claimant_email) setValue("claimant_email", user.email     || "");
  }, [user, getValues, setValue]);

  // Autosave draft
  useEffect(() => {
    const sub = watch((values) => {
      if (!found_item_id) return;
      try { localStorage.setItem(draftKey, JSON.stringify(values)); } catch { /* ignore */ }
    });
    return () => sub.unsubscribe();
  }, [watch, found_item_id, draftKey]);

  // ── Item query ────────────────────────────────────────────────────────────

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ["claimItem", found_item_id],
    queryFn: () => appClient.items.get(found_item_id),
    enabled: !!found_item_id,
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid  = fields ? await trigger(fields) : true;
    if (valid) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const allFields = ["claimant_name", "claimant_email", "reason", "identifying_details"];
    const valid = await trigger(allFields);
    if (!valid) { setStep(1); return; }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const v = getValues();
      await appClient.entities.Claim.create({
        found_item_id,
        claimant_name:       v.claimant_name,
        claimant_email:      v.claimant_email,
        student_id:          v.student_id          || "",
        reason:              v.reason,
        identifying_details: v.identifying_details,
        proof_photo_url:     v.proof_photo_url      || "",
        pickup_availability: v.pickup_availability  || "",
        status:              "submitted",
      });
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setSucceeded(true);
    } catch (err) {
      setSubmitError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const proofPhotos = watch("proof_photo_url")
    ? [watch("proof_photo_url")]
    : [];

  // ── Render: loading ───────────────────────────────────────────────────────

  if (!found_item_id || (!itemLoading && !item)) {
    return (
      <div className="page-shell max-w-lg py-20 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-bold text-foreground">Item not found</h1>
        <p className="mb-6 text-sm text-muted-foreground">This item may have been removed or the link is invalid.</p>
        <Button onClick={() => navigate("/Search")}>Back to search</Button>
      </div>
    );
  }

  if (itemLoading) {
    return (
      <div className="page-shell max-w-2xl py-10">
        <Skeleton className="mb-6 h-8 w-20" />
        <Skeleton className="mb-8 h-20 w-full rounded-xl" />
        <Skeleton className="mb-8 h-16 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // ── Render: success ───────────────────────────────────────────────────────

  if (succeeded) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <FileCheck className="h-8 w-8 text-emerald-700" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Claim submitted</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Staff will review your claim within 1–2 school days and contact you at the email provided.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/UserDashboard">View my claims</Link>
            </Button>
            <Button variant="outline" onClick={() => navigate("/Search")}>
              Back to search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: form ──────────────────────────────────────────────────────────

  return (
    <div className="page-shell max-w-2xl py-10">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-6 gap-1 text-muted-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Button>

      <div className="page-header mb-8">
        <span className="page-kicker">Lost &amp; Found</span>
        <h1 className="page-title">Claim this item</h1>
        <p className="page-subtitle">
          Complete the form to submit a claim. Staff review all submissions within 1–2 school days.
        </p>
      </div>

      {/* Item context */}
      <ItemContextCard item={item} />

      {/* Progress */}
      <StepBar step={step} />

      {/* ── Step 1: Identity ──────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="surface-card space-y-6 p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your Identity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us who you are so staff can contact you if your claim is approved.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cl-name">Full name *</Label>
              <Input
                id="cl-name"
                {...register("claimant_name")}
                className={`mt-1.5 min-h-[44px] ${errors.claimant_name ? "border-destructive" : ""}`}
                placeholder="Your full name"
                aria-required="true"
              />
              <FieldError message={errors.claimant_name?.message} />
            </div>
            <div>
              <Label htmlFor="cl-email">Email address *</Label>
              <Input
                id="cl-email"
                type="email"
                {...register("claimant_email")}
                className={`mt-1.5 min-h-[44px] ${errors.claimant_email ? "border-destructive" : ""}`}
                placeholder="you@example.com"
                aria-required="true"
              />
              <FieldError message={errors.claimant_email?.message} />
            </div>
          </div>

          <div>
            <Label htmlFor="cl-sid">Student ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="cl-sid"
              {...register("student_id")}
              className="mt-1.5 min-h-[44px]"
              placeholder="e.g. 123456"
            />
          </div>

          <div>
            <Label htmlFor="cl-pickup">When can you pick this up?</Label>
            <Input
              id="cl-pickup"
              {...register("pickup_availability")}
              className="mt-1.5 min-h-[44px]"
              placeholder="e.g. Weekdays after 3 PM"
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Ownership Proof ───────────────────────────────────────── */}
      {step === 2 && (
        <div className="surface-card space-y-6 p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ownership Proof</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Help staff verify your ownership with specific details only the true owner would know.
            </p>
          </div>

          {/* Privacy callout */}
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p id="privacy-note" className="text-xs leading-relaxed text-muted-foreground">
              This information is <strong className="font-semibold text-foreground">private and only visible to PVHS Staff</strong>. It is never shared publicly.
            </p>
          </div>

          <div>
            <Label htmlFor="cl-reason">Why do you believe this is yours? *</Label>
            <Textarea
              id="cl-reason"
              {...register("reason")}
              rows={4}
              className={`mt-1.5 min-h-[44px] resize-none ${errors.reason ? "border-destructive" : ""}`}
              placeholder="Describe the circumstances — where you lost it, when, what was in/on it…"
              aria-required="true"
            />
            <FieldError message={errors.reason?.message} />
          </div>

          <div>
            <Label htmlFor="cl-details">Describe a unique feature only the owner would know *</Label>
            <Textarea
              id="cl-details"
              {...register("identifying_details")}
              rows={3}
              className={`mt-1.5 min-h-[44px] resize-none ${errors.identifying_details ? "border-destructive" : ""}`}
              placeholder="e.g. scratch on the back cover, initials written inside, sticker on the lid…"
              aria-required="true"
              aria-describedby="privacy-note"
            />
            <FieldError message={errors.identifying_details?.message} />
          </div>

          <PhotoUploader
            label="Proof photo (optional)"
            photos={proofPhotos}
            maxPhotos={1}
            isPrivate
            onChange={(urls) => setValue("proof_photo_url", urls[0] || "", { shouldDirty: true })}
          />
        </div>
      )}

      {/* ── Step 3: Review ────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="surface-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Review your claim</h2>
            <dl>
              <ReviewRow label="Name"            value={watch("claimant_name")} />
              <ReviewRow label="Email"           value={watch("claimant_email")} />
              <ReviewRow label="Student ID"      value={watch("student_id")} />
              <ReviewRow label="Pickup window"   value={watch("pickup_availability")} />
              <ReviewRow label="Why it's yours"  value={watch("reason")} />
              <ReviewRow label="Unique feature"  value={watch("identifying_details")} />
              {watch("proof_photo_url") && (
                <div className="border-b border-border py-3 last:border-none">
                  <dt className="mb-2 text-xs font-semibold text-muted-foreground">Proof photo</dt>
                  <dd>
                    <img
                      src={watch("proof_photo_url")}
                      alt="Proof"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Error state */}
          {submitError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
              <p className="text-sm font-medium text-destructive">{submitError}</p>
            </div>
          )}

          <Button
            type="button"
            size="lg"
            className="w-full gap-2"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Submitting…" : "Submit Claim"}
          </Button>
        </div>
      )}

      {/* ── Nav buttons ──────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {step > 1 ? (
          <Button type="button" variant="outline" className="min-h-[44px] w-full sm:w-auto" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}

        {step < 3 && (
          <Button type="button" className="min-h-[44px] w-full sm:w-auto" onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
