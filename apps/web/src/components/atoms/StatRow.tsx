import type { HTMLAttributes, ReactNode } from "react";
import { colors, spacing, typography } from "@/styles/tokens";

type StatRowProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
};

type StatLabelProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function StatLabel({ children, style, ...props }: StatLabelProps) {
  return (
    <span style={{ color: colors.textMuted, fontSize: typography.labelSize, ...style }} {...props}>
      {children}
    </span>
  );
}

export function StatRow({ label, value, style, ...props }: StatRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: spacing.lg, ...style }} {...props}>
      <StatLabel>{label}</StatLabel>
      <strong>{value}</strong>
    </div>
  );
}
