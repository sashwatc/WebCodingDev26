/**
 * RecordThumbnail.jsx
 * --------------------------------------------------------------------------
 * A small square thumbnail used in item/record lists. It shows the record's
 * image when a `src` is provided, and otherwise falls back to a centered
 * package icon placeholder. Size and extra styling are controlled by props.
 *
 * Props:
 *   src       - image URL; when empty, the icon placeholder is shown.
 *   alt       - alt text for the image.
 *   sizeClass - Tailwind size classes for the box (default "h-16 w-16").
 *   className - additional classes appended to the container.
 */

import React from "react";
import { Package } from "lucide-react";

export default function RecordThumbnail({
  src = "",
  alt = "",
  sizeClass = "h-16 w-16",
  className = "",
}) {
  return (
    // Fixed-size rounded box; flex-shrink-0 keeps it from collapsing in flex rows.
    <div className={`${sizeClass} overflow-hidden rounded-xl bg-muted flex-shrink-0 ${className}`.trim()}>
      {src ? (
        // Image present: cover-fit it within the box.
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        // No image: centered package-icon placeholder.
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
