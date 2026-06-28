// InputOTP: a one-time-passcode / verification-code input built on the
// `input-otp` library. A single hidden text input drives several individually
// styled "slot" boxes. Compose as:
// <InputOTP maxLength={6}><InputOTPGroup><InputOTPSlot index={0}/>...</InputOTPGroup></InputOTP>.
import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "@/lib/utils"

// InputOTP: the root. Wraps the library's <OTPInput>, which renders an invisible
// input and exposes per-slot state through OTPInputContext. `containerClassName`
// styles the wrapper row; `className` styles the underlying input element.
const InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props} />
))
InputOTP.displayName = "InputOTP"

// InputOTPGroup: a layout row (plain div) that visually groups a run of slots
// (e.g. one group of 3 + a separator + another group of 3).
const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

// InputOTPSlot: renders a single character box. It reads its own state from
// OTPInputContext by `index`: `char` (the typed character), `isActive` (this slot
// is focused -> ring highlight) and `hasFakeCaret` (draw a blinking fake caret
// since the real input is hidden).
const InputOTPSlot = React.forwardRef(({ index, className, ...props }, ref) => {
  // Pull this slot's live state out of the shared input-otp context.
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    (<div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      )}
      {...props}>
      {char}
      {/* Blinking placeholder caret, shown only on the active empty slot. */}
      {hasFakeCaret && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>)
  );
})
InputOTPSlot.displayName = "InputOTPSlot"

// InputOTPSeparator: a decorative divider (a Minus icon) placed between groups
// of slots; role="separator" marks it as non-interactive for a11y.
const InputOTPSeparator = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
