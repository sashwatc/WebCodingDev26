// Button: the app's primary clickable control. Styles come from cva variants;
// `asChild` lets it render a different element (e.g. an <a>) via Radix Slot.
// `buttonVariants` is exported so other components can reuse the same styling.
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// cva config: `variant` (default/solid/destructive/outline/secondary/ghost/link)
// controls color/treatment; `size` (default/sm/lg/icon) controls dimensions.
// defaultVariants apply when those props are omitted.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary bg-primary text-primary-foreground shadow-archive-sm hover:bg-primary/90",
        solid:
          "border border-primary bg-primary text-primary-foreground shadow-archive-sm hover:bg-primary/90",
        destructive:
          "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted",
        secondary:
          "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "border border-transparent bg-transparent text-foreground hover:bg-muted",
        link:
          "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-3.5 py-1.5 text-xs",
        lg: "h-12 px-6 py-3 text-sm",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Button: forwardRef component. When asChild is true it renders its child via
// Slot (merging props/classes) instead of a native <button>.
const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
  // Choose the element to render: passthrough Slot, or a real <button>.
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {children}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
