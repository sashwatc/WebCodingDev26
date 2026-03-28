/**
 * FindBack AI - Home Page
 * Focuses on live system status and direct actions instead of presentation-heavy marketing.
 */

import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  LayoutDashboard,
  Package,
  PlusCircle,
  Search,
} from "lucide-react";

export default function Home() {
  const { user, isAdminUser } = useAuth();
  const { isAdminMode } = useMode();

  const { data: foundItems = [] } = useQuery({
    queryKey: ["homeFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 200),
  });

  const { data: claims = [] } = useQuery({
    queryKey: ["homeClaims"],
    queryFn: () => appClient.entities.Claim.list("-created_date", 200),
  });

  const { data: lostReports = [] } = useQuery({
    queryKey: ["homeLostReports"],
    queryFn: () => appClient.entities.LostReport.list("-created_date", 200),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["homeAuditLogs"],
    queryFn: () => appClient.entities.AuditLog.list("-created_date", 20),
  });

  const approvedItems = foundItems.filter((item) => item.status === "approved");
  const pendingItems = foundItems.filter((item) => item.status === "pending_review");
  const returnedItems = foundItems.filter((item) => item.status === "returned");
  const activeClaims = claims.filter((claim) => ["submitted", "under_review"].includes(claim.status));
  const openReports = lostReports.filter((report) => report.status === "open");
  const matchedReports = lostReports.filter((report) => report.matched_items?.length > 0);
  const recentApprovedItems = approvedItems.slice(0, 5);
  const recentActivity = auditLogs.slice(0, 5);
  const isAdminWorkspace = isAdminUser && isAdminMode;

  const stats = [
    { label: "Available Items", value: approvedItems.length, helper: "currently searchable", icon: Package },
    { label: "Pending Review", value: pendingItems.length, helper: "awaiting admin approval", icon: ClipboardList },
    { label: "Active Claims", value: activeClaims.length, helper: "still in review", icon: FileCheck },
    { label: "Returned Items", value: returnedItems.length, helper: "confirmed completed", icon: CheckCircle2 },
  ];

  return (
    <div className="page-shell py-10">
      <section className="page-header">
        <span className="page-kicker">School Lost-and-Found System</span>
        <h1 className="page-title">Report items, search records, and manage claims from one place.</h1>
        <p className="page-subtitle">
          This build is organized around the actual workflow: submit a found item, expose only approved listings,
          collect ownership claims, and keep admin review separate from the public search experience.
        </p>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Link to="/Search" className="block">
          <div className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Search found items</p>
                <p className="mt-1 text-sm text-slate-600">Browse approved public listings.</p>
              </div>
              <Search className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </Link>

        <Link to="/ReportFound" className="block">
          <div className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Report found item</p>
                <p className="mt-1 text-sm text-slate-600">Create a new moderated record.</p>
              </div>
              <PlusCircle className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </Link>

        <Link to="/ReportLost" className="block">
          <div className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Report lost item</p>
                <p className="mt-1 text-sm text-slate-600">Create a report and check matches.</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </Link>

        <Link to={user ? "/UserDashboard" : "/Documentation"} className="block">
          <div className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{user ? "My dashboard" : "Project documentation"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {user ? "Track notifications and claim history." : "Review setup, sources, and architecture."}
                </p>
              </div>
              <LayoutDashboard className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </Link>

        <Link to={isAdminUser ? "/AdminDashboard" : "/Documentation"} className="block">
          <div className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{isAdminUser ? "Admin workspace" : "Documentation and rules"}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {isAdminUser
                    ? isAdminWorkspace
                      ? "Review pending items and claims."
                      : "Switch to admin view to moderate records."
                    : "See how the prototype is structured."}
                </p>
              </div>
              <ClipboardList className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        </Link>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-panel">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-primary">
              <stat.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-950">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{stat.label}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="surface-card">
          <div className="border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Recently approved items</h2>
            <p className="mt-1 text-sm text-slate-600">These are visible on the public search page right now.</p>
          </div>

          {recentApprovedItems.length > 0 ? (
            <div className="divide-y">
              {recentApprovedItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/ItemDetails?id=${item.id}`} className="font-semibold text-slate-900 hover:underline">
                        {item.title}
                      </Link>
                      <StatusBadge status={item.status} />
                      {item.category && <Badge variant="outline">{item.category.replaceAll("_", " ")}</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.ai_description || item.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {item.location_found} • {item.date_found ? format(new Date(item.date_found), "MMM d, yyyy") : "Date unavailable"}
                    </p>
                  </div>
                  <Link to={`/ItemDetails?id=${item.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-sm text-slate-500">No approved items are available yet.</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="surface-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Workflow status</h2>
              <p className="mt-1 text-sm text-slate-600">Current workload across submissions, claims, and reports.</p>
            </div>
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-700">Pending found-item submissions</span>
                <span className="font-semibold text-slate-950">{pendingItems.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-700">Claims awaiting review</span>
                <span className="font-semibold text-slate-950">{activeClaims.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-700">Open lost-item reports</span>
                <span className="font-semibold text-slate-950">{openReports.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-700">Reports with suggested matches</span>
                <span className="font-semibold text-slate-950">{matchedReports.length}</span>
              </div>
            </div>
          </div>

          <div className="surface-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-600">Latest changes recorded in the local demo workspace.</p>
            </div>
            {recentActivity.length > 0 ? (
              <div className="divide-y">
                {recentActivity.map((log) => (
                  <div key={log.id} className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    <p className="mt-1 text-sm text-slate-600">{log.details}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                      {log.performed_by} • {log.created_date ? format(new Date(log.created_date), "MMM d, h:mm a") : "No date"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-sm text-slate-500">No activity logged yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
