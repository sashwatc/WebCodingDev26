"use client";

/**
 * ToggleGroup — a set of toggle buttons behaving as one control (single- or
 * multi-select), wrapping Radix UI's `@radix-ui/react-toggle-group`. Items reuse
 * the cva `toggleVariants` from toggle.jsx so the whole group shares one look.
 *
 *   <ToggleGroup type="single" variant="outline" size="sm">
 *     <ToggleGroupItem value="a">A</ToggleGroupItem> ...
 *   </ToggleGroup>
 */

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

// Shares the group's variant/size down to each item so they don't repeat props.
const ToggleGroupContext = React.createContext({
  size: "default",
  variant: "default",
})

// Root group. Provides variant/size via context; forwards type/value to Radix.
const ToggleGroup = React.forwardRef(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}>
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

// One toggle button in the group; needs a `value`. Prefers the group's
// variant/size from context, falling back to its own props.
const ToggleGroupItem = React.forwardRef(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    (<ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleVariants({
        variant: context.variant || variant,
        size: context.size || size,
      }), className)}
      {...props}>
      {children}
    </ToggleGroupPrimitive.Item>)
  );
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
