/**
 * FindBack AI - Admin Overview Tab
 * Displays key metrics, charts, and recent activity feed.
 *
 * Pure presentational dashboard: receives the raw datasets as props and derives
 * all stats/chart data locally (no data fetching or local state here). Renders
 * four KPI stat cards, an items-by-category bar chart, a status-distribution
 * pie chart, and a recent audit-log activity feed.
 *
 * Props:
 *  - foundItems:  array of found-item records (drive counts, categories, statuses)
 *  - lostReports: array of lost-report records (open-report count)
 *  - claims:      array of claim records (active-claim count)
 *  - auditLogs:   array of audit-log entries (recent activity feed)
 */

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  CheckCircle2,
  FileCheck,
  Clock,
  TrendingUp,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CATEGORIES } from "@/lib/constants";
import { formatLocalizedDate, translateCategory, translateStatus } from "@/lib/i18n-helpers";
import { canonicalFoundItemStatus } from "@/lib/found-items";

export default function AdminOverview({ foundItems, lostReports, claims, auditLogs }) {
  const { t } = useTranslation();
  // Found items use canonical statuses (FOUND/CLAIM_PENDING/VERIFIED/ARCHIVED),
  // so count against the canonical value rather than legacy lowercase strings.
  const canonicalCount = (status) =>
    foundItems.filter((item) => canonicalFoundItemStatus(item.status) === status).length;
  // Derived summary metrics powering the KPI cards and charts below.
  const stats = {
    total: foundItems.length,
    pending: canonicalCount("FOUND"),
    approved: canonicalCount("FOUND"),
    claimPending: canonicalCount("CLAIM_PENDING"),
    claimed: canonicalCount("VERIFIED"),
    returned: canonicalCount("ARCHIVED"),
    activeClaims: claims.filter((claim) => ["submitted", "under_review"].includes(claim.status)).length,
    openReports: lostReports.filter((report) => report.status === "open").length,
    // Percentage of all found items that have been archived (i.e. returned).
    returnRate: foundItems.length > 0
      ? Math.round((canonicalCount("ARCHIVED") / foundItems.length) * 100)
      : 0,
  };

  // Bar-chart data: item count per category, only non-empty, top 6 descending.
  const categoryData = CATEGORIES.map((category) => ({
    name: translateCategory(t, category.value).split(" ")[0],
    count: foundItems.filter((item) => item.category === category.value).length,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Pie-chart data: count per canonical status with a fixed color, empties dropped.
  const statusData = [
    { name: translateStatus(t, "FOUND"), value: stats.approved, color: "#10b981" },
    { name: translateStatus(t, "CLAIM_PENDING"), value: stats.claimPending, color: "#c98b12" },
    { name: translateStatus(t, "VERIFIED"), value: stats.claimed, color: "#2b5aa5" },
    { name: translateStatus(t, "ARCHIVED"), value: stats.returned, color: "#64748b" },
  ].filter((entry) => entry.value > 0);

  // Most recent 8 audit-log entries for the activity feed.
  const recentLogs = auditLogs.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPI stat cards: total items, pending review, items returned, active claims */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: t("admin_overview.total_items"),
            value: stats.total,
            helper: t("admin_overview.approved_helper", { count: stats.approved }),
            icon: Package,
          },
          {
            label: t("admin_overview.pending_review"),
            value: stats.pending,
            helper: t("admin_overview.open_lost_reports_helper", { count: stats.openReports }),
            icon: Clock,
          },
          {
            label: t("admin_overview.items_returned"),
            value: stats.returned,
            helper: t("admin_overview.return_rate_helper", { count: stats.returnRate }),
            icon: CheckCircle2,
          },
          {
            label: t("admin_overview.active_claims"),
            value: stats.activeClaims,
            helper: t("admin_overview.claimed_helper", { count: stats.claimed }),
            icon: FileCheck,
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-panel p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{stat.label}</p>
            <p className="mt-2 text-xs text-muted-foreground">{stat.helper}</p>
          </div>
        ))}
      </div>

      {/* Charts row: items-by-category bar chart and status-distribution pie chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Items by category bar chart */}
        <div className="surface-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-base font-semibold text-foreground">{t("admin_overview.items_by_category")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin_overview.items_by_category_description")}</p>
            </div>
          </div>

          {/* Render the chart, or an empty-state panel when no category data */}
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} margin={{ top: 10, right: 6, bottom: 4, left: -18 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(226,232,240,0.38)" }} />
                <Bar dataKey="count" fill="#17315f" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
              {t("admin_overview.no_category_data")}
            </div>
          )}
        </div>

        {/* Status distribution pie chart with legend + return-rate callout */}
        <div className="surface-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-base font-semibold text-foreground">{t("admin_overview.status_distribution")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin_overview.status_distribution_description")}</p>
            </div>
          </div>

          {/* Render the donut + legend, or an empty-state panel when no data */}
          {statusData.length > 0 ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* Donut chart */}
              <div className="h-[210px] w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={74} innerRadius={46}>
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend rows (color swatch + label + value) and return-rate box */}
              <div className="flex-1 space-y-3">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between soft-panel px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}

                {/* Return-rate summary callout */}
                <div className="rounded-xl border border-border bg-card px-4 py-4">
                  <p className="text-sm font-semibold text-foreground">{t("admin_overview.return_rate")}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{stats.returnRate}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
              {t("admin_overview.no_status_data")}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity feed (latest audit-log entries) */}
      <div className="surface-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-base font-semibold text-foreground">{t("admin_overview.recent_activity")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin_overview.recent_activity_description")}</p>
          </div>
        </div>

        {/* Render the log rows, or an empty-state when nothing is logged yet */}
        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 soft-panel px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{log.action}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{log.details}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{log.performed_by}</p>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {log.created_date ? formatLocalizedDate(log.created_date, "MMM d, h:mm a") : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            {t("admin_overview.no_activity_logged")}
          </div>
        )}
      </div>
    </div>
  );
}
