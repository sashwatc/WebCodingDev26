/**
 * Skeleton — a pulsing placeholder block shown while content is loading.
 * No external primitive; just a styled div. Size/shape it via className.
 */

import { cn } from "@/lib/utils"

// Renders an animated (animate-pulse) muted box; pass width/height via className.
function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      className={cn("animate-pulse rounded-md bg-muted/80", className)}
    {...props} />)
  );
}

export { Skeleton }
