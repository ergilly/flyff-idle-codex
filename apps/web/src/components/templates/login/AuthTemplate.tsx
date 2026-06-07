import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";

export function AuthTemplate({ children }: { children: ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-8">
      <ThemeToggle />
      <section className="w-full max-w-[440px] rounded-card border border-border bg-panel-shell p-8 shadow-shell max-[560px]:p-[22px]">
        {children}
      </section>
    </main>
  );
}
