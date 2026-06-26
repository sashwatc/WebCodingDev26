import React, { useMemo } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

function hashValue(value) {
  return String(value || "pvhs-recovery")
    .split("")
    .reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0);
}

function isAnchor(row, column, size) {
  const inTopLeft = row < 3 && column < 3;
  const inTopRight = row < 3 && column >= size - 3;
  const inBottomLeft = row >= size - 3 && column < 3;
  if (!inTopLeft && !inTopRight && !inBottomLeft) {
    return null;
  }
  return row === 0 || column === 0 || row === 2 || column === 2 || row === size - 1 || column === size - 1 || row === size - 3 || column === size - 3;
}

export default function RecoveryLinkCode({
  value,
  label = "Recovery link",
  description,
  copyValue,
  compact = false,
}) {
  const size = compact ? 9 : 11;
  const cells = useMemo(() => {
    const seed = Math.abs(hashValue(value));
    return Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size);
      const column = index % size;
      const anchor = isAnchor(row, column, size);
      if (anchor !== null) {
        return anchor;
      }
      return ((seed + row * 17 + column * 31 + row * column * 7) % 5) < 2;
    });
  }, [size, value]);

  const textValue = String(copyValue || value || "");

  return (
    <div className="surface-card p-4">
      <div className="flex items-start gap-4">
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
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>}
          {textValue && (
            <p className="mt-2 truncate rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
              {textValue}
            </p>
          )}
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
