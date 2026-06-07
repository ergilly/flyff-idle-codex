import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/molecules/ThemeToggle";
import { borders, colors, radii, shadows, spacing } from "@/styles/tokens";

export function AuthTemplate({ children }: { children: ReactNode }) {
  return (
    <main className="shell">
      <ThemeToggle />
      <section className="auth-panel">{children}</section>
      <style>{`
        .shell {
          position: relative;
          display: grid;
          min-height: 100vh;
          place-items: center;
          padding: ${spacing["7xl"]} ${spacing["2xl"]};
        }

        .auth-panel {
          width: min(100%, 440px);
          max-width: 440px;
          border: ${borders.default};
          border-radius: ${radii.md};
          background: ${colors.panelShell};
          box-shadow: ${shadows.shell};
          padding: ${spacing["7xl"]};
        }

        @media (max-width: 560px) {
          .auth-panel {
            padding: ${spacing["4xl"]};
          }
        }
      `}</style>
    </main>
  );
}
