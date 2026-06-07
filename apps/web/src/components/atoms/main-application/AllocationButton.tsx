import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export function AllocationButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "grid h-7 w-7 cursor-pointer place-items-center rounded-control border border-border bg-panel text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
