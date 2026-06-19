/**
 * FindBack AI - Admin Overview Tab
 * Displays key metrics, charts, and recent activity feed.
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
import { formatLocalizedDate, translateCategory } from "@/lib/i18n-helpers";

export default function AdminOverview({ foundItems, lostReports, claims, auditLogs }) {
  const { t } = useTranslation();
  const stats = {
    total: foundItems.length,
    pending: foundItems.filter((item) => item.status === "pending_review").length,
    approved: foundItems.filter((item) => item.status === "approved").length,
    returned: foundItems.filter((item) => item.status === "returned").length,
    claimed: foundItems.filter((item) => item.status === "claimed").length,
    activeClaims: claims.filter((claim) => ["submitted", "under_review"].includes(claim.status)).length,
    openReports: lostReports.filter((report) => report.status === "open").length,
    returnRate: foundItems.length > 0
      ? Math.round((foundItems.filter((item) => item.status === "returned").length / foundItems.length) * 100)
      : 0,
  };

  const categoryData = CATEGORIES.map((category) => ({
    name: translateCategory(t, category.value).split(" ")[0],
    count: foundItems.filter((item) => item.category === category.value).length,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const statusData = [
    { name: t("statuses.pending_review"), value: stats.pending, color: "#c98b12" },
    { name: t("statuses.approved"), value: stats.approved, color: "#17315f" },
    { name: t("statuses.claimed"), value: stats.claimed, color: "#2b5aa5" },
    { name: t("statuses.returned"), value: stats.returned, color: "#64748b" },
  ].filter((entry) => entry.value > 0);

  const recentLogs = auditLogs.slice(0, 8);

  return (
    <div className="space-y-6">
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
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{stat.label}</p>
            <p className="mt-2 text-xs text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-base font-semibold text-slate-950">{t("admin_overview.items_by_category")}</h3>
              <p className="mt-1 text-sm text-slate-600">{t("admin_overview.items_by_category_description")}</p>
            </div>
          </div>

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
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              {t("admin_overview.no_category_data")}
            </div>
          )}
        </div>

        <div className="surface-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-base font-semibold text-slate-950">{t("admin_overview.status_distribution")}</h3>
              <p className="mt-1 text-sm text-slate-600">{t("admin_overview.status_distribution_description")}</p>
            </div>
          </div>

          {statusData.length > 0 ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
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

              <div className="flex-1 space-y-3">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-950">{item.value}</span>
                  </div>
                ))}

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-700">{t("admin_overview.return_rate")}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.returnRate}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              {t("admin_overview.no_status_data")}
            </div>
          )}
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-base font-semibold text-slate-950">{t("admin_overview.recent_activity")}</h3>
            <p className="mt-1 text-sm text-slate-600">{t("admin_overview.recent_activity_description")}</p>
          </div>
        </div>

        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{log.action}</p>
                  <p className="mt-1 text-sm text-slate-600">{log.details}</p>
                  <p className="mt-2 text-xs text-slate-500">{log.performed_by}</p>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {log.created_date ? formatLocalizedDate(log.created_date, "MMM d, h:mm a") : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {t("admin_overview.no_activity_logged")}
          </div>
        )}
      </div>
    </div>
  );
}
