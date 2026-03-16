/**
 * FindBack AI - User Dashboard
 * Students/staff can track submitted lost reports, claim history,
 * AI match suggestions, and notification updates.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import StatusBadge from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle, FileCheck, Bell, Eye,
  Brain
} from "lucide-react";

export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { user, navigateToLogin } = useAuth();
  const { toast } = useToast();

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

  // Fetch user's notifications
  const { data: notifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ["userNotifications", user?.email],
    queryFn: () => appClient.entities.Notification.filter({ user_email: user.email }, "-created_date", 20),
    enabled: !!user?.email,
  });

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: (id) => appClient.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userNotifications"] }),
  });

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
                    <div className="flex items-start justify-between gap-4">
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
                    <div className="flex items-start justify-between gap-4">
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
                      </div>
                      <Link to={`/ItemDetails?id=${claim.found_item_id}`}>
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
