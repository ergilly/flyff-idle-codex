import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

type MutedTextProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function MutedText({ children, className, ...props }: MutedTextProps) {
  return (
    <p className={cx("m-0 leading-[1.55] text-text-muted", className)} {...props}>
      {children}
    </p>
  );
}
