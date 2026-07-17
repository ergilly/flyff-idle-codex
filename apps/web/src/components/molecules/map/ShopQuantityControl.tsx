export function ShopQuantityControl({
  disabled,
  maximum,
  onChange,
  quantity
}: {
  disabled: boolean;
  maximum: number;
  onChange: (quantity: number) => void;
  quantity: number;
}) {
  return (
    <label className="grid gap-1 text-[0.65rem] font-black uppercase tracking-wide text-text-muted">
      Quantity
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem_auto] gap-1">
        <button
          aria-label="Decrease quantity"
          className="rounded-control border-2 border-border bg-panel text-lg text-foreground disabled:opacity-50"
          disabled={quantity <= 1 || disabled}
          onClick={() => onChange(Math.max(1, quantity - 1))}
          type="button"
        >
          −
        </button>
        <input
          aria-label="Purchase quantity"
          className="h-11 min-w-0 rounded-control border-2 border-border bg-black/50 px-2 text-center text-2xl font-black leading-none text-foreground outline-none focus:border-primary"
          disabled={disabled}
          max={maximum}
          min={1}
          onChange={(event) => {
            const nextQuantity = event.currentTarget.valueAsNumber;
            onChange(
              Number.isFinite(nextQuantity) ? Math.min(maximum, Math.max(1, Math.trunc(nextQuantity))) : 1
            );
          }}
          type="number"
          value={quantity}
        />
        <button
          aria-label="Increase quantity"
          className="rounded-control border-2 border-border bg-panel text-lg text-foreground disabled:opacity-50"
          disabled={quantity >= maximum || disabled}
          onClick={() => onChange(Math.min(maximum, quantity + 1))}
          type="button"
        >
          +
        </button>
        <button
          className="rounded-control border-2 border-border bg-panel px-2 text-[0.65rem] font-black uppercase text-foreground disabled:opacity-50"
          disabled={quantity >= maximum || disabled}
          onClick={() => onChange(maximum)}
          type="button"
        >
          Max
        </button>
      </div>
      <span className="normal-case tracking-normal">Maximum quantity: {maximum}</span>
    </label>
  );
}
