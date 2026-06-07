import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "aside";
  children: ReactNode;
};

export function Panel({ as: Component = "article", children, className, style, ...props }: PanelProps) {
  return (
    <Component
      className={cx("grid gap-2 rounded-card border border-border bg-panel p-[18px] [&_strong]:text-2xl", className)}
      {...props}
      style={style}
    >
      {children}
    </Component>
  );
}
