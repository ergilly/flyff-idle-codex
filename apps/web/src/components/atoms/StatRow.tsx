import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

type StatRowProps = HTMLAttributes<HTMLDivElement> & {
  "data-testid"?: string;
  label: ReactNode;
  value: ReactNode;
};

type StatLabelProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function StatLabel({ children, className, ...props }: StatLabelProps) {
  return (
    <span className={cx("text-[0.85rem] font-bold text-text-muted", className)} {...props}>
      {children}
    </span>
  );
}

export function StatRow({ "data-testid": testId, label, value, className, ...props }: StatRowProps) {
  return (
    <div
      className={cx("flex justify-between gap-3 [&_strong]:text-[#fff1ba]", className)}
      data-testid={testId}
      {...props}
    >
      <StatLabel data-testid={testId ? `${testId}_label` : undefined}>{label}</StatLabel>
      <strong data-testid={testId ? `${testId}_value` : undefined}>{value}</strong>
    </div>
  );
}
