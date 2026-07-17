import { fireEvent, render, screen } from "@testing-library/react";
import { ShopInventorySlot } from "@/components/molecules/map/ShopInventorySlot";
import { buildItem } from "@/test/fixtures";

describe("ShopInventorySlot", () => {
  it("selects and inspects an item while hiding single-item quantities", () => {
    const onSelect = jest.fn();
    const onInspect = jest.fn();
    const item = { ...buildItem({ id: "1" }), icon: "item.png", maxStack: 1, price: 50 };
    render(
      <ShopInventorySlot
        isSelected
        onHideDetails={jest.fn()}
        onInspect={onInspect}
        onSelect={onSelect}
        shopItem={item}
      />
    );
    const button = screen.getByRole("button", { name: "Test Item, 50 Penya" });
    fireEvent.mouseEnter(button);
    fireEvent.click(button);
    expect(onInspect).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalled();
    expect(screen.queryByTestId("shop_item_quantity")).not.toBeInTheDocument();
  });

  it("shows provided stack quantities", () => {
    const item = { ...buildItem({ id: "1" }), icon: "item.png", maxStack: 99, price: 50 };
    render(
      <ShopInventorySlot
        isSelected={false}
        onHideDetails={jest.fn()}
        onInspect={jest.fn()}
        onSelect={jest.fn()}
        quantity={12}
        shopItem={item}
      />
    );
    expect(screen.getByTestId("shop_item_quantity")).toHaveTextContent("12");
  });
});
