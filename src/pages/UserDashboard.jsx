/**
 * FindBack AI - User Dashboard
 * Students/staff can track submitted lost reports, claim history,
 * advisory match suggestions, and notification updates.
 */

import React, { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import StatusBadge from "@/components/ui/StatusBadge";
import RecordThumbnail from "@/components/shared/RecordThumbnail";
import ClaimCaseMessageThread from "@/components/claims/ClaimCaseMessageThread";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { getPrimaryRecordPhoto } from "@/lib/media";
import { formatLocalizedDate, translateStatus } from "@/lib/i18n-helpers";
import ConstellationCanvas from "@/components/shared/ConstellationCanvas";
import {
  findReturnPassNotificationForClaim,
  getPickupPassRoute,
  getReturnPassIdFromNotification,
  sanitizeNotificationMessage,
} from "@/lib/return-pass";
import {
  AlertTriangle, FileCheck, Bell, Eye,
  Brain, CheckCircle2, Loader2, Star,
  ShieldAlert, Clock, Sparkles, Ticket,
  Bookmark, Trash2, Search as SearchIcon, MessageSquare
} from "lucide-react";

export default function UserDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user, navigateToLogin } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "reports");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [savedItemData, setSavedItemData] = useState([]);
  const [savedSearches, setSavedSearches] = useState(
    () => JSON.parse(localStorage.getItem("ltf_saved_searches") || "[]")
  );

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("ltf_saved_items") || "[]");
    if (!ids.length) return;
    Promise.all(ids.map(id => appClient.entities.FoundItem.get(id).catch(() => null)))
      .then(items => setSavedItemData(items.filter(Boolean)));
  }, []);

  const deleteSavedSearch = (id) => {
    const updated = savedSearches.filter(s => s.id !== id);
    localStorage.setItem("ltf_saved_searches", JSON.stringify(updated));
    setSavedSearches(updated);
  };

  // Fetch user's lost reports — match by contact_email OR submitted_by_user_email
  // so records created before the auto-fill fix are still surfaced.
  const { data: lostReports = [], isLoading: lrLoading } = useQuery({
    queryKey: ["userLostReports", user?.email],
    queryFn: async () => {
      const all = await appClient.entities.LostReport.list("-created_date", 500);
      const email = user.email.toLowerCase();
      return all.filter(r =>
        String(r.contact_email || "").toLowerCase() === email ||
        String(r.submitted_by_user_email || "").toLowerCase() === email
      );
    },
    enabled: !!user?.email,
  });

  // Fetch user's claims — match by claimant_email OR submitted_by_user_email
  const { data: claims = [], isLoading: clLoading } = useQuery({
    queryKey: ["userClaims", user?.email],
    queryFn: async () => {
      try {
        return await appClient.claims.mine();
      } catch {
        // Fallback: client-side filter from the full claims list
        const all = await appClient.entities.Claim.list("-created_date", 500);
        const email = user.email.toLowerCase();
        return all.filter(r =>
          String(r.claimant_email || "").toLowerCase() === email ||
          String(r.submitted_by_user_email || "").toLowerCase() === email
        );
      }
    },
    enabled: !!user?.email,
  });

  const { data: foundItems = [] } = useQuery({
    queryKey: ["dashboardFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 500),
    enabled: !!user?.email,
  });

  // Collect match IDs referenced by lost reports so we can fetch any that
  // aren't in the 500-item list (e.g. older or archived items).
  const missingMatchIds = useMemo(() => {
    const inList = new Set(foundItems.map(f => f.id));
    const ids = new Set();
    for (const r of lostReports) {
      for (const m of r.matched_items || []) {
        const id = typeof m === "string" ? m : (m?.found_item_id || m?.foundItemId);
        if (id && !inList.has(id)) ids.add(id);
      }
    }
    return [...ids];
  }, [lostReports, foundItems]);

  const { data: extraMatchedItems = [] } = useQuery({
    queryKey: ["matchedFoundItems", missingMatchIds.join(",")],
    queryFn: () => Promise.all(missingMatchIds.map(id => appClient.entities.FoundItem.get(id).catch(() => null))).then(r => r.filter(Boolean)),
    enabled: missingMatchIds.length > 0,
  });

  const { data: recoveryCases = [] } = useQuery({
    queryKey: ["userRecoveryCases", user?.email, lostReports.map((report) => report.id).join(",")],
    queryFn: async () => {
      const cases = await Promise.all(
        lostReports.map((report) => appClient.recoveryCases.byLostReport(report.id))
      );
      return cases.filter(Boolean);
    },
    enabled: !!user?.email && lostReports.length > 0,
  });

  // Fetch user's notifications
  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ["userNotifications", user?.email],
    queryFn: () => appClient.recoveryPulse.notifications(),
    enabled: !!user?.email,
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: (id) => appClient.recoveryPulse.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({ claim, rating, review }) => {
      // Use the dedicated claimant-authorized rating endpoint. It persists the
      // rating on the claim and mirrors it onto the FoundItem server-side, so
      // the previous updateWorkflow + FoundItem.upsertRating calls (which hit
      // the admin-only entity list and 403'd for claimants) are not needed.
      await appClient.claims.submitRating(claim, { rating, review });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: t("user_dashboard.rating_submitted"),
        description: t("user_dashboard.rating_submitted_message"),
      });
    },
    onError: (error) => {
      toast({
        title: t("user_dashboard.unable_to_submit_rating"),
        description: error.message || t("navbar.please_try_again"),
        variant: "destructive",
      });
    },
  });

  const foundItemsById = useMemo(
    () =>
      [...foundItems, ...extraMatchedItems].reduce((itemsById, item) => {
        itemsById[item.id] = item;
        return itemsById;
      }, {}),
    [foundItems, extraMatchedItems]
  );

  const recoveryCasesByReportId = useMemo(
    () =>
      recoveryCases.reduce((casesByReportId, recoveryCase) => {
        casesByReportId[recoveryCase.lost_report_id] = recoveryCase;
        return casesByReportId;
      }, {}),
    [recoveryCases]
  );

  // Map each found-item id to the caller's existing claim (if any) so suggested
  // match cards can show a persistent "Claim submitted" state after reload.
  const claimByFoundItemId = useMemo(
    () =>
      claims.reduce((byItemId, claim) => {
        if (claim.found_item_id && !byItemId[claim.found_item_id]) {
          byItemId[claim.found_item_id] = claim;
        }
        return byItemId;
      }, {}),
    [claims]
  );

  const EmptyState = ({ icon: Icon, message }) => (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="surface-card shadow-sm">
          <div className="p-8 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">{t("user_dashboard.sign_in_title")}</h1>
            <p className="text-muted-foreground mb-6">
              {t("user_dashboard.sign_in_description")}
            </p>
            <Button
              className="bg-[hsl(222,65%,18%)] text-white hover:bg-[hsl(222,65%,15%)]"
              onClick={async () => {
                try {
                  await navigateToLogin();
                } catch (error) {
                  toast({
                    title: t("user_dashboard.sign_in_unavailable"),
                    description: error.message,
                    variant: "destructive",
                  });
                }
              }}
            >
              {t("common.sign_in")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-6xl py-10 space-y-8">
      {/* Page Header */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: 180, borderBottom: "1px solid hsl(var(--border))" }}>
        <ConstellationCanvas />
        <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4" style={{ position: "relative", zIndex: 2 }}>
          <div>
            <span className="page-kicker">{t("user_dashboard.kicker", "Personal Command Center")}</span>
            <h1 className="page-title text-4xl font-extrabold tracking-tight text-foreground mt-1">
              {t("user_dashboard.title", "My Account Dashboard")}
            </h1>
            <p className="page-subtitle mt-2 max-w-2xl text-muted-foreground">
              {t("user_dashboard.welcome", {
                suffix: user?.full_name ? `, ${user.full_name.split(" ")[0]}` : "",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/Search">
              <Button variant="default" className="gap-2 transition-all hover:scale-[1.02]">
                <Eye className="w-4 h-4" />
                {t("user_dashboard.browse_items", "Browse Lost & Found")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Reports */}
        <div className="stat-panel relative overflow-hidden group hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/80 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-foreground">{lostReports.length}</p>
              <p className="text-sm font-semibold text-muted-foreground mt-0.5">{t("user_dashboard.lost_reports")}</p>
            </div>
          </div>
        </div>

        {/* Stat 2: Claims */}
        <div className="stat-panel relative overflow-hidden group hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-sm">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-foreground">
                {claims.filter(c => !["completed", "rejected"].includes(c.status)).length}
              </p>
              <p className="text-sm font-semibold text-muted-foreground mt-0.5">{t("user_dashboard.active_claims")}</p>
            </div>
          </div>
        </div>

        {/* Stat 3: Alerts */}
        <div className="stat-panel relative overflow-hidden group hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-300" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/80 shadow-sm">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-foreground">
                {notifications.filter(n => !n.is_read).length}
              </p>
              <p className="text-sm font-semibold text-muted-foreground mt-0.5">{t("user_dashboard.unread_alerts")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchParams({ tab: v }); }} className="w-full">
        <TabsList className="responsive-tabs bg-muted/80 rounded-xl border border-border/50 p-1">
          <TabsTrigger
            value="reports"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            {t("user_dashboard.tab_reports")}
          </TabsTrigger>
          <TabsTrigger
            value="claims"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            {t("user_dashboard.tab_claims")}
          </TabsTrigger>
          <TabsTrigger
            value="recovery"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Recovery Cases
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            {t("user_dashboard.tab_notifications")}
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="ml-2 w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Bookmark className="h-4 w-4 mr-1.5" />Saved
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />Messages
          </TabsTrigger>
        </TabsList>

        {/* Lost Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {lrLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : lostReports.length === 0 ? (
            <EmptyState icon={AlertTriangle} message={t("user_dashboard.no_lost_reports")} />
          ) : (
            <div className="space-y-4">
              {lostReports.map(report => (
                <div key={report.id} className="archive-card hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 relative">
                          <RecordThumbnail
                            src={getPrimaryRecordPhoto(report)}
                            alt={report.item_type || "Lost report"}
                            className="w-16 h-16 rounded-lg object-cover border border-border shadow-sm"
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-foreground text-lg leading-tight">{report.item_type}</h3>
                            <StatusBadge status={report.status} />
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{report.description}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground font-medium">
                            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded">
                              {t("user_dashboard.reported_on_label", "Reported")}:{" "}
                              {report.created_date ? formatLocalizedDate(report.created_date, "MMM d, yyyy") : t("home.no_date")}
                            </span>
                            {report.location_lost && (
                              <span>• {report.location_lost}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {report.matched_items?.length > 0 && (
                        <div className="shrink-0 flex items-center md:self-center">
                          <Badge className="bg-muted hover:bg-muted text-primary font-bold border border-border flex items-center gap-1.5 py-1 px-3 rounded-full text-xs shadow-sm transition-all duration-300">
                            <Brain className="w-3.5 h-3.5 animate-pulse text-primary" />
                            {t("user_dashboard.matches", { count: report.matched_items.length })}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Potential match cards */}
                    {report.matched_items?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-amber-200/60 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/10 -mx-5 -mb-5 px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Potential Match{report.matched_items.length > 1 ? "es" : ""} Found
                          </h4>
                          <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                            {report.matched_items.length} {report.matched_items.length === 1 ? "item" : "items"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          A found item in our inventory closely matches your report. Review it and submit a claim if it's yours.
                        </p>
                        <div className="space-y-2.5">
                          {report.matched_items.map(match => {
                            const matchId = typeof match === "string" ? match : (match?.found_item_id || match?.foundItemId);
                            const confidence = typeof match === "object" ? match.confidence : null;
                            const reasons = typeof match === "object" && Array.isArray(match.reasons) ? match.reasons : [];
                            const matchedItem = foundItemsById[matchId];
                            const existingClaim = claimByFoundItemId[matchId];
                            return (
                              <div key={matchId} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                                {/* Thumbnail — placeholder box when item not yet loaded */}
                                <div className="w-14 h-14 rounded-lg border border-border bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                                  {matchedItem?.photo_urls?.[0]
                                    ? <RecordThumbnail src={matchedItem.photo_urls[0]} alt={matchedItem.title} className="w-full h-full object-cover" />
                                    : <Brain className="w-6 h-6 text-muted-foreground/40" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground leading-tight">
                                      {matchedItem?.title ?? "Found item"}
                                    </span>
                                    {confidence != null && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        confidence >= 80
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                                          : confidence >= 50
                                          ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900"
                                          : "bg-muted text-muted-foreground border-border"
                                      }`}>
                                        {confidence}% match
                                      </span>
                                    )}
                                  </div>
                                  {matchedItem?.location_found && (
                                    <p className="text-xs text-muted-foreground mt-0.5">Found at: {matchedItem.location_found}</p>
                                  )}
                                  {reasons.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {reasons.slice(0, 3).map(r => (
                                        <span key={r} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{r}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 flex gap-2 sm:flex-col sm:items-end">
                                  {existingClaim ? (
                                    <Button size="sm" variant="outline" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/40 text-xs" asChild>
                                      <Link to="/UserDashboard?tab=claims">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {existingClaim.status === "approved" ? "Claim Approved" : "Claim Submitted"}
                                      </Link>
                                    </Button>
                                  ) : (
                                    <>
                                      <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm text-xs" asChild>
                                        <Link to={`/ClaimItem?id=${matchId}`}>
                                          <Sparkles className="w-3.5 h-3.5" />
                                          Claim This Item
                                        </Link>
                                      </Button>
                                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
                                        <Link to={`/ItemDetails?id=${matchId}`}>
                                          <Eye className="w-3.5 h-3.5" />
                                          View Details
                                        </Link>
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          {lostReports.length === 0 ? (
            <EmptyState icon={ShieldAlert} message="No recovery cases yet." />
          ) : (
            <div className="space-y-4">
              {lostReports.map((report) => {
                const recoveryCase = recoveryCasesByReportId[report.id];
                return (
                  <div key={report.id} className="surface-card">
                    <div className="p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">{report.item_type}</h3>
                            {recoveryCase ? <StatusBadge status={recoveryCase.status} /> : <Badge variant="outline">open</Badge>}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {recoveryCase?.status === "match_identified" && "A possible item match is available."}
                            {recoveryCase?.status === "claim_in_review" && "Your ownership claim is under review."}
                            {recoveryCase?.status === "pickup_ready" && "Your item is ready for pickup."}
                            {(!recoveryCase || recoveryCase?.status === "open") && "Staff are checking likely locations."}
                            {recoveryCase?.status === "returned" && "Your item has been returned."}
                          </p>
                          {recoveryCase?.likely_zone_summaries?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {recoveryCase.likely_zone_summaries.map((zone) => (
                                <Badge key={zone} variant="outline" className="bg-muted">{zone}</Badge>
                              ))}
                            </div>
                          )}
                          {(() => {
                            // Surface the issued claim code here too: find an approved claim for
                            // one of this report's matched found items that has a pickup pass.
                            const linkedClaim = (report.matched_items || [])
                              .map((m) => claimByFoundItemId[typeof m === "string" ? m : (m?.found_item_id || m?.foundItemId)])
                              .find((c) => c && c.status === "approved" && (c.return_pass_id || c.returnPassId));
                            if (!linkedClaim) return null;
                            const passId = linkedClaim.return_pass_id || linkedClaim.returnPassId;
                            return (
                              <div className="mt-3">
                                <Button asChild size="sm" variant="outline" className="border-emerald-300 bg-card text-emerald-900 hover:bg-emerald-50 gap-1.5 dark:text-emerald-300">
                                  <Link to={getPickupPassRoute(passId)}>
                                    <Ticket className="w-4 h-4" />
                                    {t("pickup_pass.view_pass", "View claim code")}
                                  </Link>
                                </Button>
                              </div>
                            );
                          })()}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await appClient.recoveryCases.refreshByLostReport(report.id);
                            queryClient.invalidateQueries({ queryKey: ["userRecoveryCases"] });
                          }}
                        >
                          Refresh plan
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-4">
          {clLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <EmptyState icon={FileCheck} message={t("user_dashboard.no_claims")} />
          ) : (
            <div className="space-y-4">
              {claims.map(claim => (
                <div key={claim.id} className="archive-card hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center shadow-inner">
                        <img
                          src={getPrimaryRecordPhoto(claim, foundItemsById[claim.found_item_id])}
                          alt={claim.found_item_title || "Claim"}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <StatusBadge status={claim.status} />
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold text-lg text-foreground leading-tight">
                            {claim.found_item_title || t("common.claim")}
                          </h3>
                          <span className="text-xs text-muted-foreground font-semibold">
                            {t("user_dashboard.submitted_on", {
                              date: claim.created_date ? formatLocalizedDate(claim.created_date, "MMM d, yyyy") : t("home.no_date"),
                            })}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">{claim.reason}</p>

                        {claim.admin_notes && (
                          <div className="mt-2.5 text-xs bg-blue-50/50 border border-blue-100/50 text-blue-800 p-3 rounded-lg flex items-start gap-2.5">
                            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-blue-900">{t("user_dashboard.admin_note_label", "Admin Update:")}</span>{" "}
                              {claim.admin_notes}
                            </div>
                          </div>
                        )}

                        {["need_more_info", "under_review", "submitted", "pending_review"].includes(claim.status) && (
                          <ClaimCaseMessageThread claim={claim} viewerRole="claimant" className="mt-4" />
                        )}

                        {/* Approved claims requiring pickup confirmation */}
                        {claim.status === "approved" && !claim.received_confirmed_at && (
                          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                            <div>
                              <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {t("user_dashboard.received_question")}
                              </p>
                              <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                                {t("user_dashboard.received_description")}
                              </p>
                            </div>
                            {(() => {
                              const passNotification = findReturnPassNotificationForClaim(notifications, claim);
                              // Prefer the pass linked directly to the claim (set when the
                              // claim is approved); fall back to the notification link.
                              const passId = claim.return_pass_id || claim.returnPassId || getReturnPassIdFromNotification(passNotification || {});
                              if (!passId) {
                                return null;
                              }
                              return (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-300 bg-card text-emerald-900 hover:bg-emerald-50 gap-1.5"
                                >
                                  <Link to={getPickupPassRoute(passId)}>
                                    <Ticket className="w-4 h-4" />
                                    {t("pickup_pass.view_pass")}
                                  </Link>
                                </Button>
                              );
                            })()}
                            <p className="rounded-lg border border-emerald-200 bg-card px-3 py-2 text-xs leading-5 text-emerald-900">
                              Pickup completion is recorded by staff at the Pickup Station after they verify the Return Pass code.
                            </p>
                          </div>
                        )}

                        {claim.received_confirmed_at && (
                          <div className="mt-3 bg-emerald-50/30 border border-emerald-100 text-emerald-800 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>
                              {t("user_dashboard.confirmed_received", {
                                date: formatLocalizedDate(claim.received_confirmed_at, "MMM d, yyyy"),
                              })}
                            </span>
                          </div>
                        )}

                        {/* Interactive Feedback / Star rating section */}
                        {(claim.status === "completed" || claim.received_confirmed_at) && (
                          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/30 p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  {t("user_dashboard.leave_rating")}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {t("user_dashboard.rating_reviewed")}
                                </p>
                              </div>
                              {claim.review_status && (
                                <Badge
                                  className={`text-xs px-2 py-0.5 ${
                                    claim.review_status === "approved"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      : claim.review_status === "rejected"
                                        ? "bg-red-100 text-red-800 border-red-200"
                                        : "bg-amber-100 text-amber-800 border-amber-200"
                                  }`}
                                  variant="outline"
                                >
                                  {t("user_dashboard.review_status", {
                                    status: translateStatus(t, claim.review_status),
                                  })}
                                </Badge>
                              )}
                            </div>

                            <div className="flex gap-1">
                              {Array.from({ length: 5 }).map((_, index) => {
                                const draft = reviewDrafts[claim.id] || {
                                  rating: claim.claimant_rating || 0,
                                  review: claim.claimant_review || "",
                                };
                                const filled = index < draft.rating;
                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    className="rounded-md p-1 transition hover:bg-amber-100 hover:scale-110 active:scale-95 duration-150"
                                    aria-label={t("user_dashboard.rate_stars", { count: index + 1 })}
                                    disabled={claim.review_status === "pending" || claim.review_status === "approved"}
                                    onClick={() =>
                                      setReviewDrafts((prev) => ({
                                        ...prev,
                                        [claim.id]: {
                                          rating: index + 1,
                                          review: prev[claim.id]?.review ?? claim.claimant_review ?? "",
                                        },
                                      }))
                                    }
                                  >
                                    <Star
                                      className={`w-6 h-6 transition-all duration-200 ${
                                        filled ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.35)]" : "text-muted-foreground/50 hover:text-amber-300"
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>

                            <Textarea
                              rows={3}
                              className="bg-card border-border focus-visible:ring-amber-400 placeholder:text-muted-foreground text-sm leading-relaxed rounded-lg"
                              placeholder={t("user_dashboard.rating_placeholder")}
                              disabled={claim.review_status === "pending" || claim.review_status === "approved"}
                              value={reviewDrafts[claim.id]?.review ?? claim.claimant_review ?? ""}
                              onChange={(event) =>
                                setReviewDrafts((prev) => ({
                                  ...prev,
                                  [claim.id]: {
                                    rating: prev[claim.id]?.rating ?? claim.claimant_rating ?? 0,
                                    review: event.target.value,
                                  },
                                }))
                              }
                            />

                            {claim.review_status === "approved" && claim.claimant_review && (
                              <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                {t("user_dashboard.review_visible")}
                              </p>
                            )}
                            {claim.review_status === "pending" && (
                              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 animate-pulse">
                                <Clock className="w-4 h-4 text-amber-600" />
                                {t("user_dashboard.review_pending")}
                              </p>
                            )}
                            {claim.review_status === "rejected" && (
                              <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                {t("user_dashboard.review_rejected")}
                              </p>
                            )}

                            {claim.review_status !== "pending" && (claim.review_status !== "approved" || !claim.claimant_rating) && (
                              <Button
                                size="sm"
                                className="bg-amber-500 hover:bg-amber-600 text-white font-medium gap-1.5 px-4 rounded-lg shadow-sm transition-all"
                                disabled={
                                  submitReviewMutation.isPending ||
                                  ((reviewDrafts[claim.id]?.rating ?? claim.claimant_rating ?? 0) < 1)
                                }
                                onClick={() =>
                                  submitReviewMutation.mutate({
                                    claim,
                                    rating: reviewDrafts[claim.id]?.rating ?? claim.claimant_rating ?? 0,
                                    review: reviewDrafts[claim.id]?.review ?? claim.claimant_review ?? "",
                                  })
                                }
                              >
                                {submitReviewMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Star className="w-4 h-4" />
                                )}
                                {t("user_dashboard.submit_rating")}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      <Link to={`/ItemDetails?id=${claim.found_item_id}`} className="self-start">
                        <Button variant="outline" size="sm" className="gap-1.5 border-border text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          {t("common.view_item")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {notifLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} message={t("user_dashboard.no_notifications")} />
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => {
                const passId = getReturnPassIdFromNotification(notif);
                const pickupRoute = passId ? getPickupPassRoute(passId) : "";
                const safeMessage = sanitizeNotificationMessage(notif.message);

                return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    pickupRoute ? "cursor-pointer" : ""
                  } ${
                    notif.is_read
                      ? "bg-card border-border hover:bg-muted/50"
                      : "bg-blue-50/30 border-blue-100 hover:bg-blue-50/50 shadow-sm"
                  }`}
                  onClick={() => {
                    if (!notif.is_read) {
                      markReadMutation.mutate(notif.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-lg shrink-0 ${notif.is_read ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-600"}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${notif.is_read ? "text-muted-foreground" : "text-foreground font-bold"}`}>{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{safeMessage}</p>
                      {pickupRoute && (
                        <Button asChild size="sm" variant="link" className="mt-2 h-auto p-0 text-emerald-700">
                          <Link to={pickupRoute} onClick={(event) => event.stopPropagation()}>
                            {t("pickup_pass.open_secure_pass")}
                          </Link>
                        </Button>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                      {notif.created_date ? formatLocalizedDate(notif.created_date, "MMM d") : ""}
                    </span>
                  </div>
                </div>
              )})}
            </div>
          )}
        </TabsContent>

        {/* Saved Tab */}
        <TabsContent value="saved" className="space-y-6">
          {/* Saved Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Saved Items</h3>
            {savedItemData.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Browse found items to save them</p>
                <Link to="/Search">
                  <Button variant="outline" size="sm" className="mt-4">Browse Items</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedItemData.map(item => (
                  <div key={item.id} className="archive-card p-4">
                    <div className="flex gap-3">
                      <RecordThumbnail src={item.photo_urls?.[0]} alt={item.title} />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.location_found}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline">{item.status}</Badge>
                          <Link to={`/ItemDetails?id=${item.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Searches */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Saved Searches</h3>
            {savedSearches.length === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Save a search from the Search page to see it here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedSearches.map(item => (
                  <div key={item.id} className="soft-panel p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.query || "Saved filters"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/Search?q=${encodeURIComponent(item.query || "")}`}>
                        <Button size="sm" variant="outline">Search</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSavedSearch(item.id)}
                        aria-label="Delete saved search"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {clLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : claims.length === 0 ? (
            <EmptyState icon={MessageSquare} message="No case messages yet. Messages appear here when you have an active claim." />
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Messages between you and staff about your active claims. Staff may request more information or share updates here.
              </p>
              {claims.map((claim) => (
                <div key={claim.id} className="archive-card overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 bg-muted/40">
                    <div className="relative shrink-0 h-9 w-9 rounded-lg overflow-hidden border border-border bg-muted">
                      <img
                        src={getPrimaryRecordPhoto(claim, foundItemsById[claim.found_item_id])}
                        alt={claim.found_item_title || "Claim"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {claim.found_item_title || t("common.claim")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Claim submitted {claim.created_date ? formatLocalizedDate(claim.created_date, "MMM d, yyyy") : ""}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>
                  <div className="px-5 py-4">
                    <ClaimCaseMessageThread claim={claim} viewerRole="claimant" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
