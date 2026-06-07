import type { HTMLAttributes, ReactNode } from "react";
import { colors, typography } from "@/styles/tokens";

type MutedTextProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function MutedText({ children, style, ...props }: MutedTextProps) {
  return (
    <p style={{ color: colors.textMuted, lineHeight: typography.bodyLineHeight, ...style }} {...props}>
      {children}
    </p>
  );
}
