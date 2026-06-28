// Badge: small inline label/pill for statuses, counts, or tags. Plain styled
// div (no Radix); appearance is driven by cva variants. `badgeVariants` is
// also exported so other components can reuse the same styles.
import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// cva config: `variant` selects the color/treatment — default, secondary,
// destructive, outline, or "evidence" (muted, lowercase, normal tracking).
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary text-primary-foreground shadow-none",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-destructive/25 bg-destructive/10 text-destructive",
        outline: "border-border bg-background text-foreground",
        evidence:
          "border-border bg-muted/70 text-muted-foreground normal-case tracking-normal text-xs font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Badge: renders the pill div; accepts `variant` plus any div props/children.
function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
