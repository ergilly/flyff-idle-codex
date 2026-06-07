import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

type StatRowProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
};

type StatLabelProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function StatLabel({ children, className, ...props }: StatLabelProps) {
  return (
    <span className={cx("text-[0.85rem] text-text-muted", className)} {...props}>
      {children}
    </span>
  );
}

export function StatRow({ label, value, className, ...props }: StatRowProps) {
  return (
    <div className={cx("flex justify-between gap-3", className)} {...props}>
      <StatLabel>{label}</StatLabel>
      <strong>{value}</strong>
    </div>
  );
}
