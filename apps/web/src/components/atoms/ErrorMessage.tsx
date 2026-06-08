export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="border-l-4 border-l-danger bg-danger-panel px-3 py-2.5 font-bold text-danger"
      role="alert"
    >
      {message}
    </div>
  );
}
