import { fireEvent, render, screen } from "@testing-library/react";
import { TownLocationLayer } from "@/components/organisms/map/TownLocationLayer";
import type { TownMapLocation } from "@/lib/townMapLocations";

const location = {
  id: "general-store",
  label: "General Store",
  kind: "shop",
  iconSrc: "/shop.png",
  x: 20,
  y: 30
} as TownMapLocation;

describe("TownLocationLayer", () => {
  it("renders scaled selectable locations", () => {
    const onSelect = jest.fn();
    render(
      <TownLocationLayer
        locations={[location]}
        onSelectLocation={onSelect}
        selectedLocationId={location.id}
        zoom={2}
      />
    );
    const button = screen.getByRole("button", { name: "General Store, shop" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveStyle({ left: "20%", top: "30%", width: "1.625%" });
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith(location);
  });
});
