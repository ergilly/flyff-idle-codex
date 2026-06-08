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
        "min-h-11 cursor-pointer rounded-control px-[18px] font-extrabold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_7px_16px_rgba(0,0,0,0.3)] transition-colors disabled:opacity-[0.68]",
        variant === "primary" &&
          "border-2 border-[#f5d46a] bg-[linear-gradient(180deg,#ffe07a,#b9851f)] text-button-text hover:bg-[linear-gradient(180deg,#fff0a8,#d09a29)] disabled:cursor-wait",
        variant === "secondary" &&
          "border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.96),rgba(11,11,9,0.96))] text-foreground hover:border-primary hover:bg-panel-elevated disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
