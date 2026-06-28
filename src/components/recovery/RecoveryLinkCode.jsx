/**
 * RecoveryLinkCode
 * --------------------------------------------------------------------------
 * Renders a decorative, QR-style visual marker for a recovery link/value
 * alongside the link text and an optional copy button.
 *
 * Important: this is NOT a scannable QR code. The grid is a deterministic
 * "identicon"-style pattern derived from `value` (so the same value always
 * draws the same pattern) with QR-like corner anchors for visual familiarity.
 * Its purpose is recognizability/branding, not machine decoding.
 */

import React, { useMemo } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

// Cheap deterministic string hash (djb2-like) used to seed the pattern so a
// given value always yields the same grid. Falls back to a default string.
function hashValue(value) {
  return String(value || "pvhs-recovery")
    .split("")
    .reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0);
}

// Decides whether a cell belongs to one of the three QR-style corner anchors
// (top-left, top-right, bottom-left) and, if so, whether it should be filled.
// Returns:
//   - null  => cell is not in any anchor region (caller uses the seeded pattern)
//   - true  => filled  (anchor ring border)
//   - false => empty   (anchor interior)
function isAnchor(row, column, size) {
  // Is this cell within a 3x3 corner block?
  const inTopLeft = row < 3 && column < 3;
  const inTopRight = row < 3 && column >= size - 3;
  const inBottomLeft = row >= size - 3 && column < 3;
  if (!inTopLeft && !inTopRight && !inBottomLeft) {
    return null;
  }
  // Within an anchor: fill the outer ring (edges) but leave the center empty.
  return row === 0 || column === 0 || row === 2 || column === 2 || row === size - 1 || column === size - 1 || row === size - 3 || column === size - 3;
}

export default function RecoveryLinkCode({
  value,                    // Source value the pattern is derived from.
  label = "Recovery link",  // Heading shown next to the marker.
  description,              // Optional descriptive text.
  copyValue,               // Optional string for the copy-to-clipboard button.
  compact = false,         // Smaller 9x9 grid when true (otherwise 11x11).
}) {
  // Grid dimension (cells per side).
  const size = compact ? 9 : 11;
  // Build the flat array of cell on/off booleans, memoized by size + value.
  const cells = useMemo(() => {
    const seed = Math.abs(hashValue(value));
    return Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size);
      const column = index % size;
      const anchor = isAnchor(row, column, size);
      // Corner-anchor cells take precedence over the seeded pattern.
      if (anchor !== null) {
        return anchor;
      }
      // Otherwise fill ~40% of cells using a seeded pseudo-random formula.
      return ((seed + row * 17 + column * 31 + row * column * 7) % 5) < 2;
    });
  }, [size, value]);

  // Text to display under the label: prefer copyValue, else value, else blank.
  const textValue = String(copyValue || value || "");

  return (
    <div className="surface-card p-4">
      <div className="flex items-start gap-4">
        {/* The QR-style grid: size x size square cells, each filled or empty */}
        <div
          aria-label={`${label} QR-style visual marker`}
          className="grid shrink-0 gap-0.5 rounded-md border border-border bg-card p-2"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {cells.map((filled, index) => (
            <span
              key={index}
              className={filled ? "h-2 w-2 rounded-[1px] bg-foreground" : "h-2 w-2 rounded-[1px] bg-card"}
            />
          ))}
        </div>
        {/* Text column: label, optional description, the link value, copy CTA */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
          {/* Monospace, truncated display of the link value */}
          {textValue && (
            <p className="mt-2 truncate rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
              {textValue}
            </p>
          )}
          {/* Copy button only appears when a copyValue is provided; uses the
              Clipboard API (optional-chained in case it's unavailable) */}
          {copyValue && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 gap-2"
              onClick={() => navigator.clipboard?.writeText(copyValue)}
            >
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
