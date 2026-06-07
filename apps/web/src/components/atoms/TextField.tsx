import type { InputHTMLAttributes } from "react";
import { borders, colors, outlines, radii, spacing, typography } from "@/styles/tokens";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ id, label, ...props }: TextFieldProps) {
  return (
    <>
      <div className="ui-text-field">
        <label htmlFor={id}>{label}</label>
        <input id={id} {...props} />
      </div>
      <style>{`
        .ui-text-field {
          display: grid;
          gap: ${spacing.sm};
        }

        .ui-text-field label {
          font-size: ${typography.fieldLabelSize};
          font-weight: ${typography.weightBold};
        }

        .ui-text-field input {
          width: 100%;
          border: ${borders.default};
          border-radius: ${radii.sm};
          padding: ${spacing.lg} ${spacing.xl};
          background: ${colors.panelElevated};
          color: ${colors.foreground};
        }

        .ui-text-field input:focus {
          border-color: ${colors.primary};
          outline: ${outlines.focusPrimary};
          outline-offset: ${spacing.px1};
        }
      `}</style>
    </>
  );
}
