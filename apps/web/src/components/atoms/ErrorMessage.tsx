import { borders, colors, spacing, typography } from "@/styles/tokens";

export function ErrorMessage({ message }: { message: string }) {
  return (
    <>
      <div className="ui-error-message" role="alert">
        {message}
      </div>
      <style>{`
        .ui-error-message {
          border-left: ${borders.dangerLeft};
          padding: ${spacing.md} ${spacing.lg};
          background: ${colors.dangerPanel};
          color: ${colors.danger};
          font-weight: ${typography.weightBold};
        }
      `}</style>
    </>
  );
}
