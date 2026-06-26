/**
 * FindBack AI - Admin Dashboard
 * Central admin hub with overview metrics, moderation queue,
 * claims management, lost reports, and audit logs.
 * Access is protected by the admin route guard in the standalone judging build.
 */

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminItemsQueue from "@/components/admin/AdminItemsQueue";
import AdminClaimsQueue from "@/components/admin/AdminClaimsQueue";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminSystemSettings from "@/components/admin/AdminSystemSettings";
import RecordThumbnail from "@/components/shared/RecordThumbnail";
import StatusBadge from "@/components/ui/StatusBadge";
import { getPrimaryRecordPhoto } from "@/lib/media";
import { formatLocalizedDate, translateLocation, translateUrgency } from "@/lib/i18n-helpers";
import {
  LayoutDashboard,
  Package,
  FileCheck,
  AlertTriangle,
  Radar,
  ShieldCheck,
  Route,
  MessageSquare,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";

const SUPPORT_STATUSES = ["open", "in_progress", "resolved", "closed"];

function supportStatusClass(status) {
  if (status === "open") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "in_progress") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "resolved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  return "border-border bg-muted text-muted-foreground";
}

function SupportTicketCard({ ticket }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = React.useState(ticket.staff_notes || "");
  const [reply, setReply] = React.useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["adminSupportTickets"] });

  const statusMutation = useMutation({
    mutationFn: (status) => appClient.support.updateTicket(ticket.id, { status }),
    onSuccess: () => { invalidate(); toast({ title: "Status updated" }); },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const notesMutation = useMutation({
    mutationFn: () => appClient.support.updateTicket(ticket.id, { staff_notes: notes }),
    onSuccess: () => { invalidate(); toast({ title: "Notes saved" }); },
    onError: () => toast({ title: "Failed to save notes", variant: "destructive" }),
  });

  const replyMutation = useMutation({
    mutationFn: () => appClient.support.replyToTicket(ticket.id, reply),
    onSuccess: () => { setReply(""); invalidate(); toast({ title: "Reply sent" }); },
    onError: () => toast({ title: "Failed to send reply", variant: "destructive" }),
  });

  const busy = statusMutation.isPending || notesMutation.isPending || replyMutation.isPending;

  return (
    <div className="archive-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
            <Badge variant="outline" className={`text-xs ${supportStatusClass(ticket.status)}`}>{ticket.status}</Badge>
          </div>
          {ticket.subject && <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>}
          <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {ticket.submitter_email || "anonymous"}
            {ticket.ticket_number ? ` · ${ticket.ticket_number}` : ""}
          </p>
        </div>
        <Select value={ticket.status} onValueChange={(v) => statusMutation.mutate(v)} disabled={busy}>
          <SelectTrigger className="h-8 w-36 shrink-0 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal staff notes…"
            className="min-h-[70px] text-sm"
          />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => notesMutation.mutate()}>
            Save notes
          </Button>
        </div>
        <div className="space-y-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply to the submitter…"
            className="min-h-[70px] text-sm"
          />
          <Button size="sm" disabled={busy || !reply.trim()} onClick={() => replyMutation.mutate()}>
            Send reply
          </Button>
        </div>
      </div>
    </div>
  );
}

// The admin Support tab is scoped to lost-item case chats only: tickets in the
// "Lost Item" category or any ticket linked to a specific item case.
function isLostItemTicket(ticket = {}) {
  const category = String(ticket.category || "").toLowerCase();
  const linkedItemId = ticket.linked_item_id || ticket.linkedItemId;
  return category.includes("lost") || Boolean(linkedItemId);
}

function SupportTicketsList() {
  const { data: allTickets = [], isLoading, isError } = useQuery({
    queryKey: ["adminSupportTickets"],
    queryFn: () => appClient.support.listTickets(),
    refetchInterval: 30000,
  });

  const tickets = allTickets.filter(isLostItemTicket);

  if (isLoading) return <div className="search-state-panel"><MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"/>Loading support tickets…</div>;
  if (isError) return <div className="search-state-panel"><MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"/>Could not load support tickets.</div>;
  if (!tickets.length) return <div className="search-state-panel"><MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40"/>No lost-item support chats yet.</div>;

  return <div className="space-y-3">{tickets.map((t) => <SupportTicketCard key={t.id} ticket={t} />)}</div>;
}

