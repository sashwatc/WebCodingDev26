/**
 * FindBack AI - Admin Overview Tab
 * Displays key metrics, charts, and recent activity feed.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, CheckCircle2, AlertTriangle, FileCheck,
  Clock, TrendingUp, Users, BarChart3
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import StatusBadge from "@/components/ui/StatusBadge";
import { CATEGORIES, getCategoryLabel } from "@/lib/constants";

const CHART_COLORS = ["#0d9488", "#1e3a5f", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

export default function AdminOverview({ foundItems, lostReports, claims, auditLogs }) {
  // Compute metrics
  const stats = {
    total: foundItems.length,
    pending: foundItems.filter(i => i.status === "pending_review").length,
    approved: foundItems.filter(i => i.status === "approved").length,
    returned: foundItems.filter(i => i.status === "returned").length,
    claimed: foundItems.filter(i => i.status === "claimed").length,
    activeClaims: claims.filter(c => ["submitted", "under_review"].includes(c.status)).length,
    openReports: lostReports.filter(r => r.status === "open").length,
    returnRate: foundItems.length > 0 ? Math.round((foundItems.filter(i => i.status === "returned").length / foundItems.length) * 100) : 0,
  };

  // Category distribution for bar chart
  const categoryData = CATEGORIES.map(cat => ({
    name: cat.label.split(" ")[0],
    count: foundItems.filter(i => i.category === cat.value).length,
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);

  // Status pie data
  const statusData = [
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Claimed", value: stats.claimed, color: "#3b82f6" },
    { name: "Returned", value: stats.returned, color: "#059669" },
  ].filter(d => d.value > 0);

  // Recent audit logs
  const recentLogs = auditLogs.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: stats.total, icon: Package, color: "text-blue-600 bg-blue-50" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Items Returned", value: stats.returned, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          { label: "Active Claims", value: stats.activeClaims, icon: FileCheck, color: "text-purple-600 bg-purple-50" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              Items by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {statusData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600">{item.name}</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-slate-500">Return Rate: <span className="font-bold text-emerald-600">{stats.returnRate}%</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{log.action}</p>
                    <p className="text-xs text-slate-400">{log.performed_by} • {log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {log.created_date ? format(new Date(log.created_date), "MMM d, h:mm a") : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No activity logged yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}