import type { CSSProperties, FormHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/classNames";

type StackBaseProps = {
  children: ReactNode;
  gap?: CSSProperties["gap"];
};

type DivStackProps = HTMLAttributes<HTMLDivElement> &
  StackBaseProps & {
    as?: "div";
  };

type FormStackProps = FormHTMLAttributes<HTMLFormElement> &
  StackBaseProps & {
    as: "form";
  };

type SectionStackProps = HTMLAttributes<HTMLElement> &
  StackBaseProps & {
    as: "section";
  };

type StackProps = DivStackProps | FormStackProps | SectionStackProps;

export function Stack({ children, gap = "16px", style, ...props }: StackProps) {
  const stackStyle = { gap, ...style };

  if (props.as === "form") {
    const { as: _as, className, ...formProps } = props;

    return (
      <form className={cx("grid", className)} style={stackStyle} {...formProps}>
        {children}
      </form>
    );
  }

  if (props.as === "section") {
    const { as: _as, className, ...sectionProps } = props;

    return (
      <section className={cx("grid", className)} style={stackStyle} {...sectionProps}>
        {children}
      </section>
    );
  }

  const { as: _as, className, ...divProps } = props;

  return (
    <div className={cx("grid", className)} style={stackStyle} {...divProps}>
      {children}
    </div>
  );
}
