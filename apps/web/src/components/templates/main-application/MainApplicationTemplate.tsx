import type { HTMLAttributes, ReactNode } from "react";
import { Stack } from "@/components/atoms/Stack";

type MainApplicationTemplateProps = {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
};

export function MainApplicationTemplate({ children, header, sidebar }: MainApplicationTemplateProps) {
  return (
    <main className="grid h-screen grid-cols-[248px_minmax(0,1fr)] bg-background text-foreground max-[920px]:grid-cols-1">
      {sidebar}
      <section className="grid min-h-0 min-w-0 [grid-template-rows:auto_minmax(0,1fr)]">
        {header}
        {children}
      </section>
    </main>
  );
}

export function MainApplicationContent({ children }: { children: ReactNode }) {
  return (
    <section className="grid min-h-0 gap-0 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(255,218,88,0.08),transparent_34%)] p-6 [grid-template-rows:auto_minmax(0,1fr)] max-[560px]:p-4">
      {children}
    </section>
  );
}

export function MainApplicationCenteredState({ children }: { children: ReactNode }) {
  return (
    <MainApplicationTemplate>
      <section className="grid content-start gap-[18px] p-6">{children}</section>
    </MainApplicationTemplate>
  );
}

export function MainApplicationErrorPanel(props: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <Stack
      as="section"
      className="w-full max-w-[1040px] rounded-card border-[3px] border-border bg-panel-shell p-7 shadow-[inset_0_0_0_2px_rgba(255,225,115,0.14),0_22px_70px_var(--shell-shadow)]"
      {...props}
    />
  );
}
