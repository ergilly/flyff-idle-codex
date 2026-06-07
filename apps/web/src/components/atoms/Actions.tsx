import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { spacing } from "@/styles/tokens";

type ActionsProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  gap?: CSSProperties["gap"];
};

export function Actions({ children, gap = spacing.lg, style, ...props }: ActionsProps) {
  return (
    <div className="ui-actions" style={{ gap, ...style }} {...props}>
      {children}
      <style>{`
        .ui-actions {
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 560px) {
          .ui-actions {
            display: grid;
          }
        }
      `}</style>
    </div>
  );
}
