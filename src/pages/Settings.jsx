/**
 * Settings.jsx — Account & app preferences page.
 *
 * Purpose: lets a signed-in user manage notification preferences, appearance,
 * and accessibility, and sign out. It mixes two persistence layers:
 *   - Backend-persisted notification prefs (email/SMS toggles + phone number),
 *     fetched and saved via appClient.recoveryPulse.
 *   - Purely client-side prefs stored in localStorage and applied to the
 *     <html> element: per-category notification toggles, theme (light/dark/
 *     system), display density, high-contrast, and reduced-motion.
 *
 * Sections rendered: 1) Notifications, 2) Appearance, 3) Display density,
 * 4) Accessibility, 5) Account.
 */
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { useAuth } from "@/lib/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

// ── Simple toggle row ─────────────────────────────────────────────────────────
// Reusable labelled Switch row (label + optional description on the left,
// the toggle on the right). Used throughout the Notifications/Accessibility cards.
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
  const { user, logout } = useAuth(); // current account + sign-out

  // ── Notification prefs (backend-persisted) ──────────────────────────────────
  const queryClient = useQueryClient();
  // Fetch the user's saved notification preferences (email/SMS/phone).
  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ["notifPrefs"],
    queryFn: () => appClient.recoveryPulse.preferences(),
    enabled: !!user?.email, // only once we know who the user is
  });
  const { toast } = useToast();
  const [savingPref, setSavingPref] = useState(false); // disables toggles mid-save

  // Patch+save notification prefs, then refetch so the UI reflects persisted state.
  const updatePref = async (patch) => {
    setSavingPref(true);
    try {
      await appClient.recoveryPulse.updatePreferences(patch);
      // Refetch so the toggles reflect the persisted state instead of snapping back.
      queryClient.invalidateQueries({ queryKey: ["notifPrefs"] });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not save preference", description: error?.message || "Please try again." });
    } finally {
      setSavingPref(false);
    }
  };

  // Editable phone number for SMS notifications (seeded from saved prefs).
  const [phoneDraft, setPhoneDraft] = useState("");
  useEffect(() => { setPhoneDraft(prefs?.phone_number || ""); }, [prefs?.phone_number]);

  // ── Appearance (theme, localStorage-persisted) ──────────────────────────────
  const getTheme = () => localStorage.getItem("ltf-theme") || "system";
  const [theme, setThemeState] = useState(getTheme);

  // Apply the chosen theme by toggling the `dark` class on <html> (system mode
  // follows the OS prefers-color-scheme), then persist the choice.
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

  // ── Per-category notification prefs (client-side only) ──────────────────────
  // A map of { matches, claims, chat, pickup, system } -> bool, kept in localStorage.
  const [notifPrefs, setNotifPrefs] = useState(() =>
    JSON.parse(localStorage.getItem("ltf_notif_prefs") || "{}")
  );
  // Update one category toggle and persist the whole map.
  const setNotifPref = (key, val) => {
    const next = { ...notifPrefs, [key]: val };
    setNotifPrefs(next);
    localStorage.setItem("ltf_notif_prefs", JSON.stringify(next));
  };

  // ── Display density (client-side, reflected via data-density on <html>) ──────
  const [density, setDensity] = useState(
    () => localStorage.getItem("ltf_density") || "comfortable"
  );
  // Set density, persist it, and expose it as a `data-density` attribute for CSS.
  const applyDensity = (d) => {
    setDensity(d);
    localStorage.setItem("ltf_density", d);
    document.documentElement.setAttribute("data-density", d);
  };
  // On mount, apply the persisted density to <html>.
  useEffect(() => { document.documentElement.setAttribute("data-density", density); }, []);

  // ── High contrast (client-side, reflected via data-hc on <html>) ────────────
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem("ltf_hc") === "true"
  );
  // Toggle high contrast, persist it, and expose it as `data-hc` for CSS.
  const applyHighContrast = (val) => {
    setHighContrast(val);
    localStorage.setItem("ltf_hc", String(val));
    document.documentElement.setAttribute("data-hc", String(val));
  };
  // On mount, apply the persisted high-contrast setting to <html>.
  useEffect(() => { document.documentElement.setAttribute("data-hc", String(highContrast)); }, []);

  // ── Accessibility: reduced motion (client-side flag) ────────────────────────
  const [reduceMotion, setReduceMotion] = useState(
    () => localStorage.getItem("ltf-reduced-motion") === "1"
  );
  // Persist the reduced-motion flag (presence of the key = enabled).
  const toggleReduceMotion = (val) => {
    if (val) localStorage.setItem("ltf-reduced-motion", "1");
    else localStorage.removeItem("ltf-reduced-motion");
    setReduceMotion(val);
  };

  // ── Five stacked preference cards ──
  return (
    <div className="page-shell max-w-2xl space-y-8 py-10">
      {/* Page header */}
      <div className="page-header">
        <span className="page-kicker">Account</span>
        <h1 className="page-title">Settings</h1>
      </div>

      {/* 1 — Notifications: backend email/SMS toggles + phone, then per-category prefs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ToggleRow
            id="notif-email"
            label="Email notifications"
            checked={prefs?.email_notifications_enabled ?? true}
            onCheckedChange={(v) => updatePref({ email_notifications_enabled: v })}
            disabled={prefsLoading || savingPref}
          />
          <ToggleRow
            id="notif-sms"
            label="SMS notifications"
            description={!prefs?.phone_number ? "Add a phone number below to enable" : undefined}
            checked={prefs?.sms_notifications_enabled ?? false}
            onCheckedChange={(v) => updatePref({ sms_notifications_enabled: v, sms_opt_in: v })}
            disabled={prefsLoading || savingPref || !prefs?.phone_number}
          />
          {/* Phone number editor — local draft, saved on demand (SMS requires it) */}
          <div className="flex items-end justify-between gap-4 py-3">
            <div className="min-w-0 flex-1">
              <Label htmlFor="phone-number" className="text-sm font-medium text-foreground">Phone number</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Used for SMS alerts — international format, e.g. +15550123456</p>
              <Input
                id="phone-number"
                type="tel"
                inputMode="tel"
                placeholder="+15550123456"
                value={phoneDraft}
                onChange={(event) => setPhoneDraft(event.target.value)}
                className="mt-2 max-w-xs"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={savingPref || phoneDraft.trim() === (prefs?.phone_number || "")}
              onClick={() => updatePref({ phone_number: phoneDraft.trim() })}
            >
              Save
            </Button>
          </div>
          {/* In-app notifications are always on (display-only toggle) */}
          <ToggleRow
            id="notif-inapp"
            label="In-app notifications"
            description="Always on"
            checked={true}
            disabled
          />
          {/* Per-category notification toggles (client-side, default on) */}
          <div className="mt-5 border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notification types</p>
            {[
              { key: "matches", label: "Item matches", desc: "When a found item might match your lost report" },
              { key: "claims", label: "Claim updates", desc: "When your claim status changes" },
              { key: "chat", label: "Case chat", desc: "When staff send you a message" },
              { key: "pickup", label: "Pickup reminders", desc: "When your pickup pass is ready or expiring" },
              { key: "system", label: "System announcements", desc: "Occasional system-wide notices" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={notifPrefs[key] ?? true} onCheckedChange={v => setNotifPref(key, v)} aria-label={label} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2 — Appearance: light / dark / system theme selector */}
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

      {/* 3 — Display density: comfortable vs compact spacing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Display density</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Controls spacing throughout the app</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["comfortable", "compact"].map(d => (
              <button
                key={d}
                onClick={() => applyDensity(d)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  density === d
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4 — Accessibility: reduce motion + high contrast */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Accessibility</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ToggleRow
            id="reduce-motion"
            label="Reduce motion"
            description="Minimises animations across the app"
            checked={reduceMotion}
            onCheckedChange={toggleReduceMotion}
          />
          <div className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">High contrast</p>
              <p className="text-xs text-muted-foreground">Increase color contrast for readability</p>
            </div>
            <Switch checked={highContrast} onCheckedChange={applyHighContrast} aria-label="High contrast" />
          </div>
        </CardContent>
      </Card>

      {/* 5 — Account: name, email, role badge, and sign-out */}
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
