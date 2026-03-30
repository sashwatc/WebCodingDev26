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
  ClipboardList,
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
    <div className="page-shell py-8">
      <div className="mb-8">
        <div className="page-header">
          <span className="page-kicker">{t("admin_dashboard.kicker")}</span>
          <h1 className="page-title">{t("admin_dashboard.title")}</h1>
          <p className="page-subtitle">{t("admin_dashboard.subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: t("admin_dashboard.pending_items"), value: pendingCount },
            { label: t("admin_dashboard.pending_claims"), value: pendingClaims },
            { label: t("admin_dashboard.open_reports"), value: openReports },
          ].map((stat) => (
            <div key={stat.label} className="stat-panel">
              <p className="text-2xl font-semibold text-slate-950">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-none">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              {t("admin_dashboard.overview")}
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2">
              <Package className="h-4 w-4" />
              {t("admin_dashboard.items")}
              {pendingCount > 0 && <Badge variant="outline">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="claims" className="gap-2">
              <FileCheck className="h-4 w-4" />
              {t("admin_dashboard.claims")}
              {pendingClaims > 0 && <Badge variant="outline">{pendingClaims}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t("admin_dashboard.lost_reports")}
              {openReports > 0 && <Badge variant="outline">{openReports}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              {t("admin_dashboard.audit_log")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview foundItems={foundItems} lostReports={lostReports} claims={claims} auditLogs={auditLogs} />
          </TabsContent>

          <TabsContent value="items">
            <AdminItemsQueue items={foundItems} />
          </TabsContent>

          <TabsContent value="claims">
            <AdminClaimsQueue claims={claims} foundItems={foundItems} />
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
              <div className="surface-card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("admin_dashboard.lost_reports")}</p>
                <p className="mt-2 text-sm text-slate-600">{t("admin_dashboard.reports_summary", { count: lostReports.length })}</p>
              </div>

              {lostReports.length === 0 ? (
                <div className="surface-card px-6 py-14 text-center">
                  <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm text-slate-500">{t("admin_dashboard.no_lost_reports")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lostReports.map((report) => (
                    <div key={report.id} className="surface-card p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <RecordThumbnail
                            src={getPrimaryRecordPhoto(report)}
                            alt={report.item_type || "Lost report"}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-950">{report.item_type}</h3>
                              <StatusBadge status={report.status} />
                              {report.matched_items?.length > 0 && (
                                <Badge variant="secondary">{t("admin_dashboard.matches", { count: report.matched_items.length })}</Badge>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{report.description}</p>
                            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">
                              {report.contact_name} • {report.date_lost ? formatLocalizedDate(report.date_lost, "MMM d, yyyy") : t("common.not_available")} • {translateLocation(t, report.last_seen_location) || t("admin_dashboard.unknown_location")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize self-start">{translateUrgency(t, report.urgency)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs">
            {auditLogs.length === 0 ? (
              <div className="surface-card px-6 py-14 text-center">
                <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500">{t("admin_dashboard.no_audit_logs")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="surface-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">{log.action}</p>
                        <p className="mt-1 text-sm text-slate-600">{log.details}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{log.performed_by}</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {log.created_date ? formatLocalizedDate(log.created_date, "MMM d, h:mm a") : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
