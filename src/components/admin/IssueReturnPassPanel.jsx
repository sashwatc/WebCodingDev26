import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MapPin, Send, Ticket } from "lucide-react";
import { getPickupPassRoute } from "@/lib/return-pass";
import { useCreateReturnPass, useSendPickupReminder } from "@/hooks/useReturnPassWorkflow";

export default function IssueReturnPassPanel({ claim, existingPassId = "" }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [pickupWindow, setPickupWindow] = useState("Next school day during office hours");
  const [pickupLocation, setPickupLocation] = useState("PVHS Main Office pickup station");
  const [issuedPassId, setIssuedPassId] = useState(existingPassId || "");

  const createMutation = useCreateReturnPass(claim?.id);
  const reminderMutation = useSendPickupReminder(issuedPassId);

  const canIssue = claim?.status === "approved";

  const handleIssue = async () => {
    if (!canIssue || createMutation.isPending) {
      return;
    }

    try {
      const pass = await createMutation.mutateAsync({
        pickup_window: pickupWindow.trim(),
        pickup_location: pickupLocation.trim(),
      });
      setIssuedPassId(pass?.id || "");
      toast({
        title: t("pickup_pass.issue_success_title"),
        description: t("pickup_pass.issue_success_description"),
      });
    } catch (error) {
      toast({
        title: t("pickup_pass.issue_failed_title"),
        description: error.message || t("pickup_pass.issue_failed_description"),
        variant: "destructive",
      });
    }
  };

  const handleReminder = async () => {
    if (!issuedPassId || reminderMutation.isPending) {
      return;
    }

    try {
      await reminderMutation.mutateAsync();
      toast({
        title: t("pickup_pass.reminder_sent_title"),
        description: t("pickup_pass.reminder_sent_description"),
      });
    } catch (error) {
      toast({
        title: t("pickup_pass.reminder_failed_title"),
        description: error.message || t("pickup_pass.reminder_failed_description"),
        variant: "destructive",
      });
    }
  };

  if (!canIssue) {
    return null;
  }

  return (
    <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 px-4 py-4">
      <div className="flex items-start gap-3">
        <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-indigo-100">{t("pickup_pass.issue_title")}</p>
            <p className="mt-1 text-xs leading-5 text-indigo-200/80">{t("pickup_pass.issue_description")}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`pickup-window-${claim.id}`} className="text-xs text-indigo-200">
                {t("pickup_pass.pickup_window_label")}
              </Label>
              <Input
                id={`pickup-window-${claim.id}`}
                value={pickupWindow}
                onChange={(event) => setPickupWindow(event.target.value)}
                className="border-indigo-900 bg-slate-950 text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`pickup-location-${claim.id}`} className="text-xs text-indigo-200">
                {t("pickup_pass.pickup_location_label")}
              </Label>
              <Input
                id={`pickup-location-${claim.id}`}
                value={pickupLocation}
                onChange={(event) => setPickupLocation(event.target.value)}
                className="border-indigo-900 bg-slate-950 text-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
              disabled={createMutation.isPending || !pickupWindow.trim() || !pickupLocation.trim()}
              onClick={handleIssue}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
              {issuedPassId ? t("pickup_pass.reissue_pass") : t("pickup_pass.issue_pass")}
            </Button>

            {issuedPassId && (
              <>
                <Button asChild type="button" size="sm" variant="outline" className="border-indigo-800 text-indigo-100">
                  <Link to={getPickupPassRoute(issuedPassId)}>{t("pickup_pass.view_pass")}</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-indigo-800 text-indigo-100 gap-1.5"
                  disabled={reminderMutation.isPending}
                  onClick={handleReminder}
                >
                  {reminderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("pickup_pass.send_reminder")}
                </Button>
              </>
            )}
          </div>

          <p className="flex items-start gap-1.5 text-xs text-indigo-200/70">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t("pickup_pass.issue_privacy_note")}
          </p>
        </div>
      </div>
    </div>
  );
}
