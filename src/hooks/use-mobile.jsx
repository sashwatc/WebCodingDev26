/**
 * use-mobile.jsx
 * -----------------------------------------------------------------------------
 * Hook that reports whether the viewport is "mobile" width (below 768px),
 * staying in sync with viewport changes via matchMedia. Use it to branch layout
 * or behavior between mobile and larger screens.
 */
import * as React from "react"

// Width (px) at/below which we treat the viewport as mobile.
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // `undefined` until measured on mount (avoids a wrong first paint / SSR mismatch).
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    // Watch the mobile-width media query and update state when it changes.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // Initialize immediately for the current viewport.
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    // Cleanup the listener on unmount.
    return () => mql.removeEventListener("change", onChange);
  }, [])

  // Coerce the initial `undefined` to a boolean for consumers.
  return !!isMobile
}
