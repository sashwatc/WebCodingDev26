// Alert: static, inline callout box for contextual messages (info/error).
// Not a Radix wrapper; a plain role="alert" div styled via cva variants.
// Compose as Alert > (icon) + AlertTitle + AlertDescription.
import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// cva config: `variant` switches between "default" and "destructive" color
// schemes; the [&>svg] selectors absolutely position a leading icon.
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Alert: the container; takes a `variant` ("default" | "destructive"). forwardRef.
const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props} />
))
Alert.displayName = "Alert"

// AlertTitle: bold heading line of the alert (h5). forwardRef.
const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props} />
))
AlertTitle.displayName = "AlertTitle"

// AlertDescription: the body/detail text of the alert. forwardRef.
const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props} />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
