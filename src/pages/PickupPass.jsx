/**
 * PickupPass.jsx — Claimant's "return pass" / pickup ticket page.
 *
 * Purpose: after a claim is approved, the claimant is issued a return pass.
 * This page (reached via ?id=<passId>) displays that pass: the item it's for,
 * the pickup window/location, instructions, and — while the pass is active —
 * the one-time pickup code plus a scannable QR code to present at the desk.
 *
 * Access is gated: the viewer must be signed in AND be either an admin or the
 * pass's claimant (matched by email). The component renders a sequence of
 * guard/early-return states before showing the actual pass:
 *   loadingAuth → not signed in → missing id → loading → error/not-found →
 *   access denied → the pass itself.
 *
 * Pass states drive what's shown: active (code + QR), redeemed (already picked
 * up), or inactive/expired/cancelled (warning).
 */
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

// Maps a normalized pass status to the Tailwind classes for its status badge:
// green=active, muted=redeemed/unknown, amber=expired/cancelled.
function statusBadgeClass(status) {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "redeemed") {
    return "border-border bg-muted text-muted-foreground";
  }
  if (status === "expired" || status === "cancelled") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-border bg-muted text-muted-foreground";
}

export default function PickupPass() {
  const { t } = useTranslation();
  const { user, isAdmin, navigateToLogin, isLoadingAuth } = useAuth();
  const location = useLocation();
  // The pass to display, from ?id=<passId>.
  const passId = new URLSearchParams(location.search).get("id") || "";

  // Fetch the return pass (only once we have an id and a signed-in user).
  const {
    data: pass,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useReturnPass(passId, { enabled: Boolean(passId) && Boolean(user) });

  // Fetch the linked found item so we can show its title (best-effort).
  const { data: foundItem } = useQuery({
    queryKey: ["pickupPassItem", pass?.found_item_id],
    queryFn: () => appClient.entities.FoundItem.get(pass.found_item_id),
    enabled: Boolean(pass?.found_item_id),
    retry: 1,
  });

  // Derived pass state.
  const status = useMemo(() => normalizeReturnPassStatus(pass || {}), [pass]);
  const isActive = isReturnPassActive(pass || {}); // active => show code + QR
  // Authorization: admins, or the claimant whose email matches the pass.
  const canViewPass = Boolean(
    user
    && pass
    && (isAdmin || String(user.email || "").toLowerCase() === String(pass.claimant_email || "").toLowerCase())
  );

  // ── Guard state 1: auth still resolving → skeleton ──
  if (isLoadingAuth) {
    return (
      <div className="page-shell max-w-xl py-16">
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  // ── Guard state 2: not signed in → prompt to sign in ──
  if (!user) {
    return (
      <div className="page-shell max-w-xl py-16">
        <div className="surface-card p-8 text-center">
          <LockKeyhole className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">{t("pickup_pass.sign_in_required_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("pickup_pass.sign_in_required_description")}</p>
          <Button className="mt-6" onClick={() => navigateToLogin()}>{t("common.sign_in")}</Button>
        </div>
      </div>
    );
  }

  // ── Guard state 3: no pass id in the URL → "missing id" + back link ──
  if (!passId) {
    return (
      <div className="page-shell max-w-xl py-16">
        <div className="surface-card p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">{t("pickup_pass.missing_id_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("pickup_pass.missing_id_description")}</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/UserDashboard">{t("pickup_pass.back_to_dashboard")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Guard state 4: pass query loading → skeleton ──
  if (isLoading) {
    return (
      <div className="page-shell max-w-xl py-16">
        <Skeleton className="h-80 w-full rounded-2xl" aria-label={t("pickup_pass.loading")} />
      </div>
    );
  }

  // ── Guard state 5: load failed / no pass → error with retry + back link ──
  if (error || !pass) {
    return (
      <div className="page-shell max-w-xl py-16">
        <div className="surface-card p-8 text-center" role="alert">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">{t("pickup_pass.unavailable_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("pickup_pass.unavailable_description")}</p>
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

  // ── Guard state 6: signed in but not the claimant/admin → access denied ──
  if (!canViewPass) {
    return (
      <div className="page-shell max-w-xl py-16">
        <div className="surface-card p-8 text-center" role="alert">
          <LockKeyhole className="mx-auto mb-4 h-10 w-10 text-red-600" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">{t("pickup_pass.access_denied_title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("pickup_pass.access_denied_description")}</p>
        </div>
      </div>
    );
  }

  // Prefer the live found-item title; fall back to the snapshot stored on the pass.
  const itemTitle = foundItem?.title || pass.found_item_title || t("pickup_pass.item_fallback_title");

  // ── Authorized view: the actual pickup pass card ──
  return (
    <div className="page-shell max-w-xl py-12 sm:py-16">
      <article className="surface-card p-6 sm:p-8" aria-labelledby="pickup-pass-title">
        {/* Header row: status badge + expiry/expired timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="outline" className={statusBadgeClass(status)}>
            {t(`pickup_pass.status_${status}`, { defaultValue: status })}
          </Badge>
          {pass.expires_at && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {status === "expired"
                ? t("pickup_pass.expired_on", { date: formatLocalizedDate(pass.expires_at, "PPp") })
                : t("pickup_pass.expires_on", { date: formatLocalizedDate(pass.expires_at, "PPp") })}
            </p>
          )}
        </div>

        {/* Title block: ticket icon, page title, item name, pickup window */}
        <div className="mt-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Ticket className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 id="pickup-pass-title" className="text-2xl font-bold text-foreground">{t("pickup_pass.title")}</h1>
          <p className="mt-2 text-base font-semibold text-foreground">{itemTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{pass.pickup_window}</p>
        </div>

        {/* Code block — active pass shows the one-time code; otherwise a status note */}
        {isActive ? (
          <div className="my-8 rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 text-center">
            {/* Active: prominent one-time pickup code */}
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{t("pickup_pass.code_label")}</p>
            <p
              className="mt-3 font-mono text-4xl font-black tracking-[0.35em] text-foreground sm:text-5xl"
              aria-label={t("pickup_pass.code_aria", { code: pass.one_time_code })}
            >
              {pass.one_time_code}
            </p>
            <p className="mt-3 text-xs text-emerald-900">{t("pickup_pass.code_private_note")}</p>
          </div>
        ) : (
          // Inactive: either already redeemed, or expired/cancelled
          <div className="my-8 rounded-xl border border-border bg-muted/40 p-6 text-center" role="status">
            {status === "redeemed" ? (
              <>
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">{t("pickup_pass.redeemed_title")}</p>
                {pass.redeemed_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
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

        {/* Details: pickup location, numbered instructions, and (if active) the QR code */}
        <div className="space-y-4">
          {/* Pickup location */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="flex items-start gap-2 text-sm text-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>
                <span className="font-semibold text-foreground">{t("pickup_pass.location_label")}</span>
                {" "}
                {pass.pickup_location}
              </span>
            </p>
          </div>

          <div className="soft-panel p-4 text-sm leading-6 text-foreground">
            <p className="font-semibold text-foreground">{t("pickup_pass.instructions_title")}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>{t("pickup_pass.instruction_1")}</li>
              <li>{t("pickup_pass.instruction_2")}</li>
              <li>{t("pickup_pass.instruction_3")}</li>
            </ol>
          </div>

          {/* Scannable QR encoding "<passId>:<code>" for the pickup station to verify */}
          {isActive && pass.one_time_code && (
            <RecoveryLinkCode
              value={`${pass.id}:${pass.one_time_code}`}
              label={t("pickup_pass.qr_label")}
              description={t("pickup_pass.qr_description")}
              compact
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("pickup_pass.privacy_footer")}</p>
      </article>
    </div>
  );
}
