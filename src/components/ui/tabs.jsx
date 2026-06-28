/**
 * Tabs — switch between panels of content, wrapping Radix UI's
 * `@radix-ui/react-tabs`.
 *
 *   <Tabs defaultValue="a">
 *     <TabsList><TabsTrigger value="a"/><TabsTrigger value="b"/></TabsList>
 *     <TabsContent value="a">...</TabsContent>
 *     <TabsContent value="b">...</TabsContent>
 *   </Tabs>
 */

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

// Root holding the active tab state (value/defaultValue/onValueChange).
const Tabs = TabsPrimitive.Root

// The row container that groups the tab triggers.
const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex min-h-[48px] items-center justify-center rounded-xl border border-border bg-muted p-1 text-muted-foreground shadow-none",
      className
    )}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

// Clickable tab button; needs a `value` matching a TabsContent. The active one
// is highlighted via data-[state=active] styles.
const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] px-4 py-2 text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// The panel shown when its `value` matches the active tab.
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
