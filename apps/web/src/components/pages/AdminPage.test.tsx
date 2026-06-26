import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminPage } from "./AdminPage";
import { fetchDataSet, type Character, type ItemMetadata } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  fetchDataSet: jest.fn()
}));

const character: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Saint Morning",
  gender: "female",
  job: "Vagrant",
  progressionRank: "normal",
  level: 12,
  exp: 0,
  penya: 150,
  stats: { str: 17, sta: 16, dex: 15, int: 15 },
  skillLevels: { "vagrant-clean-hit": 2 },
  equipment: {
    helmet: null,
    suit: "3314",
    gloves: null,
    boots: null,
    flying: null,
    csBoots: null,
    csGloves: null,
    csSuit: null,
    csHelm: null,
    mask: null,
    cloak: null,
    ammo: null,
    offhand: null,
    mainhand: "3497",
    ringR: null,
    earringR: null,
    necklace: null,
    earringL: null,
    ringL: null
  },
  inventory: {
    size: 4,
    items: [
      { slotIndex: 0, itemId: "5325", quantity: 3 },
      { slotIndex: 2, itemId: "3896", quantity: 1 }
    ]
  }
};

const cloak: ItemMetadata = {
  id: "40",
  name: "Dragon Cloak of the Master",
  description: null,
  icon: "armcloclodragon.png",
  category: "fashion",
  subcategory: "cloak",
  rarity: "common",
  level: 1,
  sex: null,
  requiredJob: null,
  minAttack: null,
  maxAttack: null,
  attackSpeed: null,
  twoHanded: null,
  minDefense: null,
  maxDefense: null,
  stack: 1,
  abilities: []
};

describe("AdminPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows point totals and triggers refund actions", () => {
    const onRefundSkills = jest.fn();
    const onRefundStats = jest.fn();

    render(
      <AdminPage
        addingInventoryItem={false}
        character={character}
        error="Admin access is required"
        onAddInventoryItem={jest.fn()}
        onRefundSkills={onRefundSkills}
        onRefundStats={onRefundStats}
        refundingAction={null}
      />
    );

    expect(screen.getByText("Saint Morning")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText("Admin access is required")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Refund stat points/ }));
    fireEvent.click(screen.getByRole("button", { name: /Refund skill points/ }));

    expect(onRefundStats).toHaveBeenCalledTimes(1);
    expect(onRefundSkills).toHaveBeenCalledTimes(1);
  });

  it("searches items, selects the first result, and adds the requested quantity", async () => {
    const onAddInventoryItem = jest.fn();
    (fetchDataSet as jest.Mock).mockResolvedValue([cloak]);

    render(
      <AdminPage
        addingInventoryItem={false}
        character={character}
        error=""
        onAddInventoryItem={onAddInventoryItem}
        onRefundSkills={jest.fn()}
        onRefundStats={jest.fn()}
        refundingAction={null}
      />
    );

    fireEvent.change(screen.getByLabelText("Item search"), { target: { value: "cloak" } });
    fireEvent.click(screen.getByRole("button", { name: "Search items" }));

    await waitFor(() =>
      expect(fetchDataSet).toHaveBeenCalledWith("items", {
        fields: "id,name,icon,category,level,rarity,stack",
        limit: 12,
        q: "cloak"
      })
    );
    expect((await screen.findAllByText("Dragon Cloak of the Master")).length).toBeGreaterThan(0);
    expect(screen.getByText("#40 - fashion - Lv. 1")).toBeInTheDocument();
    expect(screen.getByText("Next open slot")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to inventory" }));

    expect(onAddInventoryItem).toHaveBeenCalledWith("40", 7);
  });

  it("validates search input and handles empty results", async () => {
    (fetchDataSet as jest.Mock).mockResolvedValue([]);

    render(
      <AdminPage
        addingInventoryItem={false}
        character={character}
        error=""
        onAddInventoryItem={jest.fn()}
        onRefundSkills={jest.fn()}
        onRefundStats={jest.fn()}
        refundingAction={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Search items" }));
    expect(screen.getByText("Enter an item name or id.")).toBeInTheDocument();
    expect(fetchDataSet).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Item search"), { target: { value: "not-real" } });
    fireEvent.click(screen.getByRole("button", { name: "Search items" }));

    expect(await screen.findByText("No matching items found.")).toBeInTheDocument();
  });
});
