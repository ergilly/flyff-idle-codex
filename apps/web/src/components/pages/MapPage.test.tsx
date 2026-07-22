import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MapPage } from "./MapPage";
import { flarineGeneralStoreTabs } from "@/lib/townShops";

describe("MapPage", () => {
  it("opens directly to a requested respawn town", async () => {
    render(<MapPage initialTownMapId="darken-city" />);

    expect(await screen.findByRole("img", { name: "Darken City map" })).toHaveAttribute(
      "src",
      "/images/maps/towns/Town_Darken_Clean.png"
    );
  });

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const requestUrl = new URL(url);
      const monsterName = requestUrl.searchParams.get("name") ?? "Aibatt";
      const mapMonster = (
        id: number,
        name: string,
        family: string,
        rank: string,
        level: number,
        element: string,
        region: string,
        x: number,
        y: number
      ) => ({
        id,
        name,
        event: false,
        level,
        rank,
        area: "normal",
        element,
        hp: 100,
        minAttack: 1,
        maxAttack: 2,
        attackSpeed: 1,
        attackDelay: 6,
        defense: 1,
        magicDefense: 1,
        minDropGold: 1,
        maxDropGold: 2,
        drops: [{ item: 100 }],
        icon: `${name.toLowerCase().replaceAll(" ", "-")}.png`,
        family,
        location: { region, x, y }
      });
      const explicitMonsters: Record<string, { element: string; level: number; rank: string }> = {
        "Small Aibatt": { element: "wind", level: 1, rank: "small" },
        Aibatt: { element: "wind", level: 1, rank: "normal" },
        "Captain Aibatt": { element: "wind", level: 2, rank: "captain" },
        "Giant Aibatt": { element: "fire", level: 5, rank: "giant" },
        "Private Bearnerky": { element: "earth", level: 108, rank: "small" },
        "Sergeant Bearnerky": { element: "earth", level: 109, rank: "normal" },
        "Captain Bearnerky": { element: "earth", level: 110, rank: "captain" },
        "General Bearnerky": { element: "earth", level: 113, rank: "giant" }
      };

      if (requestUrl.pathname.endsWith("/api/shops/flarine-town/general-store")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            shop: {
              id: "flarine-town/general-store",
              merchantNames: ["Lui"],
              merchants: [{ id: "850", name: "Lui", tabs: flarineGeneralStoreTabs }]
            }
          })
        });
      }

      if (requestUrl.pathname.endsWith("/api/data/mapMonsters")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "mapMonsters",
            total: 8,
            limit: 500,
            offset: 0,
            results: [
              mapMonster(1, "Small Aibatt", "aibatt", "small", 1, "wind", "flaris", 35, 70),
              mapMonster(2, "Aibatt", "aibatt", "normal", 1, "wind", "flaris", 35, 70),
              mapMonster(3, "Captain Aibatt", "aibatt", "captain", 2, "wind", "flaris", 35, 70),
              mapMonster(4, "Giant Aibatt", "aibatt", "giant", 5, "fire", "flaris", 35, 70),
              mapMonster(5, "Private Bearnerky", "bearnerky", "small", 108, "earth", "darkon3", 67, 65),
              mapMonster(6, "Sergeant Bearnerky", "bearnerky", "normal", 109, "earth", "darkon3", 67, 65),
              mapMonster(7, "Captain Bearnerky", "bearnerky", "captain", 110, "earth", "darkon3", 67, 65),
              mapMonster(8, "General Bearnerky", "bearnerky", "giant", 113, "earth", "darkon3", 67, 65)
            ]
          })
        });
      }

      if (requestUrl.pathname.endsWith("/api/data/items")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "items",
            total: 1,
            limit: 500,
            offset: 0,
            results:
              requestUrl.searchParams.get("category") === "booty"
                ? [{ id: 100, name: "Twinkle Stone", icon: "twinkle.png", category: "booty" }]
                : []
          })
        });
      }

      if (requestUrl.searchParams.has("minLevel")) {
        return Promise.resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({
            dataSet: "monsters",
            total: 4,
            limit: 500,
            offset: 0,
            results: [
              {
                id: 1,
                name: "Small Aibatt",
                event: false,
                level: 1,
                rank: "small",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 2,
                name: "Aibatt",
                event: false,
                level: 1,
                rank: "normal",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 3,
                name: "Captain Aibatt",
                event: false,
                level: 2,
                rank: "captain",
                element: "wind",
                drops: [{ item: 100 }]
              },
              {
                id: 4,
                name: "Giant Aibatt",
                event: false,
                level: 5,
                rank: "giant",
                element: "fire",
                drops: [{ item: 100 }]
              }
            ]
          })
        });
      }

      return Promise.resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({
          dataSet: "monsters",
          total: 1,
          limit: 1,
          offset: 0,
          results: [
            {
              id: 1,
              name: monsterName,
              event: false,
              level: explicitMonsters[monsterName]?.level ?? (monsterName === "Aibatt" ? 1 : 2),
              rank: explicitMonsters[monsterName]?.rank ?? "normal",
              area: "normal",
              element: explicitMonsters[monsterName]?.element ?? "earth",
              drops: [{ item: 100 }]
            }
          ]
        })
      });
    }) as jest.Mock;
  });

  it("highlights a hovered region and opens its region map", async () => {
    render(<MapPage />);

    expect(screen.getByRole("img", { name: "Madrigal world map" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Current location: Flaris" })).toHaveTextContent("You are here");
    expect(screen.getByText("Select a region")).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole("button", { name: "Select Flaris" }));

    expect(screen.getByRole("heading", { name: "Flaris" })).toBeInTheDocument();
    expect(screen.getByText("A smaller island region southeast of the mainland.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));

    expect(screen.getByRole("img", { name: "Flaris map" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Aibatt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to world" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    expect(screen.getByRole("button", { name: "Reset zoom" })).toHaveTextContent("125%");

    fireEvent.click(screen.getByRole("button", { name: "Back to world" }));

    expect(screen.getByRole("img", { name: "Madrigal world map" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset zoom" })).toHaveTextContent("100%");
  });

  it("confirms travel and offers only available flying or Blinkwing methods", async () => {
    const onTravel = jest.fn().mockResolvedValue(undefined);
    render(
      <MapPage
        characterInventory={{
          size: 50,
          items: [{ slotIndex: 4, itemId: "6617", quantity: 2 }]
        }}
        characterLocation="Flaris"
        onTravel={onTravel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Select Saint Morning" }));

    expect(screen.getByRole("dialog", { name: "Travel to Saint Morning?" })).toBeInTheDocument();
    expect(screen.getByTestId("map_travel_button_flying")).toBeDisabled();
    expect(screen.getByText("Blinkwing of Saint Morning: 2 available")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Use Blinkwing" }));

    await waitFor(() => expect(onTravel).toHaveBeenCalledWith("saint", "blinkwing"));
    expect(await screen.findByRole("img", { name: "Saint Morning map" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("requires flying travel for an area without a Blinkwing", async () => {
    render(<MapPage characterLocation="Flaris" onTravel={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Select Rhisis" }));

    expect(screen.getByRole("dialog", { name: "Travel to Rhisis?" })).toBeInTheDocument();
    expect(screen.getByText("No Blinkwing travels to this area")).toBeInTheDocument();
    expect(screen.getByTestId("map_travel_button_flying")).toBeDisabled();
    expect(screen.queryByTestId("map_travel_button_blinkwing")).not.toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("shows monster details from the assigned marker name", async () => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));

    expect(await screen.findAllByText("Lv. 1")).toHaveLength(2);
    expect(screen.getByText("Small Aibatt")).toBeInTheDocument();
    expect(screen.getByText("Giant Aibatt")).toBeInTheDocument();
    expect(screen.getAllByText("Twinkle Stone").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: "wind element" })).toHaveLength(3);
  });

  it("shows town and dungeon markers on their assigned region maps", async () => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));

    const flarineMarker = screen.getByRole("button", { name: "Flarine Town" });
    expect(flarineMarker).toBeInTheDocument();
    expect(flarineMarker.getAttribute("style")).toContain("--map-marker-saturation: 30%");
    expect(screen.getByRole("button", { name: "Mars Mine" })).toBeInTheDocument();
    expect(
      screen.getByTestId("map_span_monster_marker_icon_flaris_town_flarine_town").querySelector("img")
    ).toHaveAttribute("src", "/images/maps/icons/town-flarine-256.webp");
    expect(
      screen.getByTestId("map_span_monster_marker_icon_flaris_dungeon_mars_mine").querySelector("img")
    ).toHaveAttribute("src", "/images/maps/icons/purple-background-regenerated/256px/dungeon-mars-mine.webp");
    await waitFor(() => expect(screen.queryByTestId("map_div_monsters_loading")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Back to world" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Darkon 1 and 2" }));

    expect(screen.getByRole("button", { name: "Darken City" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Floating Castle" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "The Wilds" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Savage Wilds" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Isle of Dreams" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Island of Nightmares" })).toBeInTheDocument();
    expect(
      screen.getByTestId("map_span_monster_marker_icon_darkon12_dungeon_floating_castle").querySelector("img")
    ).toHaveAttribute("src", "/images/maps/icons/floating-fortress-saturated-256.webp");
    await waitFor(() => expect(screen.queryByTestId("map_div_monsters_loading")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Back to world" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Bahara" }));

    expect(screen.getByRole("button", { name: "Randera Camp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kalgas Cave" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId("map_div_monsters_loading")).not.toBeInTheDocument());
  });

  it.each([
    ["Flaris", "Flarine Town", "/images/maps/towns/Town_Flarine_Clean.png", "Red Chip Merchant, shop"],
    ["Saint Morning", "Sain City", "/images/maps/towns/Town_Saincity_Clean.png", "Station, shop"],
    ["Darkon 1 and 2", "Darken City", "/images/maps/towns/Town_Darken_Clean.png", "Armory, shop"],
    ["Eillun", "Eillun", "/images/maps/towns/Town_Elliun_Clean.png", "Guild House Manager, npc"]
  ])("opens the %s town map from its marker", async (region, town, townMapSrc, locationButtonName) => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole("button", { name: `Select ${region}` }));
    fireEvent.click(
      region === "Eillun"
        ? screen.getByTestId("map_button_monster_marker_kaillun_town_eillun")
        : screen.getByRole("button", { name: town })
    );

    expect(screen.getByRole("img", { name: `${town} map` })).toHaveAttribute("src", townMapSrc);
    expect(screen.getByRole("heading", { name: town })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to region" })).toBeInTheDocument();
    expect(screen.queryByTestId("map_div_monster_marker_layer")).not.toBeInTheDocument();
    expect(screen.getByTestId("map_div_town_location_layer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: locationButtonName })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to region" }));

    expect(screen.getByRole("img", { name: `${region} map` })).toBeInTheDocument();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("treats entering a town as leaving combat", () => {
    const onEnterTown = jest.fn();
    render(<MapPage onEnterTown={onEnterTown} />);

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));
    fireEvent.click(screen.getByRole("button", { name: "Flarine Town" }));

    expect(onEnterTown).toHaveBeenCalledTimes(1);
  });

  it("turns town shops and NPCs into selectable map buttons", async () => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));
    fireEvent.click(screen.getByRole("button", { name: "Flarine Town" }));

    const generalStore = screen.getByRole("button", { name: "General Store, shop" });
    const petTamer = screen.getByRole("button", { name: "Pet Tamer, npc" });

    expect(generalStore).toHaveAttribute("aria-pressed", "false");
    expect(petTamer).toBeInTheDocument();
    expect(generalStore).toHaveTextContent("General Store");
    expect(generalStore.querySelector("img")).toHaveAttribute(
      "src",
      "/images/maps/town-icons/general-store.png"
    );

    fireEvent.click(generalStore);

    expect(generalStore).toHaveAttribute("aria-pressed", "true");
    expect(await screen.findByTestId("map_section_general_store")).toHaveTextContent("General Store");
  });

  it("uses the town panel for Flarine General Store inventory", async () => {
    const handleBuyShopItem = jest.fn().mockResolvedValue(undefined);

    render(<MapPage characterPenya={10_000} onBuyShopItem={handleBuyShopItem} />);

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));
    fireEvent.click(screen.getByRole("button", { name: "Flarine Town" }));

    expect(screen.queryByTestId("map_div_region_list")).not.toBeInTheDocument();
    expect(screen.getByTestId("map_div_town_interaction_prompt")).toHaveTextContent("Select a town location");

    fireEvent.click(screen.getByRole("button", { name: "General Store, shop" }));

    expect(await screen.findByRole("tab", { name: "Posters" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Skill Poster");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Bless Poster");
    expect(screen.getByTestId("map_panel_general_store_price")).toHaveTextContent(
      "Skill PosterBuy price: 50 Penya eachTotal50 Penya"
    );

    fireEvent.click(screen.getByRole("button", { name: "Bless Poster, 50 Penya" }));
    const quantityInput = screen.getByRole("spinbutton", { name: "Purchase quantity" });
    expect(quantityInput).toHaveAttribute("max", "9999");
    fireEvent.change(quantityInput, {
      target: { value: "3" }
    });
    expect(screen.getByTestId("map_panel_general_store_price")).toHaveTextContent("Total150 Penya");
    fireEvent.click(screen.getByRole("button", { name: "Buy 3 Bless Poster" }));

    await waitFor(() =>
      expect(handleBuyShopItem).toHaveBeenCalledWith("flarine-town", "general-store", "3907", 3)
    );

    fireEvent.click(screen.getByRole("tab", { name: "Magic Tools" }));

    const magicTools = screen.getByRole("tabpanel");
    expect(magicTools).toHaveTextContent("First Refresher");
    expect(magicTools).toHaveTextContent("Fifth Refresher");
    expect(magicTools).toHaveTextContent("VitalDrink 100");
    expect(magicTools).toHaveTextContent("VitalDrink 500");

    fireEvent.click(screen.getByRole("tab", { name: "Arrows" }));

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Arrows");
    expect(screen.getByTestId("map_panel_general_store_price")).toHaveTextContent(
      "ArrowsBuy price: 1 Penya eachTotal1 Penya"
    );
  });

  it("keeps town shop and NPC icons the same size while zooming", async () => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));
    fireEvent.click(screen.getByRole("button", { name: "Flarine Town" }));

    const generalStore = screen.getByRole("button", { name: "General Store, shop" });
    expect(generalStore).toHaveStyle({ width: "3.25%" });

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    expect(generalStore).toHaveStyle({ width: "2.6%" });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("renders explicit family names for Darkon 3 monsters", async () => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole("button", { name: "Select Darkon 3" }));

    expect(await screen.findByRole("button", { name: "Bearnerky" })).toBeInTheDocument();
    expect(await screen.findByText("Sergeant Bearnerky")).toBeInTheDocument();
    expect(screen.getByText("Private Bearnerky")).toBeInTheDocument();
    expect(screen.getByText("Captain Bearnerky")).toBeInTheDocument();
    expect(screen.getByText("General Bearnerky")).toBeInTheDocument();
  });

  it("selects a monster family from a map marker", async () => {
    const handleSelectMonster = jest.fn();

    render(<MapPage onSelectMonster={handleSelectMonster} />);

    fireEvent.click(screen.getByRole("button", { name: "Select Flaris" }));
    const aibattMarker = await screen.findByRole("button", { name: "Aibatt" });
    expect(aibattMarker.getAttribute("style")).not.toContain("--map-marker-saturation");
    fireEvent.click(aibattMarker);

    expect(handleSelectMonster).toHaveBeenCalledWith(
      expect.objectContaining({
        family: "aibatt",
        name: "Aibatt"
      })
    );
  });
});
