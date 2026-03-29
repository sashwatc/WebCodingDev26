/**
 * FindBack AI - Home Page
 * Leads with search, then surfaces the two main reporting actions.
 */

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  const navigate = useNavigate();
  const { user, hasAdminAccess } = useAuth();
  const { isAdminMode, theme } = useMode();
  const [homeSearchQuery, setHomeSearchQuery] = useState("");

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

  const handleHomeSearch = (event) => {
    event.preventDefault();
    const query = homeSearchQuery.trim();
    navigate(query ? `/Search?q=${encodeURIComponent(query)}` : "/Search");
  };

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
    <div className="relative isolate overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0">
        <WebGLShader variant="blue-flow" theme={theme} className={theme === "dark" ? "opacity-60" : "opacity-100"} />
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

        <section className="mb-8 space-y-4">
          <div className="hero-panel bg-white p-5 sm:p-6">
            <form onSubmit={handleHomeSearch} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Search Inventory
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={homeSearchQuery}
                    onChange={(event) => setHomeSearchQuery(event.target.value)}
                    className="h-14 rounded-xl border-slate-300 bg-white pl-12 text-base"
                    placeholder='Try "airpods", "black bottle", or "library"'
                    aria-label="Search the found item inventory"
                  />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Start with search before filing a new report. If the item is already listed, you can go straight to the claim flow.
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                className="h-14 gap-2 bg-[hsl(222,65%,18%)] px-6 text-white hover:bg-[hsl(222,65%,15%)]"
              >
                <Search className="h-4 w-4" />
                Search Found Items
              </Button>
            </form>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Link to="/ReportLost" className="block">
              <div className="surface-card bg-white p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(15,23,42,0.08)] min-h-[220px]">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Lost Item</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Can&apos;t find it?</h2>
                      <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                        Submit a lost-item report, keep the case active, and review suggested matches as new items come in.
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-500">Report what was lost and track matches.</span>
                    <Button variant="outline" size="lg" className="shrink-0">
                      Report Lost Item
                    </Button>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/ReportFound" className="block">
              <div className="surface-card bg-white p-6 sm:p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_rgba(15,23,42,0.08)] min-h-[220px]">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Found Item</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Found something?</h2>
                      <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                        Create a moderated item record with photos and details so the owner can recognize it quickly.
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                      <PlusCircle className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-500">Send it into the approval and matching flow.</span>
                    <Button variant="outline" size="lg" className="shrink-0">
                      Report Found Item
                    </Button>
                  </div>
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
                  <h2 className="section-heading">Quick actions</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Supporting actions stay here so the homepage remains easy to scan.
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
                  <p className="mt-1 text-sm text-slate-600">Latest moderation and workflow changes recorded in this workspace.</p>
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
