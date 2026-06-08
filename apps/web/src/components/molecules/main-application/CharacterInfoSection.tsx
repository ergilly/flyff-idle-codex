import type { ReactNode } from "react";

export function CharacterInfoSection({ children }: { children: ReactNode }) {
  return <div className="grid gap-1.5 border-b border-border pb-3 last:border-b-0 last:pb-0">{children}</div>;
}
