import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { Panel } from "@/components/atoms/Panel";
import { ShopFilters } from "@/components/molecules/map/ShopFilters";
import { ShopQuantityControl } from "@/components/molecules/map/ShopQuantityControl";
import type { ShopTransactionMode } from "@/hooks/map/useShopState";
import type { ShopInventoryItem } from "@/lib/townShops";

type ShopTransactionPanelProps = {
  canAfford: boolean;
  characterLevel?: number;
  characterJob?: string;
  characterSex?: "female" | "male";
  error: string;
  filterByClass: boolean;
  filterByLevel: boolean;
  filterBySex: boolean;
  isTransacting: boolean;
  maximumQuantity: number;
  mode: ShopTransactionMode;
  onFilterChange: (filter: "class" | "level" | "sex", checked: boolean) => void;
  onQuantityChange: (quantity: number) => void;
  onSubmit: () => void;
  quantity: number;
  submitEnabled: boolean;
  totalPrice: number;
  transactionItem?: ShopInventoryItem;
};

export function ShopTransactionPanel(props: ShopTransactionPanelProps) {
  const filters = (
    <ShopFilters
      characterLevel={props.characterLevel}
      characterJob={props.characterJob}
      characterSex={props.characterSex}
      filterByClass={props.filterByClass}
      filterByLevel={props.filterByLevel}
      filterBySex={props.filterBySex}
      onChange={props.onFilterChange}
    />
  );

  return (
    <Panel
      as="section"
      className="h-[250px] min-w-0 max-w-full grid-cols-[92px_minmax(0,1fr)] content-stretch gap-3 overflow-hidden border-border bg-panel-muted p-3"
      data-testid="map_panel_general_store_price"
    >
      {filters}
      {props.transactionItem ? (
        <TransactionDetails {...props} transactionItem={props.transactionItem} />
      ) : (
        <div className="grid place-items-center">
          <p className="text-center text-sm font-extrabold text-text-muted">
            Clear a filter to select an item.
          </p>
        </div>
      )}
    </Panel>
  );
}

function TransactionDetails(props: ShopTransactionPanelProps & { transactionItem: ShopInventoryItem }) {
  const action = props.mode === "buy" ? "Buy" : "Sell";

  return (
    <div className="themed-scrollbar grid min-h-0 min-w-0 content-start gap-3 overflow-y-auto pr-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-foreground">{props.transactionItem.name}</p>
          <p className="text-xs text-text-muted">
            {action} price: {props.transactionItem.price.toLocaleString()} Penya each
          </p>
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] font-black uppercase tracking-wide text-text-muted">Total</p>
          <strong className="shrink-0 text-base font-black text-[#f4cf67]">
            {props.totalPrice.toLocaleString()} Penya
          </strong>
        </div>
      </div>
      <ShopQuantityControl
        disabled={props.isTransacting}
        maximum={props.maximumQuantity}
        onChange={props.onQuantityChange}
        quantity={props.quantity}
      />
      <Button
        aria-label={`${action} ${props.quantity} ${props.transactionItem.name}`}
        className="w-full"
        disabled={props.isTransacting || !props.canAfford || !props.submitEnabled}
        onClick={props.onSubmit}
        type="button"
      >
        {props.isTransacting
          ? props.mode === "buy"
            ? "Buying..."
            : "Selling..."
          : !props.canAfford
            ? props.mode === "buy"
              ? "Not enough Penya"
              : "Cannot sell"
            : `${action} ${props.quantity.toLocaleString()}`}
      </Button>
      {props.error ? <ErrorMessage message={props.error} /> : null}
    </div>
  );
}
