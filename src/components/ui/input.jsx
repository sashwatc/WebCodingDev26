// Input: a styled wrapper around the native <input> element (no third-party
// primitive). forwardRef passes the ref to the DOM input; `type` and any other
// native props pass straight through, and `className` merges into the base styles.
import * as React from "react"

import { cn } from "@/lib/utils"

// Input: themed text field with focus ring, file-input, disabled and placeholder
// styling baked in. Use anywhere a native <input> would go.
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-[10px] border border-input bg-background px-4 py-3 text-sm text-foreground shadow-none transition-[border-color,box-shadow,background-color] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
