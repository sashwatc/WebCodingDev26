/**
 * utils.js
 * -----------------------------------------------------------------------------
 * Tiny shared utilities: a Tailwind-aware className combiner and a flag for
 * whether the app is running inside an iframe.
 */
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Merge class names: clsx resolves conditional/array inputs, then twMerge
// de-conflicts overlapping Tailwind utilities (later wins). Returns a string.
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// True when the app is embedded in an iframe (window.self !== window.top).
// Computed once at module load; assumes iframe if cross-origin access throws,
// and false when there's no window (server).
export const isIframe = (() => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin framing blocks the comparison -> we're framed.
    return true;
  }
})();
