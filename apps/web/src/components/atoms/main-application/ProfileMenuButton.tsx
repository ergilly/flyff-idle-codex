import type { ButtonHTMLAttributes } from "react";

export function ProfileMenuButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-control border border-transparent bg-transparent px-2.5 text-left font-extrabold text-text-muted hover:border-border hover:bg-panel-muted hover:text-foreground"
      {...props}
    />
  );
}
