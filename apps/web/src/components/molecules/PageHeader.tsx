import { MutedText } from "@/components/atoms/MutedText";
import { colors, spacing, typography } from "@/styles/tokens";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <>
      <header className="page-header">
        <p className="page-header-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <MutedText>{description}</MutedText> : null}
      </header>
      <style>{`
        .page-header {
          display: grid;
          gap: ${spacing.sm};
          margin-bottom: ${spacing["5xl"]};
        }

        .page-header-eyebrow {
          color: ${colors.accent};
          font-size: ${typography.eyebrowSize};
          font-weight: ${typography.weightHeavy};
          letter-spacing: 0;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
}
