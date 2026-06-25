import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { appClient } from "@/api/appClient";
import { translateCategory } from "@/lib/i18n-helpers";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Check, X, HelpCircle, ExternalLink, Inbox, MessageSquare,
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

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 py-4 last:border-none">
      <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Inbox className="h-8 w-8 text-slate-300" aria-hidden="true" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  useEffect(() => { document.title = "Admin Dashboard — Lost Then Found"; }, []);
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Items query ─────────────────────────────────────────────────────────────

  const { data: rawItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["staffPendingItems"],
    queryFn: () => appClient.items.list(),
    refetchInterval: 30000,
  });
  const pendingItems = rawItems.filter((item) => item.status === "pending_review");

  // ── Claims query ────────────────────────────────────────────────────────────

  const { data: rawClaims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["staffPendingClaims"],
    queryFn: () => appClient.entities.Claim.list("-updated_date", 500),
    refetchInterval: 30000,
  });
  const pendingClaims = rawClaims.filter(
    (c) => c.status === "submitted" || c.status === "under_review",
  );

  // ── Item mutations ──────────────────────────────────────────────────────────

  const itemMutation = useMutation({
    mutationFn: ({ id, status }) => appClient.items.update(id, { status }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["staffPendingItems"] });
      const previous = queryClient.getQueryData(["staffPendingItems"]);
      queryClient.setQueryData(["staffPendingItems"], (old = []) =>
        old.filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["staffPendingItems"], ctx.previous);
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    },
    onSuccess: (_data, { status }) => {
      toast({ title: status === "published" ? "Item approved" : "Item rejected" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["staffPendingItems"] }),
  });

  // ── Claim mutations ─────────────────────────────────────────────────────────

  const claimMutation = useMutation({
    mutationFn: ({ id, action }) => {
      if (action === "approve") return appClient.claims.approve(id);
      if (action === "reject") return appClient.claims.reject(id);
      return appClient.claims.requestMoreInfo(id, {
        message: "Please provide more identifying details",
      });
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["staffPendingClaims"] });
      const previous = queryClient.getQueryData(["staffPendingClaims"]);
      queryClient.setQueryData(["staffPendingClaims"], (old = []) =>
        old.filter((c) => c.id !== id),
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["staffPendingClaims"], ctx.previous);
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    },
    onSuccess: (_data, { action }) => {
      const labels = { approve: "Claim approved", reject: "Claim rejected", info: "Info requested" };
      toast({ title: labels[action] ?? "Done" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["staffPendingClaims"] }),
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="page-shell max-w-5xl py-10">
      <div className="page-header">
        <h1 className="page-title">Work Queue</h1>
        <p className="page-subtitle">Review pending items, claims, and support requests.</p>
      </div>

      <Tabs defaultValue="items">
        <TabsList className="mb-6 w-full justify-start gap-1 bg-transparent p-0 border-b border-slate-200 rounded-none h-auto">
          <TabsTrigger
            value="items"
            className="rounded-none border-b-2 border-transparent pb-3 text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Pending Items
            {pendingItems.length > 0 && (
              <Badge className="ml-1.5 h-5 min-w-5 px-1 text-[10px]" aria-label={`${pendingItems.length} pending`}>
                {pendingItems.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="claims"
            className="rounded-none border-b-2 border-transparent pb-3 text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Claims
            {pendingClaims.length > 0 && (
              <Badge className="ml-1.5 h-5 min-w-5 px-1 text-[10px]" aria-label={`${pendingClaims.length} pending`}>
                {pendingClaims.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="support"
            className="rounded-none border-b-2 border-transparent pb-3 text-sm data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            Support
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Pending Items ─────────────────────────────────────────── */}
        <TabsContent value="items">
          <div className="surface-card divide-y divide-slate-100 overflow-hidden">
            {itemsLoading ? (
              <div className="px-6 py-2">
                {[1, 2, 3].map((i) => <RowSkeleton key={i} />)}
              </div>
            ) : pendingItems.length === 0 ? (
              <EmptyState message="No items pending review" />
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-4 px-6 py-4"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {item.photo_urls?.[0] ? (
                      <img
                        src={item.photo_urls[0]}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Inbox className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.title || "Untitled item"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.category ? translateCategory(t, item.category) : ""}
                      {item.location_found ? ` · ${item.location_found}` : ""}
                      {item.date_found ? ` · ${item.date_found}` : ""}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="hidden shrink-0 text-xs text-slate-400 sm:block">
                    {timeAgo(item.created_date)}
                  </span>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[36px] gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      disabled={itemMutation.isPending}
                      onClick={() => itemMutation.mutate({ id: item.id, status: "published" })}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[36px] gap-1.5 text-red-700 border-red-200 hover:bg-red-50"
                      disabled={itemMutation.isPending}
                      onClick={() => itemMutation.mutate({ id: item.id, status: "archived" })}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── TAB 2: Claims ────────────────────────────────────────────────── */}
        <TabsContent value="claims">
          <div className="surface-card divide-y divide-slate-100 overflow-hidden">
            {claimsLoading ? (
              <div className="px-6 py-2">
                {[1, 2, 3].map((i) => <RowSkeleton key={i} />)}
              </div>
            ) : pendingClaims.length === 0 ? (
              <EmptyState message="No claims pending review" />
            ) : (
              pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex flex-wrap items-start gap-4 px-6 py-4"
                >
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {claim.claimant_name || "Unknown claimant"}
                      </p>
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {claim.found_item_title || "Item claim"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {timeAgo(claim.updated_date)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {claim.found_item_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-[36px] gap-1.5 text-slate-600"
                        asChild
                      >
                        <Link to={`/ItemDetails?id=${claim.found_item_id}`}>
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          View Item
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[36px] gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      disabled={claimMutation.isPending}
                      onClick={() => claimMutation.mutate({ id: claim.id, action: "approve" })}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[36px] gap-1.5 text-red-700 border-red-200 hover:bg-red-50"
                      disabled={claimMutation.isPending}
                      onClick={() => claimMutation.mutate({ id: claim.id, action: "reject" })}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[36px] gap-1.5 text-slate-600"
                      disabled={claimMutation.isPending}
                      onClick={() => claimMutation.mutate({ id: claim.id, action: "info" })}
                    >
                      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      Need Info
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── TAB 3: Support ───────────────────────────────────────────────── */}
        <TabsContent value="support">
          <div className="surface-card px-8 py-16 text-center">
            <MessageSquare className="mx-auto mb-4 h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">Support queue</p>
            <p className="mt-1 text-xs text-slate-400">Coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
