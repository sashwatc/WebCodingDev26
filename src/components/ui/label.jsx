// Label: an accessible form label built on Radix UI's `@radix-ui/react-label`,
// which improves click/focus behavior over a bare <label>. Pair with a control
// via htmlFor (or by nesting). Use as: <Label htmlFor="email">Email</Label>.
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// Base style definition (via cva). It has no variants here; it also dims the
// label when an associated peer input is disabled (peer-disabled:*).
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

// Label: forwards its ref to the Radix Root and merges the base styles with any
// caller-provided className.
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
