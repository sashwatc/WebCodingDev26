"use client";

/**
 * Toaster (Sonner) — toast notification host built on the `sonner` library
 * (re-exported here as `Sonner`). Render this once near the app root; trigger
 * toasts elsewhere via sonner's `toast()` function. Distinct from the Radix
 * toast in toast.jsx/use-toast.jsx.
 */

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

// Reads the active theme from next-themes and forwards it to Sonner, then maps
// the toast/description/action/cancel slots onto the app's Tailwind tokens.
const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    (<Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props} />)
  );
}

export { Toaster }
