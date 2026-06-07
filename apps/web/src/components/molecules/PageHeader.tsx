import { MutedText } from "@/components/atoms/MutedText";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-6 grid gap-2">
      <p className="m-0 text-[0.78rem] font-extrabold uppercase text-accent">{eyebrow}</p>
      <h1 className="m-0 text-[clamp(2rem,4vw,3.1rem)] leading-none">{title}</h1>
      {description ? <MutedText>{description}</MutedText> : null}
    </header>
  );
}
