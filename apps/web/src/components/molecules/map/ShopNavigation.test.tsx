import { fireEvent, render, screen } from "@testing-library/react";
import { ShopDepartmentTabs, ShopMerchantTabs } from "./ShopNavigation";
import type { ShopMerchant } from "@/lib/townShops";

const merchants: ShopMerchant[] = [
  { id: "weapons", name: "Weapons NPC", tabs: [{ id: "swords", label: "Swords", items: [] }] },
  { id: "armor", name: "Armor NPC", tabs: [{ id: "suits", label: "Suits", items: [] }] }
];

describe("ShopNavigation", () => {
  it("exposes merchant and department selection as accessible tabs", () => {
    const onMerchantSelect = jest.fn();
    const onDepartmentSelect = jest.fn();
    render(
      <>
        <ShopMerchantTabs
          activeMerchant={merchants[0]}
          merchants={merchants}
          onSelect={onMerchantSelect}
          shopName="Armory"
        />
        <ShopDepartmentTabs
          activeTab={merchants[0].tabs[0]}
          onSelect={onDepartmentSelect}
          shopName="Armory"
          tabs={merchants[0].tabs}
        />
      </>
    );

    expect(screen.getByRole("tab", { name: "Weapons NPC" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Armor NPC" }));
    fireEvent.click(screen.getByRole("tab", { name: "Swords" }));
    expect(onMerchantSelect).toHaveBeenCalledWith("armor");
    expect(onDepartmentSelect).toHaveBeenCalledWith("swords");
  });

  it("omits merchant navigation when there is only one merchant", () => {
    const { container } = render(
      <ShopMerchantTabs
        activeMerchant={merchants[0]}
        merchants={[merchants[0]]}
        onSelect={jest.fn()}
        shopName="Armory"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
