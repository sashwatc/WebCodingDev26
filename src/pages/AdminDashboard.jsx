/**
 * FindBack AI - Admin Dashboard
 * Central admin hub with overview metrics, moderation queue,
 * claims management, lost reports, and audit logs.
 * Access is protected by the admin route guard in the standalone judging build.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminItemsQueue from "@/components/admin/AdminItemsQueue";
import AdminClaimsQueue from "@/components/admin/AdminClaimsQueue";
import RecordThumbnail from "@/components/shared/RecordThumbnail";
import StatusBadge from "@/components/ui/StatusBadge";
import { getPrimaryRecordPhoto } from "@/lib/media";
import { formatLocalizedDate, translateLocation, translateUrgency } from "@/lib/i18n-helpers";
import {
  LayoutDashboard,
  Package,
  FileCheck,
  AlertTriangle,
  Radar,
  ShieldCheck,
  Route,
} from "lucide-react";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("overview");
  const { data: foundItems = [], isLoading: fiLoading } = useQuery({
    queryKey: ["adminFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 500),
  });

  const { data: lostReports = [], isLoading: lrLoading } = useQuery({
    queryKey: ["adminLostReports"],
    queryFn: () => appClient.entities.LostReport.list("-created_date", 500),
  });

  const { data: claims = [], isLoading: clLoading } = useQuery({
    queryKey: ["adminClaims"],
    queryFn: () => appClient.entities.Claim.list("-created_date", 500),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: () => appClient.entities.AuditLog.list("-created_date", 100),
  });

  const { data: recoveryCases = [] } = useQuery({
    queryKey: ["adminRecoveryCases"],
    queryFn: () => appClient.recoveryMesh.recoveryCases(),
  });

  const { data: recoveryMissions = [] } = useQuery({
    queryKey: ["adminRecoveryMissions", recoveryCases.map((entry) => entry.id).join(",")],
    queryFn: async () => {
      const groups = await Promise.all(recoveryCases.map((entry) => appClient.recoveryMesh.missions(entry.id)));
      return groups.flat();
    },
    enabled: recoveryCases.length > 0,
  });

  const { data: sentinelAlerts = [] } = useQuery({
    queryKey: ["adminSentinelAlerts"],
    queryFn: () => appClient.recoveryMesh.sentinelAlerts(),
  });

  const { data: partnerRelays = [] } = useQuery({
    queryKey: ["adminPartnerRelays"],
    queryFn: () => appClient.recoveryMesh.partnerRelays(),
  });

  const { data: assetDemo } = useQuery({
    queryKey: ["adminAssetDemoLookup"],
    queryFn: () => appClient.recoveryMesh.assetLookup("PVHS-CB-1042"),
  });

  const updateMissionMutation = useMutation({
    mutationFn: ({ id, updates }) => appClient.recoveryMesh.updateMission(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminRecoveryMissions"] }),
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, updates }) => appClient.recoveryMesh.updateSentinelAlert(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminSentinelAlerts"] }),
  });

  const isLoading = fiLoading || lrLoading || clLoading;
  const pendingCount = foundItems.filter((item) => item.status === "pending_review").length;
  const pendingClaims = claims.filter((claim) => claim.status === "submitted" || claim.review_status === "pending").length;
  const openReports = lostReports.filter((report) => report.status === "open").length;
  const EmptyAdminPanel = ({ icon: Icon, title, description }) => (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-slate-800 dark:bg-slate-900/30">
      <Icon className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen py-10">
      <div className="page-shell max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="page-header">
            <span className="page-kicker text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{t("admin_dashboard.kicker")}</span>
            <h1 className="page-title text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">{t("admin_dashboard.title")}</h1>
            <p className="page-subtitle text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">{t("admin_dashboard.subtitle")}</p>
          </div>
        </div>

        {/* Simplified stats card row */}
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { label: t("admin_dashboard.pending_items", "Pending Items"), value: pendingCount, color: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/5 dark:text-amber-400" },
            { label: t("admin_dashboard.pending_claims", "Pending Claims"), value: pendingClaims, color: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/5 dark:text-indigo-400" },
            { label: t("admin_dashboard.open_reports", "Open Reports"), value: openReports, color: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/5 dark:text-sky-400" },
          ].map((stat) => (
            <div key={stat.label} className={`border p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 ${stat.color} shadow-sm`}>
              <p className="text-4xl font-extrabold tracking-tight">{stat.value}</p>
              <p className="mt-1.5 text-sm font-semibold uppercase tracking-wider opacity-90">{stat.label}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-900" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl bg-slate-100 dark:bg-slate-900" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-1 rounded-xl mb-6 flex w-fit gap-1 shadow-inner">
              <TabsTrigger
                value="overview"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t("admin_dashboard.overview", "Command Center")}
              </TabsTrigger>
              <TabsTrigger
                value="moderation"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <Package className="h-4 w-4" />
                {t("admin_dashboard.moderation", "Moderation Queue")}
                {(pendingCount + pendingClaims) > 0 && (
                  <Badge className="bg-amber-500 text-white dark:text-slate-950 font-bold text-[10px] px-2 py-0.5 border-none shadow-sm ml-1">
                    {pendingCount + pendingClaims}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {t("admin_dashboard.lost_reports", "Reference Desk")}
                {openReports > 0 && (
                  <Badge className="bg-sky-500 text-white dark:text-slate-950 font-bold text-[10px] px-2 py-0.5 border-none shadow-sm ml-1">
                    {openReports}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="recovery"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <Radar className="h-4 w-4" />
                Recovery Center
              </TabsTrigger>
              <TabsTrigger
                value="sentinel"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Loss Sentinel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminOverview foundItems={foundItems} lostReports={lostReports} claims={claims} auditLogs={auditLogs} />
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Column 1: Items Queue */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-500" />
                      {t("admin_dashboard.found_items_queue", "Found Items Review")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {t("admin_dashboard.found_items_queue_desc", "Approve or reject newly submitted found items before they go public.")}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm">
                    <AdminItemsQueue items={foundItems} filterStatus="pending_review" />
                  </div>
                </div>

                {/* Column 2: Claims Queue */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                      {t("admin_dashboard.claims_queue", "Claims Verification")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {t("admin_dashboard.claims_queue_desc", "Verify ownership proof and details to approve or reject student claims.")}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 shadow-sm">
                    <AdminClaimsQueue claims={claims} foundItems={foundItems} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("admin_dashboard.lost_reports")}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("admin_dashboard.reports_summary", { count: lostReports.length })}</p>
                </div>

                {lostReports.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-xl px-6 py-14 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500">{t("admin_dashboard.no_lost_reports")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lostReports.map((report) => (
                      <div key={report.id} className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <RecordThumbnail
                              src={getPrimaryRecordPhoto(report)}
                              alt={report.item_type || "Lost report"}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{report.item_type}</h3>
                                <StatusBadge status={report.status} />
                                {report.matched_items?.length > 0 && (
                                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/25">{t("admin_dashboard.matches", { count: report.matched_items.length })}</Badge>
                                )}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{report.description}</p>
                              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span>{report.contact_name}</span>
                                <span>{report.date_lost ? formatLocalizedDate(report.date_lost, "MMM d, yyyy") : t("common.not_available")}</span>
                                <span>{translateLocation(t, report.last_seen_location) || t("admin_dashboard.unknown_location")}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize self-start text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-500/20">{translateUrgency(t, report.urgency)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recovery" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recovery Cases</h2>
                  {recoveryCases.length === 0 ? (
                    <EmptyAdminPanel
                      icon={Radar}
                      title="No recovery cases available."
                      description="The current data set does not contain any active recovery case records."
                    />
                  ) : (
                    recoveryCases.map((recoveryCase) => (
                      <div key={recoveryCase.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{recoveryCase.summary || recoveryCase.case_code}</p>
                            <p className="mt-1 text-xs text-slate-500">{recoveryCase.case_code} · {recoveryCase.priority}</p>
                          </div>
                          <StatusBadge status={recoveryCase.status} />
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">{recoveryCase.recovery_plan}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recovery Missions</h2>
                  {recoveryMissions.length === 0 ? (
                    <EmptyAdminPanel
                      icon={ShieldCheck}
                      title="No recovery missions available."
                      description="The current data set does not contain any mission records."
                    />
                  ) : (
                    recoveryMissions.map((mission) => (
                      <div key={mission.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{mission.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{mission.zone_label} · {mission.score}%</p>
                          </div>
                          <StatusBadge status={mission.status} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:border-primary hover:text-primary"
                            onClick={() => updateMissionMutation.mutate({ id: mission.id, updates: { assigned_to: "avery.patel@pleasantvalley.edu" } })}
                          >
                            Assign
                          </button>
                          {["checked", "possible_item_found", "escalated", "completed", "dismissed"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary"
                              onClick={() => updateMissionMutation.mutate({ id: mission.id, updates: { status } })}
                            >
                              {status.replaceAll("_", " ")}
                            </button>
                          ))}
                        </div>
                        {mission.assigned_to && <p className="mt-2 text-xs text-slate-500">Assigned to {mission.assigned_to}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  <Route className="h-5 w-5 text-primary" />
                  Partner Relay Simulation
                </h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {partnerRelays.length === 0 ? (
                    <EmptyAdminPanel
                      icon={Route}
                      title="No partner relays available."
                      description="The current data set does not contain any partner relay records."
                    />
                  ) : (
                    partnerRelays.map((relay) => (
                      <div key={relay.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{relay.public_summary}</p>
                        <p className="mt-2 text-xs text-slate-500">Demo/integration-ready simulation · {relay.status}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(relay.redacted_match_reasons || []).map((reason) => <Badge key={reason} variant="outline">{reason}</Badge>)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Asset Rescue Bridge</h2>
                <p className="mt-1 text-sm text-slate-500">Seeded adapter only. Recognized school assets are restricted from public search and routed internally.</p>
                {assetDemo?.recognized && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    {assetDemo.asset_tag} · {assetDemo.asset_type} recognized by seeded demo adapter.
                  </div>
                )}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {foundItems.filter((item) => item.asset_tag || item.restricted_visibility).length === 0 ? (
                    <EmptyAdminPanel
                      icon={ShieldCheck}
                      title="No restricted assets available."
                      description="The current data set does not contain any restricted asset intake records."
                    />
                  ) : (
                    foundItems.filter((item) => item.asset_tag || item.restricted_visibility).map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.asset_tag || "restricted item"} · {item.status}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sentinel" className="space-y-4">
              {sentinelAlerts.length === 0 ? (
                <EmptyAdminPanel
                  icon={AlertTriangle}
                  title="No Loss Sentinel alerts available."
                  description="The current data set does not contain any active prevention alerts."
                />
              ) : (
                sentinelAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{alert.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{alert.category} · observed {alert.observed_count} vs baseline {alert.baseline_count}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{alert.severity}</Badge>
                    </div>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">Reasons</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {(alert.reasons || []).map((reason) => <li key={reason}>{reason}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">Suggested actions</p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-600">
                          {(alert.suggested_actions || []).map((action) => <li key={action}>{action}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab("recovery")}
                      >
                        Create recovery mission
                      </Button>
                      {["acknowledged", "resolved", "dismissed"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          onClick={() => updateAlertMutation.mutate({ id: alert.id, updates: { status } })}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
