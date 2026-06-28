// Card: a surface/container for grouping related content. Plain styled divs
// (no Radix). Compose as Card > CardHeader (CardTitle + CardDescription) +
// CardContent + CardFooter. Each part is a forwardRef div accepting className.
import * as React from "react"

import { cn } from "@/lib/utils"

// Card: the outer bordered, rounded container. forwardRef.
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-none", className)}
    {...props} />
))
Card.displayName = "Card"

// CardHeader: top section that holds the title/description (padded column). forwardRef.
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 p-6", className)}
    {...props} />
))
CardHeader.displayName = "CardHeader"

// CardTitle: the card's heading text. forwardRef.
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-card-foreground", className)}
    {...props} />
))
CardTitle.displayName = "CardTitle"

// CardDescription: muted supporting text under the title. forwardRef.
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...props} />
))
CardDescription.displayName = "CardDescription"

// CardContent: the main body area of the card. forwardRef.
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

// CardFooter: bottom row for actions/metadata (flex row). forwardRef.
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
