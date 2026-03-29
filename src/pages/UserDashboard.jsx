/**
 * FindBack AI - User Dashboard
 * Students/staff can track submitted lost reports, claim history,
 * AI match suggestions, and notification updates.
 */

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import StatusBadge from "@/components/ui/StatusBadge";
import RecordThumbnail from "@/components/shared/RecordThumbnail";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { getPrimaryRecordPhoto } from "@/lib/media";
import {
  AlertTriangle, FileCheck, Bell, Eye,
  Brain, CheckCircle2, Loader2, Star
} from "lucide-react";

export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { user, navigateToLogin } = useAuth();
  const { toast } = useToast();
  const [reviewDrafts, setReviewDrafts] = useState({});

  // Fetch user's lost reports
  const { data: lostReports = [], isLoading: lrLoading } = useQuery({
    queryKey: ["userLostReports", user?.email],
    queryFn: () => appClient.entities.LostReport.filter({ contact_email: user.email }),
    enabled: !!user?.email,
  });

  // Fetch user's claims
  const { data: claims = [], isLoading: clLoading } = useQuery({
    queryKey: ["userClaims", user?.email],
    queryFn: () => appClient.entities.Claim.filter({ claimant_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: foundItems = [] } = useQuery({
    queryKey: ["dashboardFoundItems"],
    queryFn: () => appClient.entities.FoundItem.list("-created_date", 500),
    enabled: !!user?.email,
  });

  // Fetch user's notifications
  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ["userNotifications", user?.email],
    queryFn: () => appClient.entities.Notification.filter({ user_email: user.email }, "-created_date", 20),
    enabled: !!user?.email,
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: (id) => appClient.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const confirmReceivedMutation = useMutation({
    mutationFn: async (claim) => {
      const confirmedAt = new Date().toISOString();

      await appClient.entities.Claim.update(claim.id, {
        status: "completed",
        received_confirmed_at: confirmedAt,
      });
      await appClient.entities.FoundItem.update(claim.found_item_id, {
        status: "returned",
        claim_confirmed: true,
        claim_confirmed_at: confirmedAt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Return confirmed",
        description: "The claim has been marked complete and the item is now recorded as returned.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to confirm return",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({ claim, rating, review }) => {
      const submittedAt = new Date().toISOString();

      await appClient.entities.Claim.update(claim.id, {
        claimant_rating: rating,
        claimant_review: review.trim(),
        review_status: "pending",
        review_submitted_at: submittedAt,
        review_reviewed_at: "",
      });

      await appClient.entities.FoundItem.upsertRating(claim.found_item_id, {
        claim_id: claim.id,
        rating,
        review: review.trim(),
        claimant_name: claim.claimant_name,
        reviewer_email: claim.claimant_email,
        review_status: "pending",
        review_submitted_at: submittedAt,
        review_reviewed_at: "",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Rating submitted",
        description: "Your rating is now waiting for admin approval.",
      });
    },
    onError: (error) => {
      toast({
        title: "Unable to submit rating",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const foundItemsById = useMemo(
    () =>
      foundItems.reduce((itemsById, item) => {
        itemsById[item.id] = item;
        return itemsById;
      }, {}),
    [foundItems]
  );

  const EmptyState = ({ icon: Icon, message }) => (
    <div className="text-center py-12">
      <Icon className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to view your dashboard</h1>
            <p className="text-slate-500 mb-6">
              Sign in on this device to see your reports, claims, and notifications.
            </p>
            <Button
              className="bg-[hsl(222,65%,18%)] text-white hover:bg-[hsl(222,65%,15%)]"
              onClick={async () => {
                try {
                  await navigateToLogin();
                } catch (error) {
                  toast({
                    title: "Sign in unavailable",
                    description: error.message,
                    variant: "destructive",
                  });
                }
              }}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}. Track your reports and claims here.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Lost Reports", value: lostReports.length, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
          { label: "Active Claims", value: claims.filter(c => !["completed", "rejected"].includes(c.status)).length, icon: FileCheck, color: "text-blue-600 bg-blue-50" },
          { label: "Unread Alerts", value: notifications.filter(n => !n.is_read).length, icon: Bell, color: "text-red-600 bg-red-50" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="reports">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">My Lost Reports</TabsTrigger>
          <TabsTrigger value="claims">My Claims</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Lost Reports Tab */}
        <TabsContent value="reports">
          {lrLoading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : lostReports.length === 0 ? (
            <EmptyState icon={AlertTriangle} message="You haven't submitted any lost item reports yet." />
          ) : (
            <div className="space-y-3">
              {lostReports.map(report => (
                <Card key={report.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <RecordThumbnail
                        src={getPrimaryRecordPhoto(report)}
                        alt={report.item_type || "Lost report"}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{report.item_type}</h3>
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1 mb-2">{report.description}</p>
                        <p className="text-xs text-slate-400">
                          Reported {report.created_date ? format(new Date(report.created_date), "MMM d, yyyy") : "recently"}
                        </p>
                      </div>
                      {report.matched_items?.length > 0 && (
                        <Badge className="bg-purple-100 text-purple-800 flex-shrink-0 gap-1">
                          <Brain className="w-3 h-3" />
                          {report.matched_items.length} match{report.matched_items.length > 1 ? "es" : ""}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims">
          {clLoading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : claims.length === 0 ? (
            <EmptyState icon={FileCheck} message="You haven't submitted any claims yet." />
          ) : (
            <div className="space-y-3">
              {claims.map(claim => (
                <Card key={claim.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <RecordThumbnail
                        src={getPrimaryRecordPhoto(claim, foundItemsById[claim.found_item_id])}
                        alt={claim.found_item_title || "Claim"}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{claim.found_item_title || "Claim"}</h3>
                          <StatusBadge status={claim.status} />
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-1 mb-2">{claim.reason}</p>
                        <p className="text-xs text-slate-400">
                          Submitted {claim.created_date ? format(new Date(claim.created_date), "MMM d, yyyy") : "recently"}
                        </p>
                        {claim.admin_notes && (
                          <div className="mt-2 text-xs bg-blue-50 text-blue-700 p-2 rounded">
                            Admin note: {claim.admin_notes}
                          </div>
                        )}

                        {claim.status === "approved" && !claim.received_confirmed_at && (
                          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <p className="text-sm font-medium text-emerald-900">Have you received this item back?</p>
                            <p className="mt-1 text-xs text-emerald-700">
                              Confirm the return once the item is back in your hands so the record can be closed properly.
                            </p>
                            <Button
                              size="sm"
                              className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700"
                              disabled={confirmReceivedMutation.isPending}
                              onClick={() => confirmReceivedMutation.mutate(claim)}
                            >
                              {confirmReceivedMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              Confirm I Received It
                            </Button>
                          </div>
                        )}

                        {claim.received_confirmed_at && (
                          <p className="mt-3 text-xs text-emerald-700">
                            Confirmed received on {format(new Date(claim.received_confirmed_at), "MMM d, yyyy")}
                          </p>
                        )}

                        {(claim.status === "completed" || claim.received_confirmed_at) && (
                          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Leave a rating</p>
                                <p className="text-xs text-slate-500">
                                  Ratings are reviewed by an admin before they appear publicly.
                                </p>
                              </div>
                              {claim.review_status && (
                                <Badge
                                  className={
                                    claim.review_status === "approved"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : claim.review_status === "rejected"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                  }
                                >
                                  Review {claim.review_status}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-3 flex gap-1">
                              {Array.from({ length: 5 }).map((_, index) => {
                                const draft = reviewDrafts[claim.id] || {
                                  rating: claim.claimant_rating || 0,
                                  review: claim.claimant_review || "",
                                };
                                const filled = index < draft.rating;
                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    className="rounded-md p-1 transition hover:bg-amber-100"
                                    aria-label={`Rate ${index + 1} stars`}
                                    disabled={claim.review_status === "pending" || claim.review_status === "approved"}
                                    onClick={() =>
                                      setReviewDrafts((prev) => ({
                                        ...prev,
                                        [claim.id]: {
                                          rating: index + 1,
                                          review: prev[claim.id]?.review ?? claim.claimant_review ?? "",
                                        },
                                      }))
                                    }
                                  >
                                    <Star className={`w-5 h-5 ${filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                                  </button>
                                );
                              })}
                            </div>

                            <Textarea
                              rows={3}
                              className="mt-3 bg-white"
                              placeholder="Optional note about the return experience"
                              disabled={claim.review_status === "pending" || claim.review_status === "approved"}
                              value={(reviewDrafts[claim.id]?.review ?? claim.claimant_review ?? "")}
                              onChange={(event) =>
                                setReviewDrafts((prev) => ({
                                  ...prev,
                                  [claim.id]: {
                                    rating: prev[claim.id]?.rating ?? claim.claimant_rating ?? 0,
                                    review: event.target.value,
                                  },
                                }))
                              }
                            />

                            {claim.review_status === "approved" && claim.claimant_review && (
                              <p className="mt-2 text-xs text-emerald-700">
                                Your approved review is now visible on the item page.
                              </p>
                            )}
                            {claim.review_status === "pending" && (
                              <p className="mt-2 text-xs text-amber-700">
                                Your rating is waiting for admin approval.
                              </p>
                            )}
                            {claim.review_status === "rejected" && (
                              <p className="mt-2 text-xs text-red-700">
                                Your last rating was not approved. Update it below and resubmit.
                              </p>
                            )}

                            {claim.review_status !== "pending" && (claim.review_status !== "approved" || !claim.claimant_rating) && (
                              <Button
                                size="sm"
                                className="mt-3"
                                disabled={
                                  submitReviewMutation.isPending ||
                                  ((reviewDrafts[claim.id]?.rating ?? claim.claimant_rating ?? 0) < 1)
                                }
                                onClick={() =>
                                  submitReviewMutation.mutate({
                                    claim,
                                    rating: reviewDrafts[claim.id]?.rating ?? claim.claimant_rating ?? 0,
                                    review: reviewDrafts[claim.id]?.review ?? claim.claimant_review ?? "",
                                  })
                                }
                              >
                                {submitReviewMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Star className="w-4 h-4" />
                                )}
                                Submit Rating
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <Link to={`/ItemDetails?id=${claim.found_item_id}`} className="self-start">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="w-3.5 h-3.5" /> View Item
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          {notifLoading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} message="No notifications yet." />
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    notif.is_read ? "bg-white border-slate-100" : "bg-blue-50/50 border-blue-100"
                  }`}
                  onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${notif.is_read ? "text-slate-300" : "text-blue-500"}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${notif.is_read ? "text-slate-600" : "text-slate-900 font-medium"}`}>{notif.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{notif.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {notif.created_date ? format(new Date(notif.created_date), "MMM d") : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
