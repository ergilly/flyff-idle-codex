import type { ReactNode } from "react";
import { Eyebrow } from "@/components/atoms/main-application/Eyebrow";

type ContentHeadingProps = {
  activeNavItem: string;
};

export function ContentHeading({ activeNavItem }: ContentHeadingProps) {
  return (
    <div className="grid gap-1.5 [&_h2]:m-0 [&_h2]:text-[1.15rem]">
      <Eyebrow>{activeNavItem}</Eyebrow>
      <h2>{activeNavItem}</h2>
    </div>
  );
}

export function PointsSummary({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-panel-muted px-3 py-2.5 [&_span]:text-[0.76rem] [&_span]:font-extrabold [&_span]:uppercase [&_span]:text-text-muted [&_strong]:text-xl">
      {children}
    </div>
  );
}
