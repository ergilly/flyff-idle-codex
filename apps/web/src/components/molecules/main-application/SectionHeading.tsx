import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title?: ReactNode;
};

export function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <div className="grid gap-1.5">
      {eyebrow ? <p className="m-0 text-[0.78rem] font-extrabold uppercase text-accent">{eyebrow}</p> : null}
      {title ? <h3 className="m-0 text-base">{title}</h3> : null}
    </div>
  );
}
