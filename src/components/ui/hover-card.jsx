"use client"

// HoverCard: a popover that appears on hover (for sighted-mouse users), built on
// Radix UI's `@radix-ui/react-hover-card`. Good for rich preview cards. Compose
// as: <HoverCard><HoverCardTrigger/><HoverCardContent>...</HoverCardContent></HoverCard>.
import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

// Root provider holding the hover-card's open/close state.
const HoverCard = HoverCardPrimitive.Root

// The element that, when hovered, reveals the card.
const HoverCardTrigger = HoverCardPrimitive.Trigger

// Content: the floating preview panel. Exposes `align` (default "center") and
// `sideOffset` (default 4px) for positioning relative to the trigger.
const HoverCardContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props} />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
