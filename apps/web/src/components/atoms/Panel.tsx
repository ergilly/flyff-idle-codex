import type { HTMLAttributes, ReactNode } from "react";
import { borders, colors, radii, spacing } from "@/styles/tokens";

type PanelProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "aside";
  children: ReactNode;
};

export function Panel({ as: Component = "article", children, style, ...props }: PanelProps) {
  const className = props.className ? `ui-panel ${props.className}` : "ui-panel";

  return (
    <Component {...props} className={className} style={style}>
      {children}
      <style>{`
        .ui-panel {
          display: grid;
          gap: ${spacing.sm};
          border: ${borders.default};
          border-radius: ${radii.md};
          background: ${colors.panel};
          padding: ${spacing["3xl"]};
        }

        .ui-panel strong {
          font-size: 1.5rem;
        }
      `}</style>
    </Component>
  );
}
