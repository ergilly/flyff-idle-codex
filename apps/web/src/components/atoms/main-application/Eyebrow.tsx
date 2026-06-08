import type { ReactNode } from "react";

type EyebrowProps = {
  children: ReactNode;
};

export function Eyebrow({ children }: EyebrowProps) {
  return <p className="m-0 text-[0.78rem] font-extrabold uppercase text-accent">{children}</p>;
}
