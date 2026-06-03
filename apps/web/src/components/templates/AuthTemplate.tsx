import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";

export function AuthTemplate({ children }: { children: ReactNode }) {
  return (
    <main className="shell">
      <ThemeToggle />
      <section className="auth-panel">{children}</section>
    </main>
  );
}
