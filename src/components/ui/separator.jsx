/**
 * Separator — a thin visual divider line, wrapping Radix UI's
 * `@radix-ui/react-separator`.
 */

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

// Renders a 1px line. `orientation` ("horizontal" | "vertical") picks the sizing
// classes; `decorative` (default true) marks it purely visual for a11y/screen
// readers. forwardRef forwards the ref to the underlying Radix Root element.
const Separator = React.forwardRef((
  { className, orientation = "horizontal", decorative = true, ...props },
  ref
) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props} />
))
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
