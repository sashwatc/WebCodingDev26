"use client"

// Drawer: a bottom-sheet style panel that slides up from the edge, built on the
// `vaul` library (DrawerPrimitive). Re-exports vaul's Trigger/Portal/Close and
// wraps the visual parts (Overlay, Content, Title, ...) with shadcn/ui styling.
// Compose as: <Drawer><DrawerTrigger/><DrawerContent>...</DrawerContent></Drawer>.
import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

// Root: wraps vaul's Root and defaults `shouldScaleBackground` to true, which
// scales/insets the page behind the drawer for the iOS-style depth effect.
const Drawer = ({
  shouldScaleBackground = true,
  ...props
}) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
)
Drawer.displayName = "Drawer"

// Element that opens the drawer when activated.
const DrawerTrigger = DrawerPrimitive.Trigger

// Portals drawer content to the document body.
const DrawerPortal = DrawerPrimitive.Portal

// Any element that closes the drawer when clicked.
const DrawerClose = DrawerPrimitive.Close

// Overlay: the dimmed, blurred backdrop behind the drawer.
const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/50 backdrop-blur-[1.5px]", className)}
    {...props} />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

// Content: the sliding panel anchored to the bottom edge. Bundles its own Portal
// + Overlay and renders a small "grabber" handle bar at the top before children.
const DrawerContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}>
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

// Header: layout container (plain div) for the title/description at the top.
const DrawerHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

// Footer: layout container (plain div) pinned to the bottom for action buttons.
const DrawerFooter = ({
  className,
  ...props
}) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

// Title: the drawer's accessible heading.
const DrawerTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

// Description: the drawer's accessible supporting text.
const DrawerDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
