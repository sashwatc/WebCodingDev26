import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/ui/StatusBadge";
import ClaimCaseMessageThread from "@/components/claims/ClaimCaseMessageThread";
import {
  Bell, Bookmark, CheckCircle2, ExternalLink,
  FileCheck, Package, Ticket, X,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function truncate(str, len) {
  if (!str || str.length <= len) return str || "";
  return str.slice(0, len).trimEnd() + "…";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionShell({ title, badge, children }) {
  return (
    <section aria-labelledby={`sh-${title.replace(/\s/g, "-").toLowerCase()}`}>
      <div className="mb-4 flex items-center gap-2">
        <h2
          id={`sh-${title.replace(/\s/g, "-").toLowerCase()}`}
          className="text-lg font-bold text-foreground"
        >
          {title}
        </h2>
        {badge != null && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyCard({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border p-4">
      <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UserDashboard() {
  useEffect(() => { document.title = "My Recovery — Lost Then Found"; }, []);
  const navigate   = useNavigate();
  const queryClient = useQueryClient();
  const { user, navigateToLogin } = useAuth();

  const [chatClaim,  setChatClaim]  = useState(null);
  const [savedIds,   setSavedIds]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("ltf-saved-items") || "[]"); }
    catch { return []; }
  });

  // ── Claims ────────────────────────────────────────────────────────────────

  const { data: rawClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["userClaims", user?.email],
    queryFn: () => appClient.entities.Claim.list("-updated_date", 500),
    enabled: !!user?.email,
  });
  const myClaims = rawClaims.filter((c) => c.claimant_email === user?.email);
  const activeClaims = myClaims.filter((c) => c.status !== "completed" && c.status !== "rejected");
  const needsReply   = activeClaims.filter((c) => c.status === "need_more_info");

  // ── Saved items ───────────────────────────────────────────────────────────

  const { data: savedItems = [], isLoading: savedLoading } = useQuery({
    queryKey: ["savedItems", savedIds.join(",")],
    queryFn: () =>
      Promise.all(savedIds.map((id) => appClient.items.get(id).catch(() => null))).then((r) =>
        r.filter(Boolean),
      ),
    enabled: savedIds.length > 0,
    staleTime: 120_000,
  });

  const unsave = (id) => {
    const next = savedIds.filter((s) => s !== id);
    setSavedIds(next);
    try { localStorage.setItem("ltf-saved-items", JSON.stringify(next)); } catch { /* ignore */ }
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  const { data: allNotifs = [], isLoading: notifLoading } = useQuery({
    queryKey: ["userNotifications", user?.email],
    queryFn: () => appClient.recoveryPulse.notifications(),
    enabled: !!user?.email,
  });
  const notifications = allNotifs.slice(0, 5);
  const unreadCount   = allNotifs.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => appClient.recoveryPulse.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userNotifications"] }),
  });

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      try { await markReadMutation.mutateAsync(notif.id); } catch { /* ignore */ }
    }
    if (notif.link) navigate(notif.link);
  };

  // ── Unauthenticated ───────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="page-shell max-w-lg py-20 text-center">
        <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-bold text-foreground">My Recovery</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign in to track your claims and saved items.</p>
        <Button onClick={navigateToLogin}>Sign in</Button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-shell max-w-4xl space-y-12 py-10">

      {/* Header */}
      <div className="page-header">
        <span className="page-kicker">Personal command center</span>
        <h1 className="page-title">
          My Recovery
        </h1>
        <p className="page-subtitle">
          Welcome back{user.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}. Track your claims, saved items, and alerts.
        </p>
      </div>

      {/* ── Section 1: Active Claims ────────────────────────────────────── */}
      <SectionShell title="Active Claims" badge={needsReply.length}>
        {claimsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <RowSkeleton key={i} />)}
          </div>
        ) : activeClaims.length === 0 ? (
          <EmptyCard icon={FileCheck} message="No active claims. Find an item and submit a claim to get started." />
        ) : (
          <div className="space-y-3">
            {activeClaims.map((claim) => {
              const needsInfo = claim.status === "need_more_info";
              return (
                <div
                  key={claim.id}
                  className={`flex flex-wrap items-start gap-4 rounded-xl border bg-card p-4 ${
                    needsInfo ? "border-destructive/50 ring-1 ring-destructive/20" : "border-border"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {claim.photo_urls?.[0] ? (
                      <img src={claim.photo_urls[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground/30" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {needsInfo && (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
                          Response Required
                        </span>
                      )}
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {claim.found_item_title || "Claim"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {timeAgo(claim.updated_date)}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {(claim.status === "submitted" || claim.status === "under_review") && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/ItemDetails?id=${claim.found_item_id}`}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                          View Item
                        </Link>
                      </Button>
                    )}
                    {claim.status === "need_more_info" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setChatClaim(claim)}
                      >
                        Reply to Staff
                      </Button>
                    )}
                    {claim.status === "approved" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/PickupPass?claim_id=${claim.id}`}>
                          <Ticket className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                          View Pickup Pass
                        </Link>
                      </Button>
                    )}
                    {claim.status === "completed" && (
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                        Returned
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionShell>

      {/* ── Section 2: Saved Items ──────────────────────────────────────── */}
      <SectionShell title="Saved Items">
        {savedIds.length === 0 ? (
          <EmptyCard icon={Bookmark} message="No saved items yet. Tap Save on any item detail page to bookmark it here." />
        ) : savedLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {savedIds.map((id) => <Skeleton key={id} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                {/* Unsave button */}
                <button
                  type="button"
                  onClick={() => unsave(item.id)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                  aria-label={`Remove ${item.title} from saved items`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>

                {/* Thumbnail */}
                {item.photo_urls?.[0] && (
                  <div className="h-28 overflow-hidden rounded-lg bg-muted">
                    <img src={item.photo_urls[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                )}

                <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>

                <Button variant="outline" size="sm" asChild className="mt-auto">
                  <Link to={`/ItemDetails?id=${item.id}`}>View item</Link>
                </Button>
              </div>
            ))}
            {/* Show stubs for saved IDs not fetched (e.g. deleted items) */}
            {savedIds
              .filter((id) => !savedItems.find((i) => i.id === id))
              .map((id) => (
                <div key={id} className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">Item unavailable</p>
                  <button
                    type="button"
                    onClick={() => unsave(id)}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        )}
      </SectionShell>

      {/* ── Section 3: Notifications ────────────────────────────────────── */}
      <SectionShell title="Notifications" badge={unreadCount}>
        {notifLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyCard icon={Bell} message="No notifications yet." />
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                type="button"
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  notif.is_read
                    ? "border-border bg-card hover:bg-muted/40"
                    : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                }`}
                onClick={() => handleNotifClick(notif)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${notif.is_read ? "bg-muted" : "bg-primary/10"}`}>
                    <Bell className={`h-3.5 w-3.5 ${notif.is_read ? "text-muted-foreground" : "text-primary"}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${notif.is_read ? "text-foreground" : "font-semibold text-foreground"}`}>
                      {notif.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {truncate(notif.message, 80)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {timeAgo(notif.created_date)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionShell>

      {/* ── Case Chat Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!chatClaim} onOpenChange={(open) => { if (!open) setChatClaim(null); }}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="text-base">
              Reply to Staff
            </DialogTitle>
            <DialogDescription className="text-xs">
              {chatClaim?.found_item_title
                ? `Re: ${chatClaim.found_item_title}`
                : "Claim case conversation"}
            </DialogDescription>
          </DialogHeader>
          {chatClaim && (
            <div className="p-4">
              <ClaimCaseMessageThread
                claim={chatClaim}
                viewerRole="claimant"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
