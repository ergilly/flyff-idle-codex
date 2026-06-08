import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ id, label, ...props }: TextFieldProps) {
  return (
    <div className="grid gap-2">
      <label className="text-[0.9rem] font-bold" htmlFor={id}>
        {label}
      </label>
      <input
        className="w-full rounded-control border border-border bg-panel-elevated px-3.5 py-3 text-foreground focus:border-primary focus:outline-[2px_solid_rgba(88,166,201,0.28)] focus:outline-offset-2"
        id={id}
        {...props}
      />
    </div>
  );
}
