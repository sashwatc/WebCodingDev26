// Checkbox: accessible on/off (and indeterminate) control built on
// @radix-ui/react-checkbox. Supports controlled (`checked`/`onCheckedChange`)
// or uncontrolled use; renders a check mark via the Indicator when selected.
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

// Checkbox: the styled Radix Root box; data-[state=checked] selectors fill it.
// The nested Indicator (shown only when checked) holds the lucide Check icon. forwardRef.
const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-input bg-background text-primary shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}>
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4.5 w-4.5 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
