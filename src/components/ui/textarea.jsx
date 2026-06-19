import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-[10px] border border-input bg-white px-4 py-3 text-sm text-slate-950 shadow-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-500 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
