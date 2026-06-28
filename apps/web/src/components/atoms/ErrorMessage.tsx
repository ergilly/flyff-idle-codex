import { getTestIdSegment } from "@/lib/testIds";

type ErrorMessageProps = {
  message: string;
  testId?: string;
};

export function ErrorMessage({ message, testId }: ErrorMessageProps) {
  const [summary, ...detailLines] = message.split("\n");
  const errorTestIdSegment = getTestIdSegment(summary || message || "message") || "message";
  const resolvedTestId = testId ?? `error_alert_${errorTestIdSegment}`;
  const detailRows = detailLines
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      return separatorIndex > -1
        ? {
            label: line.slice(0, separatorIndex).trim(),
            value: line.slice(separatorIndex + 1).trim()
          }
        : null;
    })
    .filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <div
      className="border-l-4 border-l-danger bg-danger-panel px-3 py-2.5 font-bold text-danger"
      data-testid={resolvedTestId}
      role="alert"
    >
      {detailRows.length > 0 ? (
        <div className="grid gap-2" data-testid={`${resolvedTestId}_detail_group`}>
          <span data-testid={`${resolvedTestId}_summary`}>{summary}</span>
          <div className="grid gap-1" data-testid={`${resolvedTestId}_detail_list`}>
            {detailRows.map(({ label, value }, index) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-4"
                data-testid={`${resolvedTestId}_detail_row_${index}`}
                key={`${label}-${value}`}
              >
                <span data-testid={`${resolvedTestId}_detail_label_${index}`}>{label}</span>
                <strong className="text-right" data-testid={`${resolvedTestId}_detail_value_${index}`}>
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <span className="whitespace-pre-line" data-testid={`${resolvedTestId}_text`}>
          {message}
        </span>
      )}
    </div>
  );
}
