import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,hsl(var(--primary)),rgba(30,41,59,0.94))] text-primary-foreground shadow-[0_16px_30px_rgba(11,20,36,0.18)] hover:-translate-y-0.5 hover:shadow-[0_22px_38px_rgba(11,20,36,0.24)] dark:bg-none dark:bg-white dark:text-slate-900 dark:shadow-[0_16px_30px_rgba(2,8,23,0.26)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_12px_24px_rgba(153,27,27,0.18)] hover:-translate-y-0.5 hover:bg-destructive/92",
        outline:
          "border border-slate-200 bg-white/90 text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.06)] backdrop-blur-sm hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white",
        secondary:
          "bg-primary/8 text-primary shadow-none hover:bg-primary/12 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
