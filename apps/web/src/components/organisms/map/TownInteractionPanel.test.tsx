import { render, screen } from "@testing-library/react";
import { TownInteractionPanel } from "@/components/organisms/map/TownInteractionPanel";
import { fetchTownShop } from "@/lib/api";
import type { TownMapLocation } from "@/lib/townMapLocations";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  fetchTownShop: jest.fn()
}));

const shopLocation = {
  id: "general-store",
  label: "General Store",
  kind: "shop",
  iconSrc: "/shop.png",
  x: 20,
  y: 30
} as TownMapLocation;

describe("TownInteractionPanel", () => {
  const mockedFetchTownShop = jest.mocked(fetchTownShop);

  beforeEach(() => mockedFetchTownShop.mockReset());

  it("prompts for a location when none is selected", () => {
    render(<TownInteractionPanel location={null} townMapId="flarine-town" />);
    expect(screen.getByText("Select a town location")).toBeInTheDocument();
  });

  it("loads and renders the selected shop", async () => {
    mockedFetchTownShop.mockResolvedValue({
      id: "flarine-town/general-store",
      merchantNames: ["Lui"],
      merchants: [
        {
          id: "lui",
          name: "Lui",
          tabs: [{ id: "posters", label: "Posters", items: [] }]
        }
      ]
    });
    render(<TownInteractionPanel location={shopLocation} townMapId="flarine-town" />);

    expect(screen.getByText("Loading inventory...")).toBeInTheDocument();
    expect(await screen.findByTestId("map_section_general_store")).toBeInTheDocument();
    expect(mockedFetchTownShop).toHaveBeenCalledWith("flarine-town", "general-store");
  });

  it("shows shop loading errors", async () => {
    mockedFetchTownShop.mockRejectedValue(new Error("Inventory unavailable"));
    render(<TownInteractionPanel location={shopLocation} townMapId="flarine-town" />);
    expect(await screen.findByText("Inventory unavailable")).toBeInTheDocument();
  });

  it("shows a placeholder for an unfinished NPC", () => {
    render(
      <TownInteractionPanel
        location={{ ...shopLocation, id: "quest-office", kind: "npc", label: "Quest Office" }}
        townMapId="flarine-town"
      />
    );
    expect(screen.getByText("This npc is not available yet.")).toBeInTheDocument();
  });
});
