import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RecoveryLinkCode from "@/components/recovery/RecoveryLinkCode";
import { useAuth } from "@/lib/AuthContext";
import {
  isReturnPassActive,
  normalizeReturnPassStatus,
} from "@/lib/return-pass";
import { useReturnPass } from "@/hooks/useReturnPassWorkflow";
import { formatLocalizedDate } from "@/lib/i18n-helpers";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MapPin,
  Ticket,
} from "lucide-react";

function statusBadgeClass(status) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "redeemed") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  if (status === "expired" || status === "cancelled") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function PickupPass() {
  const { t } = useTranslation();
  const { user, hasAdminAccess, navigateToLogin, isLoadingAuth } = useAuth();
  const location = useLocation();
  const passId = new URLSearchParams(location.search).get("id") || "";

  const {
    data: pass,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useReturnPass(passId, { enabled: Boolean(passId) && Boolean(user) });

  const { data: foundItem } = useQuery({
    queryKey: ["pickupPassItem", pass?.found_item_id],
    queryFn: () => appClient.entities.FoundItem.get(pass.found_item_id),
    enabled: Boolean(pass?.found_item_id),
    retry: 1,
  });

  const status = useMemo(() => normalizeReturnPassStatus(pass || {}), [pass]);
  const isActive = isReturnPassActive(pass || {});
  const canViewPass = Boolean(
    user
    && pass
    && (hasAdminAccess || String(user.email || "").toLowerCase() === String(pass.claimant_email || "").toLowerCase())
  );

  if (isLoadingAuth) {
    return (
      <div className="page-shell max-w-xl py-16">
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell max-w-xl py-16">
        <div className="surface-card p-8 text-center">
          <LockKeyhole className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-950">{t("pickup_pass.sign_in_required_title")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("pickup_pass.sign_in_required_description")}</p>
          <Button className="mt-6" onClick={() => navigateToLogin()}>{t("common.sign_in")}</Button>
        </div>
      </div>
    );
  }

  if (!passId) {
    return (
      <div className="page-shell max-w-xl py-16">
        <div className="surface-card p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-950">{t("pickup_pass.missing_id_title")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("pickup_pass.missing_id_description")}</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/UserDashboard">{t("pickup_pass.back_to_dashboard")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-shell max-w-xl py-16">
        <Skeleton className="h-80 w-full rounded-2xl" aria-label={t("pickup_pass.loading")} />
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="page-shell max-w-xl py-16">
        <div className="surface-card p-8 text-center" role="alert">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-950">{t("pickup_pass.unavailable_title")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("pickup_pass.unavailable_description")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {t("navbar.please_try_again")}
            </Button>
            <Button asChild variant="outline">
              <Link to="/UserDashboard">{t("pickup_pass.back_to_dashboard")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!canViewPass) {
    return (
      <div className="page-shell max-w-xl py-16">
        <div className="surface-card p-8 text-center" role="alert">
          <LockKeyhole className="mx-auto mb-4 h-10 w-10 text-red-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-950">{t("pickup_pass.access_denied_title")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("pickup_pass.access_denied_description")}</p>
        </div>
      </div>
    );
  }

  const itemTitle = foundItem?.title || pass.found_item_title || t("pickup_pass.item_fallback_title");

  return (
    <div className="page-shell max-w-xl py-12 sm:py-16">
      <article className="surface-card p-6 sm:p-8" aria-labelledby="pickup-pass-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline" className={statusBadgeClass(status)}>
            {t(`pickup_pass.status_${status}`, { defaultValue: status })}
          </Badge>
          {pass.expires_at && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {status === "expired"
                ? t("pickup_pass.expired_on", { date: formatLocalizedDate(pass.expires_at, "PPp") })
                : t("pickup_pass.expires_on", { date: formatLocalizedDate(pass.expires_at, "PPp") })}
            </p>
          )}
        </div>

        <div className="mt-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Ticket className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 id="pickup-pass-title" className="text-2xl font-bold text-slate-950">{t("pickup_pass.title")}</h1>
          <p className="mt-2 text-base font-semibold text-slate-800">{itemTitle}</p>
          <p className="mt-1 text-sm text-slate-600">{pass.pickup_window}</p>
        </div>

        {isActive ? (
          <div className="my-8 rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{t("pickup_pass.code_label")}</p>
            <p
              className="mt-3 font-mono text-4xl font-black tracking-[0.35em] text-slate-950 sm:text-5xl"
              aria-label={t("pickup_pass.code_aria", { code: pass.one_time_code })}
            >
              {pass.one_time_code}
            </p>
            <p className="mt-3 text-xs text-emerald-900">{t("pickup_pass.code_private_note")}</p>
          </div>
        ) : (
          <div className="my-8 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center" role="status">
            {status === "redeemed" ? (
              <>
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-slate-500" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-800">{t("pickup_pass.redeemed_title")}</p>
                {pass.redeemed_at && (
                  <p className="mt-1 text-xs text-slate-500">
                    {t("pickup_pass.redeemed_on", { date: formatLocalizedDate(pass.redeemed_at, "PPp") })}
                  </p>
                )}
              </>
            ) : (
              <>
                <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-amber-900">{t("pickup_pass.inactive_title")}</p>
                <p className="mt-1 text-xs text-amber-800">{t("pickup_pass.inactive_description")}</p>
              </>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="flex items-start gap-2 text-sm text-slate-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>
                <span className="font-semibold text-slate-900">{t("pickup_pass.location_label")}</span>
                {" "}
                {pass.pickup_location}
              </span>
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-slate-900">{t("pickup_pass.instructions_title")}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>{t("pickup_pass.instruction_1")}</li>
              <li>{t("pickup_pass.instruction_2")}</li>
              <li>{t("pickup_pass.instruction_3")}</li>
            </ol>
          </div>

          {isActive && pass.one_time_code && (
            <RecoveryLinkCode
              value={`${pass.id}:${pass.one_time_code}`}
              label={t("pickup_pass.qr_label")}
              description={t("pickup_pass.qr_description")}
              compact
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">{t("pickup_pass.privacy_footer")}</p>
      </article>
    </div>
  );
}
