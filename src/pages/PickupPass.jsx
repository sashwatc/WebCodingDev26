import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, MapPin, Clock3, AlertTriangle, Ticket } from "lucide-react";
import { translateCategory } from "@/lib/i18n-helpers";
import { useTranslation } from "react-i18next";

function StatusBadge({ status }) {
  const cfg = {
    active:   "border-emerald-200 bg-emerald-50 text-emerald-800",
    redeemed: "border-slate-200 bg-slate-100 text-slate-600",
    expired:  "border-red-200 bg-red-50 text-red-800",
  };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${cfg[status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>
      {label}
    </span>
  );
}

function safeFormat(dateStr, fmt) {
  try { return format(new Date(dateStr), fmt); } catch { return dateStr || ""; }
}

export default function PickupPass() {
  useEffect(() => { document.title = "Pickup Pass — Lost Then Found"; }, []);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const claim_id = new URLSearchParams(location.search).get("claim_id");

  const {
    data: pass,
    isLoading: passLoading,
    error: passError,
  } = useQuery({
    queryKey: ["returnPass", claim_id],
    queryFn: () => appClient.returnPasses.get(claim_id),
    enabled: !!claim_id,
    retry: 1,
  });

  const { data: item } = useQuery({
    queryKey: ["pickupPassItem", pass?.found_item_id],
    queryFn: () => appClient.items.get(pass.found_item_id),
    enabled: !!pass?.found_item_id,
    retry: 1,
  });

  // ── States ────────────────────────────────────────────────────────────────

  if (!claim_id || (!passLoading && !pass && !passError)) {
    return <NotFound onBack={() => navigate(-1)} />;
  }

  if (passLoading) {
    return (
      <div className="page-shell max-w-md py-16">
        <Skeleton className="mb-4 h-8 w-24" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (passError || !pass) {
    return <NotFound onBack={() => navigate(-1)} />;
  }

  const status    = (pass.status || "").toLowerCase();
  const isActive  = status === "active";
  const isRedeemed = status === "redeemed";
  const itemTitle  = item?.title || pass.found_item_title || "Item";
  const category   = item?.category || pass.category || "";

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          [data-print-hide] { display: none !important; }
          .page-shell { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="page-shell max-w-md py-12">
        {/* Back */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-1 text-muted-foreground"
          onClick={() => navigate(-1)}
          data-print-hide
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>

        <article className="surface-card overflow-hidden" aria-labelledby="pass-title">

          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4" data-print-hide>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" aria-hidden="true" />
              <h1 id="pass-title" className="text-base font-bold text-foreground">
                Your Pickup Pass
              </h1>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="space-y-6 p-6">

            {/* Item identity */}
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{itemTitle}</p>
              {category && (
                <p className="mt-1 text-sm text-muted-foreground">{translateCategory(t, category)}</p>
              )}
            </div>

            {/* PIN / status block */}
            {isActive && (
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 px-6 py-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Show this code to staff at pickup
                </p>
                <p
                  className="mt-4 font-mono text-5xl font-black tracking-[0.4em] text-foreground"
                  aria-label={`Pickup code: ${pass.one_time_code}`}
                >
                  {pass.one_time_code}
                </p>
              </div>
            )}

            {isRedeemed && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-emerald-900">Item returned</p>
                {pass.redeemed_at && (
                  <p className="mt-1 text-xs text-emerald-700">
                    Item returned on {safeFormat(pass.redeemed_at, "MMMM d, yyyy h:mm a")}
                  </p>
                )}
              </div>
            )}

            {!isActive && !isRedeemed && (
              <div className="rounded-xl border border-border bg-muted/40 px-6 py-6 text-center">
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">This pass is no longer valid</p>
              </div>
            )}

            {/* Pickup details */}
            <div className="space-y-3 text-sm">
              {pass.pickup_location && (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
                      Pickup location
                    </p>
                    <p className="mt-0.5 font-medium text-foreground">{pass.pickup_location}</p>
                  </div>
                </div>
              )}

              {pass.pickup_window && (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.10em] text-muted-foreground">
                      Pickup hours
                    </p>
                    <p className="mt-0.5 font-medium text-foreground">{pass.pickup_window}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Expiry */}
            {pass.expires_at && (
              <p className="text-center text-xs text-muted-foreground" data-print-hide>
                Valid until {safeFormat(pass.expires_at, "MMMM d, yyyy h:mm a")}
              </p>
            )}

            {/* Privacy note — hidden on print */}
            <p className="text-center text-xs text-muted-foreground" data-print-hide>
              Keep this pass private. Do not share your pickup code with anyone.
            </p>
          </div>
        </article>
      </div>
    </>
  );
}

function NotFound({ onBack }) {
  return (
    <div className="page-shell max-w-md py-20 text-center">
      <Ticket className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" aria-hidden="true" />
      <h1 className="mb-2 text-xl font-bold text-foreground">Pickup pass not found</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This pass may have expired or the link is invalid.
      </p>
      <Button onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Go back
      </Button>
    </div>
  );
}
