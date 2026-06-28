/**
 * Toast — presentational pieces for the app's custom toast notifications.
 * Unlike the upstream shadcn version this is NOT backed by Radix; these are
 * plain styled elements driven by the reducer/state in use-toast.jsx and
 * rendered by toaster.jsx. (Separate from the sonner-based toaster in sonner.jsx.)
 */

import * as React from "react";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// No-op provider (just renders children); kept for API parity with Radix toast.
const ToastProvider = ({ children }) => <>{children}</>;
ToastProvider.displayName = "ToastProvider";

// Fixed-position container that stacks the active toasts in a screen corner.
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "pointer-events-none fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:top-auto sm:w-auto sm:max-w-[420px] sm:flex-col",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

// cva variant map for a toast's look: `variant` of "default" | "destructive".
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// A single toast box. Applies the chosen `variant` styling and renders nothing
// when `open` is false (the reducer flips `open` to dismiss before removal).
const Toast = React.forwardRef(({ className, variant, open = true, ...props }, ref) => {
  if (!open) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = "Toast";

// Optional action button slot (e.g. "Undo") shown on the right of a toast.
const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

// The X dismiss button in the toast's top-right corner.
const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/70 opacity-100 transition-opacity hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 group-[.destructive]:text-red-300 group-[.destructive]:hover:bg-destructive/20 group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive group-[.destructive]:focus:ring-offset-background",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));
ToastClose.displayName = "ToastClose";

// Bold heading line of the toast.
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

// Secondary supporting text below the title.
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
