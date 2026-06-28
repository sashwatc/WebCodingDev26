"use client"

// Collapsible: single show/hide region built on @radix-ui/react-collapsible.
// These are thin re-exports of the Radix primitives (no extra styling).
// Compose as Collapsible > CollapsibleTrigger + CollapsibleContent.
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

// Root that holds open/closed state (controllable via `open`/`onOpenChange`).
const Collapsible = CollapsiblePrimitive.Root

// Element that toggles the open state when activated.
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

// The region that is shown or hidden based on the open state.
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
