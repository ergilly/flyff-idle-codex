import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  testId?: string;
  title?: ReactNode;
};

export function SectionHeading({ eyebrow, testId, title }: SectionHeadingProps) {
  return (
    <div className="grid gap-1.5" data-testid={testId}>
      {eyebrow ? (
        <p
          className="m-0 text-[0.78rem] font-extrabold uppercase text-accent"
          data-testid={testId ? `${testId}_eyebrow` : undefined}
        >
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h3 className="m-0 text-base" data-testid={testId ? `${testId}_title` : undefined}>
          {title}
        </h3>
      ) : null}
    </div>
  );
}
