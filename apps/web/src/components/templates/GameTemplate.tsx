import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";

export function GameTemplate({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative grid min-h-screen place-items-center px-4 py-8"
      data-testid="game_template_main_layout"
    >
      <ThemeToggle />
      <section
        className="w-full max-w-[1040px] rounded-card border border-border bg-panel-shell p-7 shadow-shell max-[560px]:p-[22px]"
        data-testid="game_template_section_shell"
      >
        {children}
      </section>
    </main>
  );
}
