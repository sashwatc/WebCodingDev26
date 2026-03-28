/**
 * FindBack AI - Admin Overview Tab
 * Displays key metrics, charts, and recent activity feed.
 */

import React from "react";
import {
  Package,
  CheckCircle2,
  FileCheck,
  Clock,
  TrendingUp,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
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

export default function AdminOverview({ foundItems, lostReports, claims, auditLogs }) {
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
    name: category.label.split(" ")[0],
    count: foundItems.filter((item) => item.category === category.value).length,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const statusData = [
    { name: "Pending", value: stats.pending, color: "#c98b12" },
    { name: "Approved", value: stats.approved, color: "#17315f" },
    { name: "Claimed", value: stats.claimed, color: "#2b5aa5" },
    { name: "Returned", value: stats.returned, color: "#64748b" },
  ].filter((entry) => entry.value > 0);

  const recentLogs = auditLogs.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Items",
            value: stats.total,
            helper: `${stats.approved} approved`,
            icon: Package,
          },
          {
            label: "Pending Review",
            value: stats.pending,
            helper: `${stats.openReports} open lost reports`,
            icon: Clock,
          },
          {
            label: "Items Returned",
            value: stats.returned,
            helper: `${stats.returnRate}% return rate`,
            icon: CheckCircle2,
          },
          {
            label: "Active Claims",
            value: stats.activeClaims,
            helper: `${stats.claimed} currently claimed`,
            icon: FileCheck,
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-panel p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{stat.label}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Items by Category</h3>
              <p className="mt-1 text-sm text-slate-600">Top categories in the current inventory.</p>
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
            <div className="flex min-h-[240px] items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No category data yet.
            </div>
          )}
        </div>

        <div className="surface-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Status Distribution</h3>
              <p className="mt-1 text-sm text-slate-600">A quick read on how items are progressing through the system.</p>
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
                  <div key={item.name} className="flex items-center justify-between rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-950">{item.value}</span>
                  </div>
                ))}

                <div className="rounded-[16px] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Return Rate</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{stats.returnRate}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No status data yet.
            </div>
          )}
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Recent Activity</h3>
            <p className="mt-1 text-sm text-slate-600">Latest moderation and system events.</p>
          </div>
        </div>

        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-3"
              >
                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{log.action}</p>
                  <p className="mt-1 text-sm text-slate-600">{log.details}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{log.performed_by}</p>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {log.created_date ? format(new Date(log.created_date), "MMM d, h:mm a") : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No activity logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
