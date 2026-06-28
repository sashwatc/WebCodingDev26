// Type declarations for the Button component (implementation in button.jsx).
// Describes the props and the buttonVariants() helper for TypeScript consumers.
import * as React from "react";

/**
 * Props for <Button>: all native <button> attributes plus:
 * - asChild: render the child element instead of a <button> (Radix Slot pattern).
 * - neon: optional flag toggling the neon visual treatment.
 * - size: one of the predefined size keys.
 * - variant: one of the predefined visual style keys.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  className?: string;
  neon?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "solid" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

// The ref-forwarding Button component.
export const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;

// Helper that returns the class string for a given variant/size — use it to
// style non-button elements (e.g. links) to look like a Button.
export function buttonVariants(props?: {
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}): string;
