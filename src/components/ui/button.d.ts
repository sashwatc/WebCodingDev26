import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  className?: string;
  neon?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "solid" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;

export function buttonVariants(props?: {
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}): string;
