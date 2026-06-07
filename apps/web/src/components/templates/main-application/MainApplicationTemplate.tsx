import type { HTMLAttributes, ReactNode } from "react";
import { Stack } from "@/components/atoms/Stack";

type MainApplicationTemplateProps = {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
};

export function MainApplicationTemplate({ children, header, sidebar }: MainApplicationTemplateProps) {
  return (
    <main className="grid min-h-screen grid-cols-[248px_minmax(0,1fr)] bg-background max-[920px]:grid-cols-1">
      {sidebar}
      <section className="grid min-w-0 [grid-template-rows:auto_1fr]">
        {header}
        {children}
      </section>
    </main>
  );
}

export function MainApplicationContent({ children }: { children: ReactNode }) {
  return <section className="grid content-start gap-[18px] p-6">{children}</section>;
}

export function MainApplicationCenteredState({ children }: { children: ReactNode }) {
  return (
    <MainApplicationTemplate>
      <section className="grid content-start gap-[18px] p-6">{children}</section>
    </MainApplicationTemplate>
  );
}

export function MainApplicationErrorPanel(props: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <Stack as="section" className="w-full max-w-[1040px] rounded-card border border-border bg-panel-shell p-7 shadow-shell" {...props} />;
}
