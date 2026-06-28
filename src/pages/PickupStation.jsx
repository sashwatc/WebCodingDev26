/**
 * PickupStation.jsx — Staff-facing desk terminal for handing items back.
 *
 * Purpose: a staff member at the pickup desk enters (or scans) the claimant's
 * one-time return-pass code to (1) VERIFY the pass is valid and see which item
 * + claimant it belongs to, then (2) REDEEM it, marking the item as returned.
 *
 * Flow: type code → "Verify". On a valid result the matched item photo, title,
 * and claimant name/email are shown, and a green "Redeem" button appears.
 * Redeeming fires confetti, resets the form, and toasts success. "Reset"
 * clears the flow. Invalid codes / errors surface as destructive toasts.
 */
import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRedeemReturnPass, useVerifyReturnPass } from "@/hooks/useReturnPassWorkflow";
import { appClient } from "@/api/appClient";
import { Loader2, ScanLine, ShieldCheck } from "lucide-react";

export default function PickupStation() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const codeInputId = useId(); // stable id linking the Label to the Input
  const [code, setCode] = useState(""); // the code the staffer typed/scanned
  const [verified, setVerified] = useState(null); // verify result (null until checked)

  const verifyMutation = useVerifyReturnPass(); // step 1: validate the code
  const redeemMutation = useRedeemReturnPass(); // step 2: mark item returned

  // Once a code verifies, fetch the linked found item to show its photo/title.
  const { data: stationItem } = useQuery({
    queryKey: ["stationItem", verified?.found_item_id],
    queryFn: () => appClient.entities.FoundItem.get(verified.found_item_id),
    enabled: Boolean(verified?.valid && verified?.found_item_id),
  });

  // ...and the claim, to show the claimant's name/email for desk confirmation.
  const { data: stationClaim } = useQuery({
    queryKey: ["stationClaim", verified?.claim_id],
    queryFn: () => appClient.entities.Claim.get(verified.claim_id),
    enabled: Boolean(verified?.valid && verified?.claim_id),
  });

  // Clear both the entered code and the verification result.
  const resetFlow = () => {
    setVerified(null);
    setCode("");
  };

  // Step 1 handler: verify the entered code; show item/claimant or a toast on failure.
  const handleVerify = async () => {
    const trimmed = code.trim();
    if (!trimmed || verifyMutation.isPending) {
      return; // ignore empty input or double-submits
    }

    try {
      const result = await verifyMutation.mutateAsync(trimmed);
      setVerified(result);
      // Backend says the code is invalid: warn and clear the field to retry.
      if (!result.valid) {
        toast({
          title: t("pickup_station.verify_failed_title"),
          description: result.message || t("pickup_station.verify_failed_description"),
          variant: "destructive",
        });
        setCode("");
      }
    } catch (error) {
      // Network/server error during verify: reset and surface the message.
      setVerified(null);
      toast({
        title: t("pickup_station.verify_failed_title"),
        description: error.message || t("pickup_station.verify_failed_description"),
        variant: "destructive",
      });
      setCode("");
    }
  };

  // Step 2 handler: redeem the verified pass (marks the item as returned).
  const handleRedeem = async () => {
    // Only redeemable once a valid pass with an id is loaded and not mid-request.
    if (!verified?.valid || !verified.return_pass_id || redeemMutation.isPending) {
      return;
    }

    try {
      await redeemMutation.mutateAsync({
        passId: verified.return_pass_id,
        oneTimeCode: code.trim(),
      });
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }); // celebrate success
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

  // ── Single-card layout: header, code form, then verification result panel ──
  return (
    <div className="page-shell max-w-xl py-10 sm:py-12">
      <div className="surface-card p-6 sm:p-8">
        {/* Header: scan icon + title/description */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
            <ScanLine className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("pickup_station.title")}</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("pickup_station.description")}</p>
          </div>
        </div>

        {/* Code form — Enter submits: redeem if already verified, else verify */}
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
                // Editing the code invalidates any prior verification result.
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
            <p id="pickup-station-help" className="text-xs text-muted-foreground">{t("pickup_station.code_help")}</p>
          </div>

          {/* Action buttons: Verify always; Redeem only after a valid verify; Reset to clear */}
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

        {/* Result panel — green when valid (shows item + claimant), amber when invalid */}
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
            {/* Valid: show item photo/title and the matched claimant's details */}
            {verified.valid && (
              <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                {stationItem?.photo_urls?.[0] && (
                  <img src={stationItem.photo_urls[0]} alt="Item" className="h-20 w-20 flex-shrink-0 rounded-lg object-cover border border-border"/>
                )}
                <div className="text-sm space-y-1 text-center sm:text-left">
                  <p className="font-semibold text-base">{stationItem?.title || verified.found_item_id || "Item"}</p>
                  <p className="text-muted-foreground">{stationClaim?.claimant_name || ""}</p>
                  <p className="text-muted-foreground text-xs">{stationClaim?.claimant_email || ""}</p>
                  {(!stationItem && !stationClaim) && <p className="text-xs opacity-70">Loading item details...</p>}
                </div>
              </div>
            )}
            {/* Hint shown when verification needs the real backend (demo fallback) */}
            {verified.backend_required && (
              <p className="mt-2 text-xs">{t("pickup_station.backend_required")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
