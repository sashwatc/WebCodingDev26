"use client"

// Progress: a horizontal progress bar built on Radix UI's
// `@radix-ui/react-progress`. Pass a `value` from 0-100. Use as: <Progress value={60} />.
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// Progress: the track (Root) plus a filled Indicator bar. The fill is achieved by
// translating the full-width indicator left by (100 - value)% so `value`% shows.
const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2.5 w-full overflow-hidden rounded-full bg-muted",
      className
    )}
    {...props}>
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
