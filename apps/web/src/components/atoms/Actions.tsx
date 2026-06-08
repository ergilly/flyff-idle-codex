import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

type ActionsProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  gap?: CSSProperties["gap"];
};

export function Actions({ children, className, gap = "12px", style, ...props }: ActionsProps) {
  return (
    <div className={cx("flex justify-end max-[560px]:grid", className)} style={{ gap, ...style }} {...props}>
      {children}
    </div>
  );
}
