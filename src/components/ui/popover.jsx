// Popover: a click-triggered floating panel built on Radix UI's
// `@radix-ui/react-popover`. Compose as:
// <Popover><PopoverTrigger/><PopoverContent>...</PopoverContent></Popover>.
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

// Root provider holding the popover's open/close state.
const Popover = PopoverPrimitive.Root

// The element that toggles the popover open.
const PopoverTrigger = PopoverPrimitive.Trigger

// Optional alternate positioning anchor (position relative to this instead of
// the trigger).
const PopoverAnchor = PopoverPrimitive.Anchor

// Content: the floating panel. Self-portals and exposes `align` (default
// "center") and `sideOffset` (default 4px) for placement relative to the trigger.
const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props} />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
