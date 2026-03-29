/**
 * FindBack AI - Home Page
 * Centers the homepage around one primary action and moves secondary tools lower.
 */

import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WebGLShader } from "@/components/ui/web-gl-shader";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Package,
  PlusCircle,
  Search,
  Shield,
} from "lucide-react";

export default function Home() {
  const { user, hasAdminAccess } = useAuth();
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
  const recentActivity = auditLogs.slice(0, 4);
  const isAdminWorkspace = hasAdminAccess && isAdminMode;

  const publicStats = [
    { label: "Available Items", value: approvedItems.length, helper: "approved public listings", icon: Package },
    { label: "Matched Reports", value: matchedReports.length, helper: "reports with suggested matches", icon: Search },
    { label: "Returned Items", value: returnedItems.length, helper: "completed handoffs", icon: CheckCircle2 },
  ];

  const moreTools = [
    user
      ? {
          to: "/UserDashboard",
          title: "My dashboard",
          description: "Track notifications, claim activity, and updates tied to your account.",
          icon: LayoutDashboard,
        }
      : {
          to: "/Documentation",
          title: "Project documentation",
          description: "Review the architecture, setup, sources, and accessibility decisions.",
          icon: ClipboardList,
        },
    hasAdminAccess
      ? {
          to: "/AdminDashboard",
          title: "Admin workspace",
          description: isAdminWorkspace
            ? "Review pending items, claims, and reports."
            : "Switch to admin view when you need moderation tools.",
          icon: Shield,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="relative isolate overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <WebGLShader variant="blue-flow" className="opacity-90" />
      </div>

      <div className="page-shell relative z-10 py-10">
        <section className="page-header">
          <span className="page-kicker">PVHS Lost-and-Found System</span>
          <h1 className="page-title">Search approved items before filing a new report.</h1>
          <p className="page-subtitle">
            Search checks titles, descriptions, tags, brand, color, and found location across the approved public
            inventory. If the item is already listed, students can go directly into the claim process.
          </p>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div className="hero-panel bg-white/82 p-6 backdrop-blur-[5px]">
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Primary Action</p>
                <h2 className="section-heading mt-2 text-2xl tracking-tight">
                  Search approved items before filing a new report.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Use the public inventory first. If the item is already there, the student can move directly into the
                  claim process instead of creating a duplicate report.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{approvedItems.length} approved listings</Badge>
                <Badge variant="outline">{matchedReports.length} reports already matched</Badge>
                <Badge variant="outline">{returnedItems.length} returns completed</Badge>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/Search">
                  <Button size="lg" className="gap-2">
                    <Search className="h-4 w-4" />
                    Search Found Items
                  </Button>
                </Link>
                <Link to="/ItemDetails?id=found_002">
                  <Button size="lg" variant="outline">View a sample item</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Link to="/ReportLost" className="block">
              <div className="surface-card bg-white/82 p-5 backdrop-blur-[5px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Can&apos;t find it?</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Submit a lost-item report and check suggested matches.
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-slate-500" />
                </div>
              </div>
            </Link>

            <Link to="/ReportFound" className="block">
              <div className="surface-card bg-white/82 p-5 backdrop-blur-[5px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Found something?</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Create a moderated record so the owner can search for it.
                    </p>
                  </div>
                  <PlusCircle className="h-5 w-5 text-slate-500" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
        {publicStats.map((stat) => (
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
          <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
            <div>
              <h2 className="section-heading">Recently approved items</h2>
              <p className="mt-1 text-sm text-slate-600">These are visible on the public search page right now.</p>
            </div>
            <Link to="/Search">
              <Button variant="outline" size="sm">Open Search</Button>
            </Link>
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
              <h2 className="section-heading">More tools</h2>
              <p className="mt-1 text-sm text-slate-600">
                Lower-priority actions live here so the homepage can stay focused on search first.
              </p>
            </div>
            <div className="divide-y">
              {moreTools.map((tool) => (
                <Link key={tool.title} to={tool.to} className="block px-5 py-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-primary">
                      <tool.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tool.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{tool.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {isAdminWorkspace && (
            <>
              <div className="surface-card">
                <div className="border-b px-5 py-4">
                  <h2 className="section-heading">Admin summary</h2>
                  <p className="mt-1 text-sm text-slate-600">Moderation workload is shown only in admin mode.</p>
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
                </div>
              </div>

              <div className="surface-card">
                <div className="border-b px-5 py-4">
                  <h2 className="section-heading">Recent admin activity</h2>
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
            </>
          )}
        </div>
        </section>
      </div>
    </div>
  );
}
