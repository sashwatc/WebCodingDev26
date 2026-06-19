/**
 * FindBack AI - Admin Dashboard
 * Central admin hub with overview metrics, moderation queue,
 * claims management, lost reports, and audit logs.
 * Access is protected by the admin route guard in the standalone judging build.
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";

export default function AdminDashboard() {
  const { t } = useTranslation();
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

  const isLoading = fiLoading || lrLoading || clLoading;
  const pendingCount = foundItems.filter((item) => item.status === "pending_review").length;
  const pendingClaims = claims.filter((claim) => claim.status === "submitted" || claim.review_status === "pending").length;
  const openReports = lostReports.filter((report) => report.status === "open").length;

  return (
    <div className="dark bg-slate-950 text-slate-100 min-h-screen py-10">
      <div className="page-shell max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="page-header">
            <span className="page-kicker text-indigo-400 font-bold uppercase tracking-wider">{t("admin_dashboard.kicker")}</span>
            <h1 className="page-title text-4xl font-extrabold text-white tracking-tight mt-1">{t("admin_dashboard.title")}</h1>
            <p className="page-subtitle text-slate-400 mt-2 max-w-2xl">{t("admin_dashboard.subtitle")}</p>
          </div>
        </div>

        {/* Simplified stats card row */}
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { label: t("admin_dashboard.pending_items", "Pending Items"), value: pendingCount, color: "border-amber-500/25 bg-amber-500/5 text-amber-400" },
            { label: t("admin_dashboard.pending_claims", "Pending Claims"), value: pendingClaims, color: "border-indigo-500/25 bg-indigo-500/5 text-indigo-400" },
            { label: t("admin_dashboard.open_reports", "Open Reports"), value: openReports, color: "border-sky-500/25 bg-sky-500/5 text-sky-400" },
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
                <Skeleton key={index} className="h-28 rounded-xl bg-slate-900" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl bg-slate-900" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-slate-900 border border-slate-800/80 p-1 rounded-xl mb-6 flex w-fit gap-1 shadow-inner">
              <TabsTrigger
                value="overview"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t("admin_dashboard.overview", "Command Center")}
              </TabsTrigger>
              <TabsTrigger
                value="moderation"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <Package className="h-4 w-4" />
                {t("admin_dashboard.moderation", "Moderation Queue")}
                {(pendingCount + pendingClaims) > 0 && (
                  <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 border-none shadow-sm ml-1">
                    {pendingCount + pendingClaims}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {t("admin_dashboard.lost_reports", "Reference Desk")}
                {openReports > 0 && (
                  <Badge className="bg-sky-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 border-none shadow-sm ml-1">
                    {openReports}
                  </Badge>
                )}
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
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-500" />
                      {t("admin_dashboard.found_items_queue", "Found Items Review")}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {t("admin_dashboard.found_items_queue_desc", "Approve or reject newly submitted found items before they go public.")}
                    </p>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 shadow-sm">
                    <AdminItemsQueue items={foundItems} filterStatus="pending_review" />
                  </div>
                </div>

                {/* Column 2: Claims Queue */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-indigo-400" />
                      {t("admin_dashboard.claims_queue", "Claims Verification")}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {t("admin_dashboard.claims_queue_desc", "Verify ownership proof and details to approve or reject student claims.")}
                    </p>
                  </div>
                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-4 shadow-sm">
                    <AdminClaimsQueue claims={claims} foundItems={foundItems} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-4">
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-100">{t("admin_dashboard.lost_reports")}</p>
                  <p className="mt-2 text-sm text-slate-400">{t("admin_dashboard.reports_summary", { count: lostReports.length })}</p>
                </div>

                {lostReports.length === 0 ? (
                  <div className="bg-slate-900/30 border border-slate-800/80 rounded-xl px-6 py-14 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-sm text-slate-500">{t("admin_dashboard.no_lost_reports")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lostReports.map((report) => (
                      <div key={report.id} className="bg-slate-900/30 border border-slate-800/80 rounded-xl p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <RecordThumbnail
                              src={getPrimaryRecordPhoto(report)}
                              alt={report.item_type || "Lost report"}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-slate-100">{report.item_type}</h3>
                                <StatusBadge status={report.status} />
                                {report.matched_items?.length > 0 && (
                                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/25">{t("admin_dashboard.matches", { count: report.matched_items.length })}</Badge>
                                )}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-400">{report.description}</p>
                              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span>{report.contact_name}</span>
                                <span>{report.date_lost ? formatLocalizedDate(report.date_lost, "MMM d, yyyy") : t("common.not_available")}</span>
                                <span>{translateLocation(t, report.last_seen_location) || t("admin_dashboard.unknown_location")}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize self-start text-indigo-400 border-indigo-500/20">{translateUrgency(t, report.urgency)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
