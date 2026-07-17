import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MapTravelDialog } from "@/components/organisms/map/MapTravelDialog";
import { mapTravelDestinations } from "@/lib/mapTravel";

describe("MapTravelDialog", () => {
  it("enables each available travel method", async () => {
    const onTravel = jest.fn().mockResolvedValue(undefined);
    render(
      <MapTravelDialog
        destination={mapTravelDestinations.saint}
        equippedFlyingItemId="8507"
        inventory={{ size: 1, items: [{ itemId: "6617", quantity: 2, slotIndex: 0 }] }}
        onCancel={jest.fn()}
        onTravel={onTravel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Fly" }));
    await waitFor(() => expect(onTravel).toHaveBeenCalledWith("flying"));
  });

  it("disables unavailable methods and omits Blinkwings for unsupported areas", () => {
    render(
      <MapTravelDialog destination={mapTravelDestinations.bahara} onCancel={jest.fn()} onTravel={jest.fn()} />
    );

    expect(screen.getByRole("button", { name: "Fly" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Use Blinkwing" })).not.toBeInTheDocument();
  });

  it("shows travel failures and restores its controls", async () => {
    render(
      <MapTravelDialog
        destination={mapTravelDestinations.saint}
        inventory={{ size: 1, items: [{ itemId: "6617", quantity: 1, slotIndex: 0 }] }}
        onCancel={jest.fn()}
        onTravel={jest.fn().mockRejectedValue(new Error("Server rejected travel"))}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Use Blinkwing" }));
    expect(await screen.findByText("Server rejected travel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use Blinkwing" })).toBeEnabled();
  });
});
