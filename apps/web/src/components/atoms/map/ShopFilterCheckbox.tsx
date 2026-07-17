type ShopFilterCheckboxProps = {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

export function ShopFilterCheckbox({ checked, disabled, label, onChange }: ShopFilterCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <input
        checked={checked}
        className="h-4 w-4 accent-primary"
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}
