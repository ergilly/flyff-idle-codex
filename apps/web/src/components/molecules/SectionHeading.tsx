import type { ReactNode } from "react";
import { spacing } from "@/styles/tokens";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
};

export function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <style>{`
        .section-heading {
          display: grid;
          gap: ${spacing.xs};
        }

        .section-heading h3 {
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
