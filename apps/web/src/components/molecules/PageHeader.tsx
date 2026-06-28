import { MutedText } from "@/components/atoms/MutedText";

type PageHeaderProps = {
  testId?: string;
  eyebrow: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description, testId = "page_header_header" }: PageHeaderProps) {
  return (
    <header className="mb-6 grid gap-2" data-testid={testId}>
      <p
        className="m-0 text-[0.78rem] font-extrabold uppercase text-accent"
        data-testid={`${testId}_eyebrow`}
      >
        {eyebrow}
      </p>
      <h1 className="m-0 text-[clamp(2rem,4vw,3.1rem)] leading-none" data-testid={`${testId}_title`}>
        {title}
      </h1>
      {description ? <MutedText data-testid={`${testId}_description`}>{description}</MutedText> : null}
    </header>
  );
}
