import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// ── Simple toggle row ─────────────────────────────────────────────────────────
function ToggleRow({ id, label, description, checked, onCheckedChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <Label htmlFor={id} className={`text-sm font-medium ${disabled ? "text-muted-foreground" : "text-foreground"}`}>
          {label}
        </Label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  useEffect(() => { document.title = "Settings — Lost Then Found"; }, []);
  const { user, logout } = useAuth();

  // ── Notification prefs ──────────────────────────────────────────────────────
  const { data: prefs } = useQuery({
    queryKey: ["notifPrefs"],
    queryFn: () => appClient.recoveryPulse.preferences(),
    enabled: !!user?.email,
  });

  const updatePref = async (patch) => {
    try { await appClient.recoveryPulse.updatePreferences(patch); } catch { /* silent */ }
  };

  // ── Appearance ──────────────────────────────────────────────────────────────
  const getTheme = () => localStorage.getItem("ltf-theme") || "system";
  const [theme, setThemeState] = useState(getTheme);

  const applyTheme = (val) => {
    const root = document.documentElement;
    if (val === "dark") root.classList.add("dark");
    else if (val === "light") root.classList.remove("dark");
    else {
      // system
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
      else root.classList.remove("dark");
    }
    localStorage.setItem("ltf-theme", val);
    setThemeState(val);
  };

  // ── Accessibility ───────────────────────────────────────────────────────────
  const [reduceMotion, setReduceMotion] = useState(
    () => localStorage.getItem("ltf-reduced-motion") === "1"
  );
  const toggleReduceMotion = (val) => {
    if (val) localStorage.setItem("ltf-reduced-motion", "1");
    else localStorage.removeItem("ltf-reduced-motion");
    setReduceMotion(val);
  };

  return (
    <div className="page-shell max-w-2xl space-y-8 py-10">
      <div className="page-header">
        <span className="page-kicker">Account</span>
        <h1 className="page-title">Settings</h1>
      </div>

      {/* 1 — Notifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ToggleRow
            id="notif-email"
            label="Email notifications"
            checked={prefs?.email_enabled ?? true}
            onCheckedChange={(v) => updatePref({ email_enabled: v })}
          />
          <ToggleRow
            id="notif-sms"
            label="SMS notifications"
            description={!user?.phone_number ? "Requires phone number in profile" : undefined}
            checked={prefs?.sms_enabled ?? false}
            onCheckedChange={(v) => updatePref({ sms_enabled: v })}
            disabled={!user?.phone_number}
          />
          <ToggleRow
            id="notif-inapp"
            label="In-app notifications"
            description="Always on"
            checked={true}
            disabled
          />
        </CardContent>
      </Card>

      {/* 2 — Appearance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {["light", "dark", "system"].map((t) => (
              <Button
                key={t}
                variant={theme === t ? "default" : "outline"}
                size="sm"
                onClick={() => applyTheme(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3 — Accessibility */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Accessibility</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleRow
            id="reduce-motion"
            label="Reduce motion"
            description="Minimises animations across the app"
            checked={reduceMotion}
            onCheckedChange={toggleReduceMotion}
          />
        </CardContent>
      </Card>

      {/* 4 — Account */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          {user?.role && (
            <Badge variant="outline" className="capitalize">{user.role}</Badge>
          )}
          <div className="pt-2">
            <Button variant="destructive" size="sm" onClick={logout}>Sign Out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
