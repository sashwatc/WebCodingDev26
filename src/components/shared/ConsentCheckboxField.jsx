/**
 * ConsentCheckboxField.jsx
 * --------------------------------------------------------------------------
 * A styled, card-like consent checkbox used in forms (e.g. agreeing to terms
 * before submitting a report). The whole card changes color when checked, and
 * an optional validation error renders beneath it.
 *
 * Props:
 *   id              - element id linking the Checkbox and its <label>.
 *   checked         - controlled checked state (boolean).
 *   onCheckedChange - called with a strict boolean when toggled.
 *   children        - the consent label content (rendered inside the <label>).
 *   error           - optional error message; presence also flips aria-invalid.
 *   className       - extra classes merged onto the card container.
 *   tone            - "slate" (default, neutral) or "amber" (warning-styled card).
 */

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function ConsentCheckboxField({
  id,
  checked,
  onCheckedChange,
  children,
  error,
  className,
  tone = "slate",
}) {
  // Pick the card's color scheme based on `tone`. Each palette defines the
  // resting ("base") look and the highlighted ("active") look when checked.
  const palette =
    tone === "amber"
      ? {
          base: "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20",
          active: "border-emerald-500 bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/35",
        }
      : {
          base: "border-border bg-muted/50",
          active: "border-emerald-500 bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/35",
        };

  return (
    <div className="space-y-2">
      {/* Card container: swaps to the active palette when checked */}
      <div
        className={cn(
          "rounded-xl border px-4 py-4 transition-colors",
          checked ? palette.active : palette.base,
          className
        )}>
        <div className="flex items-start gap-4">
          {/* Checkbox: stopPropagation prevents the click from bubbling to the card;
              onCheckedChange normalizes Radix's value to a strict boolean */}
          <Checkbox
            id={id}
            checked={checked}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(value) => onCheckedChange(value === true)}
            aria-invalid={Boolean(error)}
          />
          {/* Clickable label (htmlFor=id toggles the checkbox); holds the consent text */}
          <label
            htmlFor={id}
            className={cn(
              "flex-1 cursor-pointer text-left text-sm font-medium leading-6 text-foreground transition-colors"
            )}>
            {children}
          </label>
        </div>
      </div>
      {/* Validation error message, shown only when `error` is set */}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