function matchFoundItemId(match) {
  return typeof match === "string" ? match : (match?.found_item_id || match?.foundItemId || "");
}

// Admin view of a lost report's AI-suggested found-item matches, with actions to
// approve (confirm), reject, or link a match. Decisions persist onto the report's
// matched_items array via the LostReport entity.
function LostReportMatches({ report }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const matches = Array.isArray(report.matched_items) ? report.matched_items : [];

  const decisionMutation = useMutation({
    mutationFn: ({ foundItemId, decision }) =>
      appClient.matches.decideForLostReport(report.id, foundItemId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLostReports"] });
      toast({ title: "Match updated" });
    },
    onError: (error) =>
      toast({ title: "Failed to update match", description: error?.message, variant: "destructive" }),
  });

  if (matches.length === 0) {
    return (
      <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
        No suggested matches for this report yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-foreground">
        Suggested matches ({matches.length})
      </p>
      {matches.map((match) => {
        const foundItemId = matchFoundItemId(match);
        const title = match?.found_item_title || foundItemId;
        const confidence = match?.confidence;
        const reasons = Array.isArray(match?.reasons) ? match.reasons : [];
        const decision = match?.status && match.status !== "suggested" ? match.status : null;
        const isLinked = decision === "linked" || decision === "confirmed";
        const decisionLabel = isLinked ? "Linked" : decision === "rejected" ? "Not a match" : decision;
        return (
          <div key={foundItemId} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start gap-3">
              <RecordThumbnail
                src={match?.photo_urls?.[0]}
                alt={title}
                className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                  {typeof confidence === "number" && (
                    <Badge variant="outline" className="border-primary/30 text-primary">{confidence}% match</Badge>
                  )}
                  {decision && (
                    <Badge
                      className={
                        isLinked
                          ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                          : "border border-red-200 bg-red-100 text-red-700"
                      }
                    >
                      {decisionLabel}
                    </Badge>
                  )}
                </div>
                {reasons.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {reasons.slice(0, 6).map((reason) => (
                      <Badge key={reason} variant="outline" className="text-[10px] text-muted-foreground">{reason}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/ItemDetails?id=${foundItemId}`}>View item</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-500"
                    disabled={decisionMutation.isPending}
                    onClick={() => decisionMutation.mutate({ foundItemId, decision: "linked" })}
                  >
                    Link Items
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    disabled={decisionMutation.isPending}
                    onClick={() => decisionMutation.mutate({ foundItemId, decision: "rejected" })}
                  >
                    Not a Match
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("overview");
  const { data: foundItems = [], isLoading: fiLoading } = useQuery({
    queryKey: ["adminFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 500),
    refetchInterval: 30000,
  });

  const { data: lostReports = [], isLoading: lrLoading } = useQuery({
    queryKey: ["adminLostReports"],
    queryFn: () => appClient.entities.LostReport.list("-created_date", 500),
    refetchInterval: 30000,
  });

  const { data: claims = [], isLoading: clLoading, error: claimsError } = useQuery({
    queryKey: ["adminClaims"],
    queryFn: () => appClient.entities.Claim.list("-created_date", 500),
    refetchInterval: 30000,
  });

  const {
    data: recoveryCenter,
    isLoading: recoveryLoading,
    error: recoveryError,
  } = useQuery({
    queryKey: ["adminRecoveryCenter"],
    queryFn: () => appClient.recoveryCenter.summary(),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: () => appClient.entities.AuditLog.list("-created_date", 100),
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ["adminSupportTickets"],
    queryFn: () => appClient.support.listTickets(),
    refetchInterval: 30000,
  });

  const { data: recoveryCases = [] } = useQuery({
    queryKey: ["adminRecoveryCases"],
    queryFn: () => appClient.recoveryCases.list(),
  });

  const { data: recoveryMissions = [] } = useQuery({
    queryKey: ["adminRecoveryMissions", recoveryCases.map((entry) => entry.id).join(",")],
    queryFn: async () => {
      const groups = await Promise.all(recoveryCases.map((entry) => appClient.recoveryCases.missions(entry.id)));
      return groups.flat();
    },
    enabled: recoveryCases.length > 0,
  });

  const { data: sentinelAlerts = [] } = useQuery({
    queryKey: ["adminSentinelAlerts"],
    queryFn: () => appClient.sentinel.alerts(),
  });

  const { data: partnerRelays = [] } = useQuery({
    queryKey: ["adminPartnerRelays"],
    queryFn: () => appClient.partnerRelay.relays(),
  });

  const { data: assetDemo } = useQuery({
    queryKey: ["adminAssetDemoLookup"],
    queryFn: () => appClient.assets.lookup("PVHS-CB-1042"),
  });

  const updateMissionMutation = useMutation({
    mutationFn: ({ id, updates }) => appClient.recoveryMissions.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminRecoveryMissions"] }),
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, updates }) => {
      if (updates.status === "acknowledged") {
        return appClient.sentinel.acknowledge(id, updates);
      }
      if (updates.status === "dismissed") {
        return appClient.sentinel.dismiss(id, updates);
      }
      if (updates.status === "resolved") {
        return appClient.sentinel.resolve(id, updates);
      }
      return appClient.sentinel.update(id, updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminSentinelAlerts"] }),
  });

  const isLoading = fiLoading || lrLoading || clLoading || recoveryLoading;
  const recoverySummary = recoveryCenter?.summary;
  const pendingCount = foundItems.filter((item) => ["pending_review", "FOUND"].includes(item.status)).length;
  const pendingClaims = recoverySummary?.claims_awaiting_review ?? claims.filter((claim) => claim.status === "submitted" || claim.status === "under_review").length;
  const openReports = recoverySummary?.active_cases ?? lostReports.filter((report) => report.status === "open").length;
  const supportCount = supportTickets.filter(isLostItemTicket).filter((t) => t.status === "open").length;
  const EmptyAdminPanel = ({ icon: Icon, title, description }) => (
    <div className="search-state-panel">
      <Icon className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
    </div>
  );

  return (
    <div className="bg-card text-foreground min-h-screen py-10">
      <div className="page-shell max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border">
          <div className="page-header">
            <span className="page-kicker">{t("admin_dashboard.kicker")}</span>
            <h1 className="page-title text-4xl font-extrabold text-foreground tracking-tight mt-1">{t("admin_dashboard.title")}</h1>
            <p className="page-subtitle text-muted-foreground mt-2 max-w-2xl">{t("admin_dashboard.subtitle")}</p>
          </div>
          <Button asChild className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link to="/PickupStation">
              <Route className="h-4 w-4" aria-hidden="true" />
              {t("pickup_station.open_station")}
            </Link>
          </Button>
        </div>

        {/* Simplified stats card row */}
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { label: t("admin_dashboard.pending_items", "Pending Items"), value: pendingCount, color: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/5 dark:text-amber-400" },
            { label: t("admin_dashboard.pending_claims", "Pending Claims"), value: pendingClaims, color: "border-primary/20 bg-primary/5 text-primary" },
            { label: t("admin_dashboard.open_reports", "Open Reports"), value: openReports, color: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/5 dark:text-sky-400" },
          ].map((stat) => (
            <div key={stat.label} className={`border p-6 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 ${stat.color} shadow-sm`}>
              <p className="text-4xl font-extrabold tracking-tight">{stat.value}</p>
              <p className="mt-1.5 text-sm font-semibold uppercase tracking-wider opacity-90">{stat.label}</p>
            </div>
          ))}
        </div>

        {(recoveryError || claimsError) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {t("admin_dashboard.backend_partial_error", "Some admin data could not be loaded from the backend. Counts may be incomplete until the API is available.")}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl bg-muted" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl bg-muted" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="responsive-tabs bg-muted border border-border p-1 rounded-xl shadow-inner">
              <TabsTrigger
                value="overview"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t("admin_dashboard.overview", "Command Center")}
              </TabsTrigger>
              <TabsTrigger
                value="moderation"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <Package className="h-4 w-4" />
                {t("admin_dashboard.moderation", "Moderation Queue")}
                {(pendingCount + pendingClaims) > 0 && (
                  <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 border-none shadow-sm ml-1">
                    {pendingCount + pendingClaims}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {t("admin_dashboard.lost_reports", "Reference Desk")}
                {openReports > 0 && (
                  <Badge className="bg-sky-500 text-white font-bold text-[10px] px-2 py-0.5 border-none shadow-sm ml-1">
                    {openReports}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="recovery"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <Radar className="h-4 w-4" />
                Recovery Center
              </TabsTrigger>
              <TabsTrigger
                value="sentinel"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Loss Sentinel
              </TabsTrigger>
              <TabsTrigger
                value="support"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <MessageSquare className="h-4 w-4"/>Support{supportCount > 0 && <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 border-none shadow-sm ml-1">{supportCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <Users className="h-4 w-4"/>Users
              </TabsTrigger>
              <TabsTrigger
                value="sysconfig"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
              >
                <SettingsIcon className="h-4 w-4"/>Settings
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
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-500" />
                      {t("admin_dashboard.found_items_queue", "Found Items Review")}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("admin_dashboard.found_items_queue_desc", "Approve or reject newly submitted found items before they go public.")}
                    </p>
                  </div>
                  <div className="bg-muted border border-border rounded-xl p-4 shadow-sm">
                    <AdminItemsQueue items={foundItems} filterStatus="all" />
                  </div>
                </div>

                {/* Column 2: Claims Queue */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-primary" />
                      {t("admin_dashboard.claims_queue", "Claims Verification")}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("admin_dashboard.claims_queue_desc", "Verify ownership proof and details to approve or reject student claims.")}
                    </p>
                  </div>
                  <div className="bg-muted border border-border rounded-xl p-4 shadow-sm">
                    <AdminClaimsQueue claims={claims} foundItems={foundItems} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-4">
                <div className="bg-muted border border-border rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">{t("admin_dashboard.lost_reports")}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{t("admin_dashboard.reports_summary", { count: lostReports.length })}</p>
                </div>

                {lostReports.length === 0 ? (
                  <div className="bg-muted border border-border rounded-xl px-6 py-14 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">{t("admin_dashboard.no_lost_reports")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lostReports.map((report) => (
                      <div key={report.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <RecordThumbnail
                              src={getPrimaryRecordPhoto(report)}
                              alt={report.item_type || "Lost report"}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-foreground">{report.item_type}</h3>
                                <StatusBadge status={report.status} />
                                {report.matched_items?.length > 0 && (
                                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/25">{t("admin_dashboard.matches", { count: report.matched_items.length })}</Badge>
                                )}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.description}</p>
                              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span>{report.contact_name}</span>
                                <span>{report.date_lost ? formatLocalizedDate(report.date_lost, "MMM d, yyyy") : t("common.not_available")}</span>
                                <span>{translateLocation(t, report.last_seen_location) || t("admin_dashboard.unknown_location")}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize self-start text-primary border-primary/20">{translateUrgency(t, report.urgency)}</Badge>
                        </div>
                        <LostReportMatches report={report} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recovery" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-foreground">Recovery Cases</h2>
                  {recoveryCases.length === 0 ? (
                    <EmptyAdminPanel
                      icon={Radar}
                      title="No recovery cases available."
                      description="The current data set does not contain any active recovery case records."
                    />
                  ) : (
                    recoveryCases.map((recoveryCase) => (
                      <div key={recoveryCase.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{recoveryCase.summary || recoveryCase.case_code}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{recoveryCase.case_code} · {recoveryCase.priority}</p>
                          </div>
                          <StatusBadge status={recoveryCase.status} />
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{recoveryCase.recovery_plan}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-foreground">Recovery Missions</h2>
                  {recoveryMissions.length === 0 ? (
                    <EmptyAdminPanel
                      icon={ShieldCheck}
                      title="No recovery missions available."
                      description="The current data set does not contain any mission records."
                    />
                  ) : (
                    recoveryMissions.map((mission) => (
                      <div key={mission.id} className="rounded-xl border border-border bg-muted p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{mission.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{mission.zone_label} · {mission.score}%</p>
                          </div>
                          <StatusBadge status={mission.status} />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
                            onClick={() => updateMissionMutation.mutate({ id: mission.id, updates: { assigned_to: "avery.patel@pleasantvalley.edu" } })}
                          >
                            Assign
                          </button>
                          {["checked", "possible_item_found", "escalated", "completed", "dismissed"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                              onClick={() => updateMissionMutation.mutate({ id: mission.id, updates: { status } })}
                            >
                              {status.replaceAll("_", " ")}
                            </button>
                          ))}
                        </div>
                        {mission.assigned_to && <p className="mt-2 text-xs text-muted-foreground">Assigned to {mission.assigned_to}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Route className="h-5 w-5 text-primary" />
                  Partner Relay Simulation
                </h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {partnerRelays.length === 0 ? (
                    <EmptyAdminPanel
                      icon={Route}
                      title="No partner relays available."
                      description="The current data set does not contain any partner relay records."
                    />
                  ) : (
                    partnerRelays.map((relay) => (
                      <div key={relay.id} className="rounded-lg border border-border bg-muted p-4 text-sm">
                        <p className="font-semibold text-foreground">{relay.public_summary}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Demo/integration-ready simulation · {relay.status}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(relay.redacted_match_reasons || []).map((reason) => <Badge key={reason} variant="outline">{reason}</Badge>)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-bold text-foreground">Asset Rescue Bridge</h2>
                <p className="mt-1 text-sm text-muted-foreground">Recognized school assets are restricted from public search and routed internally by the backend.</p>
                {assetDemo?.recognized && (
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    {assetDemo.asset_tag} · {assetDemo.asset_type} recognized by asset lookup.
                  </div>
                )}
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {foundItems.filter((item) => item.asset_tag || item.restricted_visibility).length === 0 ? (
                    <EmptyAdminPanel
                      icon={ShieldCheck}
                      title="No restricted assets available."
                      description="The current data set does not contain any restricted asset intake records."
                    />
                  ) : (
                    foundItems.filter((item) => item.asset_tag || item.restricted_visibility).map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-muted p-4 text-sm">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.asset_tag || "restricted item"} · {item.status}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sentinel" className="space-y-4">
              {sentinelAlerts.length === 0 ? (
                <EmptyAdminPanel
                  icon={AlertTriangle}
                  title="No Loss Sentinel alerts available."
                  description="The current data set does not contain any active prevention alerts."
                />
              ) : (
                sentinelAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-foreground">{alert.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{alert.category} · observed {alert.observed_count} vs baseline {alert.baseline_count}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{alert.severity}</Badge>
                    </div>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Reasons</p>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {(alert.reasons || []).map((reason) => <li key={reason}>{reason}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Suggested actions</p>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {(alert.suggested_actions || []).map((action) => <li key={action}>{action}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab("recovery")}
                      >
                        Create recovery mission
                      </Button>
                      {["acknowledged", "resolved", "dismissed"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          onClick={() => updateAlertMutation.mutate({ id: alert.id, updates: { status } })}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="support">
              <div className="surface-card p-5">
                <SupportTicketsList/>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="surface-card p-5"><AdminUserManagement/></div>
            </TabsContent>

            <TabsContent value="sysconfig">
              <div className="surface-card p-5"><AdminSystemSettings/></div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
