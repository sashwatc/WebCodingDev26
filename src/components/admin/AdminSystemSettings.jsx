/**
 * FindBack AI - Admin System Settings
 *
 * Admin panel for configuring the two demo lookup lists used across the app:
 * item categories and pickup locations. This is a demo-only feature — values
 * are persisted to the browser's localStorage (no backend), so changes are
 * per-device. Renders two `EditableList` widgets plus a "reset to defaults"
 * button.
 */
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Settings2 } from "lucide-react";

// localStorage keys under which the editable lists are persisted.
const CAT_KEY = "ltf_demo_categories";
const LOC_KEY = "ltf_demo_locations";

// Seed values used on first load and when the admin resets to defaults.
const DEFAULT_CATEGORIES = ["Electronics", "Clothing", "Books", "ID / Keys", "Sports", "Other"];
const DEFAULT_LOCATIONS = ["Main Office", "Gym", "Library", "Cafeteria", "Parking Lot", "Field House"];

// Read a JSON list from localStorage, falling back to defaults on missing key
// or parse error (e.g. corrupted/invalid storage).
function loadList(key, defaults) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaults;
  } catch {
    return defaults;
  }
}

// Reusable presentational widget: shows a titled list of string items, each
// removable, plus an input + add button. Parent owns the array; this calls
// `onChange` with the next array. `newItem` is local state for the add input.
function EditableList({ title, items, onChange }) {
  const [newItem, setNewItem] = useState("");

  // Append the trimmed input value; ignore empty or duplicate entries.
  const add = () => {
    const val = newItem.trim();
    if (!val || items.includes(val)) return;
    onChange([...items, val]);
    setNewItem("");
  };

  // Remove the item at `index` by filtering it out of the array.
  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <h4 className="section-label">{title}</h4>
      {/* Existing items list — each row shows the value and a remove button */}
      <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-sm text-foreground">{item}</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => remove(index)}
              aria-label={`Remove ${item}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      {/* Add row — input plus button; Enter key also triggers add() */}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={`Add ${title.toLowerCase()}…`}
          className="h-9 text-sm"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <Button type="button" size="sm" onClick={add} disabled={!newItem.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminSystemSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  // Lists are lazily initialized from localStorage (or defaults) on mount.
  const [categories, setCategories] = useState(() => loadList(CAT_KEY, DEFAULT_CATEGORIES));
  const [locations, setLocations] = useState(() => loadList(LOC_KEY, DEFAULT_LOCATIONS));

  // Persist category edits to state + localStorage and confirm with a toast.
  const handleCatChange = (next) => {
    setCategories(next);
    localStorage.setItem(CAT_KEY, JSON.stringify(next));
    toast({ title: t("admin_sysconfig.saved", "Settings saved") });
  };

  // Persist location edits to state + localStorage and confirm with a toast.
  const handleLocChange = (next) => {
    setLocations(next);
    localStorage.setItem(LOC_KEY, JSON.stringify(next));
    toast({ title: t("admin_sysconfig.saved", "Settings saved") });
  };

  // Restore both lists to their seed defaults and clear stored overrides.
  const reset = () => {
    setCategories(DEFAULT_CATEGORIES);
    setLocations(DEFAULT_LOCATIONS);
    localStorage.removeItem(CAT_KEY);
    localStorage.removeItem(LOC_KEY);
    toast({ title: t("admin_sysconfig.reset", "Reset to defaults") });
  };

  return (
    <div className="space-y-6">
      {/* Header: title icon + "demo data, stored locally" note */}
      <div className="flex items-center gap-2 pb-1">
        <Settings2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t("admin_sysconfig.title", "System Settings")}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{t("admin_sysconfig.demo_note", "Demo data — stored locally")}</span>
      </div>

      {/* Two editable lists side by side: categories and pickup locations */}
      <div className="grid gap-6 md:grid-cols-2">
        <EditableList
          title={t("admin_sysconfig.categories", "Item Categories")}
          items={categories}
          onChange={handleCatChange}
        />
        <EditableList
          title={t("admin_sysconfig.locations", "Pickup Locations")}
          items={locations}
          onChange={handleLocChange}
        />
      </div>

      {/* Reset-to-defaults action */}
      <div className="pt-2 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={reset}>
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
