import type { ButtonHTMLAttributes } from "react";

export function ProfileMenuButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-control border border-transparent bg-transparent px-2.5 text-left font-extrabold text-text-muted hover:border-border hover:bg-[linear-gradient(180deg,rgba(255,225,115,0.14),rgba(29,26,18,0.82))] hover:text-foreground"
      {...props}
    />
  );
}
