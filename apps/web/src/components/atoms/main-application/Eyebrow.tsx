import type { HTMLAttributes, ReactNode } from "react";

type EyebrowProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function Eyebrow({ children, ...props }: EyebrowProps) {
  return (
    <p className="m-0 text-[0.78rem] font-extrabold uppercase text-accent" {...props}>
      {children}
    </p>
  );
}
