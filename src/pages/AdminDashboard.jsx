/**
 * FindBack AI - Admin Dashboard
 * Central admin hub with overview metrics, moderation queue,
 * claims management, lost reports, and audit logs.
 * Accessible only to users with admin role.
 */

import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminItemsQueue from "@/components/admin/AdminItemsQueue";
import AdminClaimsQueue from "@/components/admin/AdminClaimsQueue";
import StatusBadge from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import {
  Shield, LayoutDashboard, Package, FileCheck,
  AlertTriangle, ClipboardList, ArrowLeft, Lock
} from "lucide-react";
import { useMode } from "@/lib/ModeContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdminMode } = useMode();

  // Fetch all data for admin
  const { data: foundItems = [], isLoading: fiLoading } = useQuery({
    queryKey: ["adminFoundItems"],
    queryFn: () => base44.entities.FoundItem.list("-created_date", 500),
    enabled: isAdminMode,
  });

  const { data: lostReports = [], isLoading: lrLoading } = useQuery({
    queryKey: ["adminLostReports"],
    queryFn: () => base44.entities.LostReport.list("-created_date", 500),
    enabled: isAdminMode,
  });

  const { data: claims = [], isLoading: clLoading } = useQuery({
    queryKey: ["adminClaims"],
    queryFn: () => base44.entities.Claim.list("-created_date", 500),
    enabled: isAdminMode,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: () => base44.entities.AuditLog.list("-created_date", 100),
    enabled: isAdminMode,
  });

  // Access denied if not in admin mode
  if (!isAdminMode) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Admin Mode Required</h1>
        <p className="text-slate-500 mb-6">
          Switch to Admin mode using the toggle in the top navigation bar.
        </p>
        <Button onClick={() => navigate("/Home")}>Back to Home</Button>
      </div>
    );
  }

  const isLoading = fiLoading || lrLoading || clLoading;
  const pendingCount = foundItems.filter(i => i.status === "pending_review").length;
  const pendingClaims = claims.filter(c => c.status === "submitted").length;
  const openReports = lostReports.filter(r => r.status === "open").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-[hsl(213,56%,24%)]" />
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-slate-500 text-sm">Manage items, claims, and reports.</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-[hsl(222,65%,18%)] text-white text-xs">Admin Mode</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-1.5">
              <Package className="w-4 h-4" />
              Items
              {pendingCount > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 ml-1">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="claims" className="gap-1.5">
              <FileCheck className="w-4 h-4" />
              Claims
              {pendingClaims > 0 && (
                <Badge className="bg-blue-500 text-white text-[10px] px-1.5 ml-1">{pendingClaims}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Lost Reports
              {openReports > 0 && (
                <Badge className="bg-purple-500 text-white text-[10px] px-1.5 ml-1">{openReports}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <ClipboardList className="w-4 h-4" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview foundItems={foundItems} lostReports={lostReports} claims={claims} auditLogs={auditLogs} />
          </TabsContent>

          <TabsContent value="items">
            <AdminItemsQueue items={foundItems} />
          </TabsContent>

          <TabsContent value="claims">
            <AdminClaimsQueue claims={claims} />
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{lostReports.length} lost reports</p>
              {lostReports.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No lost reports yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lostReports.map(report => (
                    <Card key={report.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-sm text-slate-900">{report.item_type}</span>
                              <StatusBadge status={report.status} />
                              {report.matched_items?.length > 0 && (
                                <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                                  {report.matched_items.length} matches
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">{report.description}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              by {report.contact_name} • {report.date_lost} • {report.last_seen_location || "Unknown location"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">{report.urgency}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No audit logs yet.</p>
                </div>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{log.action}</p>
                      <p className="text-xs text-slate-400">{log.details}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">{log.performed_by}</p>
                      <p className="text-[10px] text-slate-400">
                        {log.created_date ? format(new Date(log.created_date), "MMM d, h:mm a") : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}