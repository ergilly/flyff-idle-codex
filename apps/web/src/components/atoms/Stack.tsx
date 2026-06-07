import type { CSSProperties, FormHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { spacing } from "@/styles/tokens";

type StackBaseProps = {
  children: ReactNode;
  gap?: CSSProperties["gap"];
};

type DivStackProps = HTMLAttributes<HTMLDivElement> & StackBaseProps & {
  as?: "div";
};

type FormStackProps = FormHTMLAttributes<HTMLFormElement> & StackBaseProps & {
  as: "form";
};

type SectionStackProps = HTMLAttributes<HTMLElement> & StackBaseProps & {
  as: "section";
};

type StackProps = DivStackProps | FormStackProps | SectionStackProps;

export function Stack({ children, gap = spacing["2xl"], style, ...props }: StackProps) {
  const stackStyle = { display: "grid", gap, ...style };

  if (props.as === "form") {
    const { as: _as, ...formProps } = props;

    return (
      <form style={stackStyle} {...formProps}>
        {children}
      </form>
    );
  }

  if (props.as === "section") {
    const { as: _as, ...sectionProps } = props;

    return (
      <section style={stackStyle} {...sectionProps}>
        {children}
      </section>
    );
  }

  const { as: _as, ...divProps } = props;

  return (
    <div style={stackStyle} {...divProps}>
      {children}
    </div>
  );
}
