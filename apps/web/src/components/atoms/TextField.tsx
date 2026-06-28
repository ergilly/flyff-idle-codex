import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  "data-testid"?: string;
  label: string;
};

export function TextField({ "data-testid": testId, id, label, ...props }: TextFieldProps) {
  return (
    <div className="grid gap-2" data-testid={testId ? `${testId}_field` : undefined}>
      <label
        className="text-[0.9rem] font-bold"
        data-testid={testId ? `${testId}_label` : undefined}
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className="w-full rounded-control border border-border bg-panel-elevated px-3.5 py-3 text-foreground focus:border-primary focus:outline-[2px_solid_rgba(88,166,201,0.28)] focus:outline-offset-2"
        id={id}
        data-testid={testId}
        {...props}
      />
    </div>
  );
}
