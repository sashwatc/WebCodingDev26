"use client"

/**
 * Tooltip — hover/focus popup label, wrapping Radix UI's
 * `@radix-ui/react-tooltip`.
 *
 *   <TooltipProvider>           // once, high in the tree
 *     <Tooltip>
 *       <TooltipTrigger>?</TooltipTrigger>
 *       <TooltipContent>help text</TooltipContent>
 *     </Tooltip>
 *   </TooltipProvider>
 */

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

// Wraps the app (or a subtree) to share delay/timing config across tooltips.
const TooltipProvider = TooltipPrimitive.Provider

// Root pairing a single trigger with its content; owns the open state.
const Tooltip = TooltipPrimitive.Root

// The element the user hovers/focuses to reveal the tooltip.
const TooltipTrigger = TooltipPrimitive.Trigger

// The floating bubble (rendered in a Portal). `sideOffset` (default 4) sets the
// gap from the trigger; animates in/out per data-state/data-side.
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props} />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
