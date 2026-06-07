import type { ButtonHTMLAttributes, ReactNode } from "react";
import { borders, colors, radii, spacing, typography } from "@/styles/tokens";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({ children, variant = "primary", ...props }: ButtonProps) {
  return (
    <>
      <button className={`ui-button ${variant}`} {...props}>
        {children}
      </button>
      <style>{`
        .ui-button {
          min-height: 44px;
          border-radius: ${radii.sm};
          padding: 0 ${spacing["3xl"]};
          cursor: pointer;
          font-weight: ${typography.weightHeavy};
        }

        .ui-button:disabled {
          cursor: wait;
          opacity: 0.68;
        }

        .ui-button.primary {
          border: 0;
          background: ${colors.primary};
          color: ${colors.buttonText};
        }

        .ui-button.primary:hover {
          background: ${colors.primaryStrong};
        }

        .ui-button.secondary {
          border: ${borders.default};
          background: ${colors.panelMuted};
          color: ${colors.foreground};
        }

        .ui-button.secondary:hover {
          border-color: ${colors.primary};
          background: ${colors.panelElevated};
        }

        .ui-button.secondary:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
