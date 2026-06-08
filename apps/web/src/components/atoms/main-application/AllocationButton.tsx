import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export function AllocationButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        "grid h-7 w-7 cursor-pointer place-items-center rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.94),rgba(7,7,6,0.98))] text-primary-strong shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] hover:border-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
