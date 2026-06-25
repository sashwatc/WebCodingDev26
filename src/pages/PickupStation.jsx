import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRedeemReturnPass, useVerifyReturnPass } from "@/hooks/useReturnPassWorkflow";
import { Loader2, ScanLine, ShieldCheck } from "lucide-react";

export default function PickupStation() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const codeInputId = useId();
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(null);

  const verifyMutation = useVerifyReturnPass();
  const redeemMutation = useRedeemReturnPass();

  const resetFlow = () => {
    setVerified(null);
    setCode("");
  };

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (!trimmed || verifyMutation.isPending) {
      return;
    }

    try {
      const result = await verifyMutation.mutateAsync(trimmed);
      setVerified(result);
      if (!result.valid) {
        toast({
          title: t("pickup_station.verify_failed_title"),
          description: result.message || t("pickup_station.verify_failed_description"),
          variant: "destructive",
        });
      }
    } catch (error) {
      setVerified(null);
      toast({
        title: t("pickup_station.verify_failed_title"),
        description: error.message || t("pickup_station.verify_failed_description"),
        variant: "destructive",
      });
    }
  };

  const handleRedeem = async () => {
    if (!verified?.valid || !verified.return_pass_id || redeemMutation.isPending) {
      return;
    }

    try {
      await redeemMutation.mutateAsync({
        passId: verified.return_pass_id,
        oneTimeCode: code.trim(),
      });
      resetFlow();
      toast({
        title: t("pickup_station.redeem_success_title"),
        description: t("pickup_station.redeem_success_description"),
      });
    } catch (error) {
      toast({
        title: t("pickup_station.redeem_failed_title"),
        description: error.message || t("pickup_station.redeem_failed_description"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="page-shell max-w-xl py-10 sm:py-12">
      <div className="surface-card p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
            <ScanLine className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">{t("pickup_station.title")}</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">{t("pickup_station.description")}</p>
          </div>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (verified?.valid) {
              handleRedeem();
              return;
            }
            handleVerify();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={codeInputId}>{t("pickup_station.code_label")}</Label>
            <Input
              id={codeInputId}
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                if (verified) {
                  setVerified(null);
                }
              }}
              placeholder={t("pickup_station.code_placeholder")}
              autoComplete="off"
              inputMode="numeric"
              aria-describedby="pickup-station-help"
              disabled={redeemMutation.isPending}
            />
            <p id="pickup-station-help" className="text-xs text-slate-500">{t("pickup_station.code_help")}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              disabled={!code.trim() || verifyMutation.isPending || redeemMutation.isPending}
              onClick={handleVerify}
            >
              {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {t("pickup_station.verify_button")}
            </Button>

            {verified?.valid && (
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={redeemMutation.isPending}
                onClick={handleRedeem}
              >
                {redeemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("pickup_station.redeem_button")}
              </Button>
            )}

            {(verified || code) && (
              <Button type="button" variant="ghost" onClick={resetFlow} disabled={verifyMutation.isPending || redeemMutation.isPending}>
                {t("pickup_station.reset_button")}
              </Button>
            )}
          </div>
        </form>

        {verified && (
          <div
            className={`mt-5 rounded-xl border p-4 text-sm ${
              verified.valid
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="font-semibold">{verified.message || t("pickup_station.verify_result_fallback")}</p>
            {verified.valid && (
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="font-semibold uppercase tracking-wide opacity-70">{t("pickup_station.claim_label")}</dt>
                  <dd className="mt-0.5 font-mono">{verified.claim_id || t("common.not_available")}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide opacity-70">{t("pickup_station.item_label")}</dt>
                  <dd className="mt-0.5 font-mono">{verified.found_item_id || t("common.not_available")}</dd>
                </div>
              </dl>
            )}
            {verified.backend_required && (
              <p className="mt-2 text-xs">{t("pickup_station.backend_required")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
