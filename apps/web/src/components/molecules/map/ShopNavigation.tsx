import { cx } from "@/lib/classNames";
import type { ShopInventoryTab, ShopMerchant } from "@/lib/townShops";

export function ShopMerchantTabs({
  activeMerchant,
  merchants,
  onSelect,
  shopName
}: {
  activeMerchant: ShopMerchant;
  merchants: ShopMerchant[];
  onSelect: (merchantId: string) => void;
  shopName: string;
}) {
  if (merchants.length <= 1) return null;

  return (
    <div
      aria-label={`${shopName} merchants`}
      className="themed-scrollbar flex h-[52px] w-full min-w-0 max-w-full gap-1 overflow-x-auto rounded-control border-2 border-primary/60 bg-panel-muted p-1"
      role="tablist"
    >
      {merchants.map((merchant) => (
        <button
          aria-selected={merchant.id === activeMerchant.id}
          className={cx(
            "min-h-10 shrink-0 whitespace-nowrap rounded-control border-2 px-3 text-xs font-black transition-colors",
            merchant.id === activeMerchant.id
              ? "border-primary bg-panel text-foreground"
              : "border-transparent text-text-muted hover:text-foreground"
          )}
          key={merchant.id}
          onClick={() => onSelect(merchant.id)}
          role="tab"
          type="button"
        >
          {merchant.name}
        </button>
      ))}
    </div>
  );
}

export function ShopDepartmentTabs({
  activeTab,
  onSelect,
  shopName,
  tabs
}: {
  activeTab: ShopInventoryTab;
  onSelect: (tabId: string) => void;
  shopName: string;
  tabs: ShopInventoryTab[];
}) {
  return (
    <div
      aria-label={`${shopName} departments`}
      className="themed-scrollbar flex h-11 w-full min-w-0 max-w-full gap-1 overflow-x-auto rounded-control bg-panel-muted p-1"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          aria-controls={`general-store-panel-${tab.id}`}
          aria-selected={activeTab.id === tab.id}
          className={cx(
            "min-h-9 shrink-0 whitespace-nowrap rounded-control border-2 px-2 text-xs font-extrabold transition-colors",
            activeTab.id === tab.id
              ? "border-primary bg-panel text-foreground"
              : "border-transparent bg-transparent text-text-muted hover:text-foreground"
          )}
          id={`general-store-tab-${tab.id}`}
          onClick={() => onSelect(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
