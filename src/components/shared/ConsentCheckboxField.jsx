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
      <div
        className={cn(
          "rounded-xl border px-4 py-4 transition-colors",
          checked ? palette.active : palette.base,
          className
        )}>
        <div className="flex items-start gap-4">
          <Checkbox
            id={id}
            checked={checked}
            onClick={(event) => event.stopPropagation()}
            onCheckedChange={(value) => onCheckedChange(value === true)}
            aria-invalid={Boolean(error)}
          />
          <label
            htmlFor={id}
            className={cn(
              "flex-1 cursor-pointer text-left text-sm font-medium leading-6 text-foreground transition-colors"
            )}>
            {children}
          </label>
        </div>
      </div>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
