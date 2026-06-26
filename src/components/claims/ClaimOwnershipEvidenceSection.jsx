import React from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import PhotoUploader from "@/components/shared/PhotoUploader";
import { LockKeyhole, Shield } from "lucide-react";

const EVIDENCE_CHECKLIST_OPTIONS = ["hidden mark", "item contents", "proof photo"];

export default function ClaimOwnershipEvidenceSection({
  form,
  errors,
  updateField,
}) {
  const { t } = useTranslation();

  return (
    <section className="space-y-5" aria-labelledby="claim-ownership-heading">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 id="claim-ownership-heading" className="text-lg font-semibold text-foreground">
            {t("claim_item.help_staff_verify_title")}
          </h2>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("claim_item.help_staff_verify_description")}
        </p>
        <div className="soft-panel px-4 py-3 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p>{t("claim_item.private_evidence_notice")}</p>
          </div>
        </div>
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
          aria-invalid={Boolean(errors.reason)}
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
          className={errors.identifying_details ? "border-red-400" : ""}
          aria-invalid={Boolean(errors.identifying_details)}
        />
        {errors.identifying_details && <p className="mt-1 text-xs text-red-500">{errors.identifying_details}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="c_private">{t("claim_item.private_detail_label")}</Label>
          <Textarea
            id="c_private"
            rows={3}
            placeholder={t("claim_item.private_detail_placeholder")}
            value={form.private_detail}
            onChange={(event) => updateField("private_detail", event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="c_contents">{t("claim_item.contents_detail_label")}</Label>
          <Textarea
            id="c_contents"
            rows={3}
            placeholder={t("claim_item.contents_detail_placeholder")}
            value={form.contents_detail}
            onChange={(event) => updateField("contents_detail", event.target.value)}
          />
        </div>
      </div>

      <fieldset className="rounded-lg border border-border bg-muted/40 p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">
          {t("claim_item.evidence_checklist_title")}
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {EVIDENCE_CHECKLIST_OPTIONS.map((label) => (
            <label
              key={label}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={form.evidence_checklist.includes(label)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...form.evidence_checklist, label]
                    : form.evidence_checklist.filter((entry) => entry !== label);
                  updateField("evidence_checklist", next);
                }}
              />
              {t(`claim_item.evidence_option_${label.replace(/\s+/g, "_")}`, label)}
            </label>
          ))}
        </div>
      </fieldset>

      <PhotoUploader
        photos={form.proof_photo_url ? [form.proof_photo_url] : []}
        onChange={(urls) => updateField("proof_photo_url", urls[0] || "")}
        maxPhotos={1}
        label={t("claim_item.supporting_photo")}
        aspectRatio={1}
        isPrivate
      />
      <p className="text-xs text-muted-foreground">{t("claim_item.supporting_photo_private_note")}</p>

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
  );
}
