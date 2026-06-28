import type { ReactNode } from "react";
import { Eyebrow } from "@/components/atoms/main-application/Eyebrow";

type ContentHeadingProps = {
  activeNavItem: string;
};

export function ContentHeading({ activeNavItem }: ContentHeadingProps) {
  return (
    <div className="pb-3 pl-1" data-testid="game_div_content_heading">
      <Eyebrow data-testid="game_p_content_heading">{activeNavItem}</Eyebrow>
    </div>
  );
}

export function PointsSummary({
  children,
  testId = "points_summary_div"
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.92),rgba(9,9,7,0.96))] px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] [&_span]:text-[0.76rem] [&_span]:font-extrabold [&_span]:uppercase [&_span]:text-text-muted [&_strong]:text-xl [&_strong]:text-[#fff1ba]"
      data-testid={testId}
    >
      {children}
    </div>
  );
}
