import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative group border text-center",
  {
    variants: {
      variant: {
        default: "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-slate-800 dark:text-slate-100",
        solid: "bg-blue-500 hover:bg-blue-600 text-white border-transparent hover:border-foreground/50",
        destructive: "bg-red-500/5 hover:bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
        outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        secondary: "bg-slate-100 text-slate-950 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",
        ghost: "border-transparent bg-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200",
        link: "text-primary underline-offset-4 hover:underline border-transparent bg-transparent",
      },
      size: {
        default: "h-11 px-7 py-2.5",
        sm: "h-9 px-4 py-1.5 text-xs",
        lg: "h-12 px-10 py-3 text-sm",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, neon = true, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  
  const isNeonEnabled = neon && variant !== "link" && variant !== "ghost";

  const neonColorClass = 
    variant === "destructive" 
      ? "dark:via-red-500 via-red-600" 
      : variant === "secondary" 
        ? "dark:via-slate-400 via-slate-500" 
        : "dark:via-blue-500 via-blue-600";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {isNeonEnabled && (
        <span className={cn("absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent pointer-events-none", neonColorClass)} />
      )}
      {children}
      {isNeonEnabled && (
        <span className={cn("absolute group-hover:opacity-30 transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent to-transparent pointer-events-none", neonColorClass)} />
      )}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
