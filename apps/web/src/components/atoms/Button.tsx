import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({ children, className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        "min-h-11 cursor-pointer rounded-control px-[18px] font-extrabold disabled:opacity-[0.68]",
        variant === "primary" &&
          "border-0 bg-primary text-button-text hover:bg-primary-strong disabled:cursor-wait",
        variant === "secondary" &&
          "border border-border bg-panel-muted text-foreground hover:border-primary hover:bg-panel-elevated disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
