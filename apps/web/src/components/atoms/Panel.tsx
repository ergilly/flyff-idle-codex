import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "aside";
  children: ReactNode;
};

export function Panel({ as: Component = "article", children, className, style, ...props }: PanelProps) {
  return (
    <Component
      className={cx(
        "grid gap-2 rounded-card border-[3px] border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.92),rgba(5,5,4,0.98)),var(--panel)] p-[18px] shadow-[inset_0_0_0_2px_rgba(255,225,115,0.14),inset_0_14px_28px_rgba(255,255,255,0.04),0_18px_38px_rgba(0,0,0,0.38)] [&_strong]:text-2xl",
        className
      )}
      {...props}
      style={style}
    >
      {children}
    </Component>
  );
}
