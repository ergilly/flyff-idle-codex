import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";

export function GameTemplate({ children }: { children: ReactNode }) {
  return (
    <main className="shell">
      <ThemeToggle />
      <section className="selection-panel">{children}</section>
    </main>
  );
}
