/**
 * FindBack AI - User Dashboard
 * Students/staff can track submitted lost reports, claim history,
 * AI match suggestions, and notification updates.
 */

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import StatusBadge from "@/components/ui/StatusBadge";
import RecordThumbnail from "@/components/shared/RecordThumbnail";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { getPrimaryRecordPhoto } from "@/lib/media";
import { formatLocalizedDate, translateStatus } from "@/lib/i18n-helpers";
import {
  AlertTriangle, FileCheck, Bell, Eye,
  Brain, CheckCircle2, Loader2, Star,
  ShieldAlert, Clock, Sparkles, ArrowRight
} from "lucide-react";

export default function UserDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user, navigateToLogin } = useAuth();
  const { toast } = useToast();
  const [reviewDrafts, setReviewDrafts] = useState({});

  // Fetch user's lost reports
  const { data: lostReports = [], isLoading: lrLoading } = useQuery({
    queryKey: ["userLostReports", user?.email],
    queryFn: () => appClient.entities.LostReport.filter({ contact_email: user.email }),
    enabled: !!user?.email,
  });

  // Fetch user's claims
  const { data: claims = [], isLoading: clLoading } = useQuery({
    queryKey: ["userClaims", user?.email],
    queryFn: () => appClient.entities.Claim.filter({ claimant_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: foundItems = [] } = useQuery({
    queryKey: ["dashboardFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 500),
    enabled: !!user?.email,
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

  const confirmReceivedMutation = useMutation({
    mutationFn: async (claim) => {
      await appClient.claims.complete(claim);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: t("user_dashboard.return_confirmed"),
        description: t("user_dashboard.return_confirmed_message"),
      });
    },
    onError: (error) => {
      toast({
        title: t("user_dashboard.unable_to_confirm"),
        description: error.message || t("navbar.please_try_again"),
        variant: "destructive",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({ claim, rating, review }) => {
      const submittedAt = new Date().toISOString();

      await appClient.claims.updateWorkflow(claim, {
        claimant_rating: rating,
        claimant_review: review.trim(),
        review_status: "pending",
        review_submitted_at: submittedAt,
        review_reviewed_at: "",
      });

      await appClient.entities.FoundItem.upsertRating(claim.found_item_id, {
        claim_id: claim.id,
        rating,
        review: review.trim(),
        claimant_name: claim.claimant_name,
        reviewer_email: claim.claimant_email,
        review_status: "pending",
        review_submitted_at: submittedAt,
        review_reviewed_at: "",
      });
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
      foundItems.reduce((itemsById, item) => {
        itemsById[item.id] = item;
        return itemsById;
      }, {}),
    [foundItems]
  );

  const recoveryCasesByReportId = useMemo(
    () =>
      recoveryCases.reduce((casesByReportId, recoveryCase) => {
        casesByReportId[recoveryCase.lost_report_id] = recoveryCase;
        return casesByReportId;
      }, {}),
    [recoveryCases]
  );

  const EmptyState = ({ icon: Icon, message }) => (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("user_dashboard.sign_in_title")}</h1>
            <p className="text-slate-500 mb-6">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-6xl py-10 space-y-8">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="page-kicker">{t("user_dashboard.kicker", "Personal Command Center")}</span>
          <h1 className="page-title text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            {t("user_dashboard.title", "My Account Dashboard")}
          </h1>
          <p className="page-subtitle mt-2 max-w-2xl text-slate-500">
            {t("user_dashboard.welcome", {
              suffix: user?.full_name ? `, ${user.full_name.split(" ")[0]}` : "",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/Search">
            <Button className="bg-primary hover:bg-primary/95 text-white gap-2 font-medium px-5 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02]">
              <Eye className="w-4 h-4" />
              {t("user_dashboard.browse_items", "Browse Lost & Found")}
            </Button>
          </Link>
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
              <p className="text-3xl font-extrabold text-slate-900">{lostReports.length}</p>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">{t("user_dashboard.lost_reports")}</p>
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
              <p className="text-3xl font-extrabold text-slate-900">
                {claims.filter(c => !["completed", "rejected"].includes(c.status)).length}
              </p>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">{t("user_dashboard.active_claims")}</p>
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
              <p className="text-3xl font-extrabold text-slate-900">
                {notifications.filter(n => !n.is_read).length}
              </p>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">{t("user_dashboard.unread_alerts")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl mb-6 flex w-fit border border-slate-200/50">
          <TabsTrigger
            value="reports"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            {t("user_dashboard.tab_reports")}
          </TabsTrigger>
          <TabsTrigger
            value="claims"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            {t("user_dashboard.tab_claims")}
          </TabsTrigger>
          <TabsTrigger
            value="recovery"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            Recovery Cases
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            {t("user_dashboard.tab_notifications")}
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="ml-2 w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
            )}
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
                <Card key={report.id} className="hover:shadow-md transition-all duration-300 border-slate-200/90 overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 relative">
                          <RecordThumbnail
                            src={getPrimaryRecordPhoto(report)}
                            alt={report.item_type || "Lost report"}
                            className="w-16 h-16 rounded-lg object-cover border border-slate-100 shadow-sm"
                          />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-slate-900 text-lg leading-tight">{report.item_type}</h3>
                            <StatusBadge status={report.status} />
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed max-w-xl">{report.description}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400 font-medium">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
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
                          <Badge className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold border border-purple-200/50 flex items-center gap-1.5 py-1 px-3 rounded-full text-xs shadow-sm transition-all duration-300">
                            <Brain className="w-3.5 h-3.5 animate-pulse text-purple-700" />
                            {t("user_dashboard.matches", { count: report.matched_items.length })}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* AI Suggestions Accordion-style layout */}
                    {report.matched_items?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 bg-purple-50/20 -mx-5 -mb-5 px-5 py-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                          <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                            {t("user_dashboard.ai_suggested_matches", "AI-Suggested Found Matches")}
                          </h4>
                        </div>
                        <p className="text-xs text-purple-800 mb-3">
                          {t("user_dashboard.ai_suggested_matches_desc", "We found matching items reported around the same time or location. Select one to view or claim:")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {report.matched_items.map(match => {
                            const matchId = typeof match === "string" ? match : (match?.found_item_id || match?.foundItemId);
                            const matchedItem = foundItemsById[matchId];
                            if (!matchedItem) return null;
                            return (
                              <Link
                                key={matchId}
                                to={`/ItemDetails?id=${matchId}`}
                                className="flex items-center gap-2.5 bg-white hover:bg-purple-50 border border-purple-200/80 px-3 py-2 rounded-lg transition-all text-xs font-semibold text-purple-950 hover:border-purple-300 shadow-sm"
                              >
                                <RecordThumbnail
                                  src={matchedItem.photo_urls?.[0]}
                                  alt={matchedItem.title}
                                  className="w-6 h-6 rounded-md object-cover shrink-0 border border-slate-100"
                                />
                                <span>{matchedItem.title}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-purple-600 transition-transform group-hover:translate-x-0.5" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                  <Card key={report.id} className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{report.item_type}</h3>
                            {recoveryCase ? <StatusBadge status={recoveryCase.status} /> : <Badge variant="outline">open</Badge>}
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {recoveryCase?.status === "match_identified" && "A possible item match is available."}
                            {recoveryCase?.status === "claim_in_review" && "Your ownership claim is under review."}
                            {recoveryCase?.status === "pickup_ready" && "Your item is ready for pickup."}
                            {(!recoveryCase || recoveryCase?.status === "open") && "Staff are checking likely locations."}
                            {recoveryCase?.status === "returned" && "Your item has been returned."}
                          </p>
                          {recoveryCase?.likely_zone_summaries?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {recoveryCase.likely_zone_summaries.map((zone) => (
                                <Badge key={zone} variant="outline" className="bg-slate-50">{zone}</Badge>
                              ))}
                            </div>
                          )}
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
                    </CardContent>
                  </Card>
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
                <Card key={claim.id} className="hover:shadow-md transition-all duration-300 border-slate-200/90 overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center shadow-inner">
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
                          <h3 className="font-bold text-lg text-slate-900 leading-tight">
                            {claim.found_item_title || t("common.claim")}
                          </h3>
                          <span className="text-xs text-slate-400 font-semibold">
                            {t("user_dashboard.submitted_on", {
                              date: claim.created_date ? formatLocalizedDate(claim.created_date, "MMM d, yyyy") : t("home.no_date"),
                            })}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed">{claim.reason}</p>

                        {claim.admin_notes && (
                          <div className="mt-2.5 text-xs bg-blue-50/50 border border-blue-100/50 text-blue-800 p-3 rounded-lg flex items-start gap-2.5">
                            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-blue-900">{t("user_dashboard.admin_note_label", "Admin Update:")}</span>{" "}
                              {claim.admin_notes}
                            </div>
                          </div>
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
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 px-4 rounded-lg shadow-sm"
                              disabled={confirmReceivedMutation.isPending}
                              onClick={() => confirmReceivedMutation.mutate(claim)}
                            >
                              {confirmReceivedMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              {t("user_dashboard.confirm_received")}
                            </Button>
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
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  {t("user_dashboard.leave_rating")}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
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
                                        filled ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.35)]" : "text-slate-300 hover:text-amber-300"
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>

                            <Textarea
                              rows={3}
                              className="bg-white border-slate-200 focus-visible:ring-amber-400 placeholder:text-slate-400 text-sm leading-relaxed rounded-lg"
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
                        <Button variant="outline" size="sm" className="gap-1.5 border-slate-200 text-slate-600 hover:text-slate-900 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                          {t("common.view_item")}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
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
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    notif.is_read
                      ? "bg-white border-slate-100 hover:bg-slate-50/50"
                      : "bg-blue-50/30 border-blue-100 hover:bg-blue-50/50 shadow-sm"
                  }`}
                  onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2 rounded-lg shrink-0 ${notif.is_read ? "bg-slate-100 text-slate-400" : "bg-blue-100 text-blue-600"}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${notif.is_read ? "text-slate-600" : "text-slate-900 font-bold"}`}>{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                      {notif.created_date ? formatLocalizedDate(notif.created_date, "MMM d") : ""}
                    </span>
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
