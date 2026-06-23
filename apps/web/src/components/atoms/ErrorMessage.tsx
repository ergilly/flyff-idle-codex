export function ErrorMessage({ message }: { message: string }) {
  const [summary, ...detailLines] = message.split("\n");
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
      role="alert"
    >
      {detailRows.length > 0 ? (
        <div className="grid gap-2">
          <span>{summary}</span>
          <div className="grid gap-1">
            {detailRows.map(({ label, value }) => (
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4" key={`${label}-${value}`}>
                <span>{label}</span>
                <strong className="text-right">{value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <span className="whitespace-pre-line">{message}</span>
      )}
    </div>
  );
}
