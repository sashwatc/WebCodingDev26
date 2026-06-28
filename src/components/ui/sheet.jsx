"use client";

/**
 * Sheet — a slide-in panel (drawer) that enters from a screen edge. Built on
 * Radix UI's Dialog primitive (`@radix-ui/react-dialog`), so it is fully modal
 * and accessible. The slide direction is chosen via the `side` variant below.
 *
 * Compose as:
 *   <Sheet>
 *     <SheetTrigger>open</SheetTrigger>
 *     <SheetContent side="right">
 *       <SheetHeader><SheetTitle/><SheetDescription/></SheetHeader>
 *       ...
 *       <SheetFooter><SheetClose>close</SheetClose></SheetFooter>
 *     </SheetContent>
 *   </Sheet>
 */

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority";
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// Root container owning the open/closed state.
const Sheet = SheetPrimitive.Root

// Element that opens the sheet when activated.
const SheetTrigger = SheetPrimitive.Trigger

// Element that closes the sheet when activated.
const SheetClose = SheetPrimitive.Close

// Renders the sheet outside the DOM hierarchy (escapes overflow/stacking).
const SheetPortal = SheetPrimitive.Portal

// Dimmed, blurred backdrop behind the panel; fades in/out with the sheet state.
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-black/60",
      className
    )}
    {...props}
    ref={ref} />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

// cva variant map controlling which edge the panel docks to and which direction
// it slides from: `side` of "top" | "bottom" | "left" | "right" (default "right").
const sheetVariants = cva(
  "fixed z-50 gap-4 overflow-y-auto bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

// The panel itself. Wraps children in a Portal + Overlay, applies the `side`
// slide variant, and renders a built-in X close button in the top-right corner.
const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      <SheetPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

// Layout wrapper (plain div) for the title/description at the top of the sheet.
const SheetHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props} />
)
SheetHeader.displayName = "SheetHeader"

// Layout wrapper (plain div) for actions at the bottom of the sheet.
const SheetFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
SheetFooter.displayName = "SheetFooter"

// Accessible title (Radix Title) announced when the sheet opens.
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

// Accessible supporting text (Radix Description) linked to the dialog.
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
