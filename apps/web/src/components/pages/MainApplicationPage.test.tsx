import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MainApplicationPage } from "./MainApplicationPage";
import {
  addCharacterInventoryItem,
  equipInventoryItem,
  fetchCharacters,
  fetchItems,
  moveInventoryItem,
  refundCharacterSkills,
  refundCharacterStats,
  sortInventory,
  unequipItem,
  updateCharacterProgression,
  type Character
} from "@/lib/api";
import { fetchUnlockedSkillTabs } from "@/lib/skillTrees";

const push = jest.fn();
const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace })
}));

jest.mock("@/lib/api", () => ({
  addCharacterInventoryItem: jest.fn(),
  equipInventoryItem: jest.fn(),
  fetchCharacters: jest.fn(),
  fetchItems: jest.fn(),
  moveInventoryItem: jest.fn(),
  refundCharacterSkills: jest.fn(),
  refundCharacterStats: jest.fn(),
  sortInventory: jest.fn(),
  unequipItem: jest.fn(),
  updateCharacterProgression: jest.fn()
}));

jest.mock("@/lib/characterProgression", () => ({
  getAvailableStatPoints: jest.fn(() => 10),
  getTotalSkillPoints: jest.fn(() => 4)
}));

jest.mock("@/lib/skillTrees", () => ({
  areSkillRequirementsMet: jest.fn(() => true),
  canRemovePendingSkillLevel: jest.fn(() => true),
  fetchUnlockedSkillTabs: jest.fn(),
  getSpentSkillPointsForSkills: jest.fn((_skills, levels) =>
    Object.values(levels as Record<string, number>).reduce((total, level) => total + level, 0)
  ),
  getUnlockedSkills: jest.fn((tabs) => tabs.flatMap((tab: { skills: unknown[] }) => tab.skills))
}));

jest.mock("@/components/organisms/main-application/MainApplicationSidebar", () => ({
  navItems: [{ label: "Character Page" }, { label: "Inventory" }, { label: "Map" }],
  MainApplicationSidebar: ({
    isAdmin,
    onLogout,
    onSelectNavItem,
    onThemeToggle,
    theme
  }: {
    isAdmin: boolean;
    onLogout: () => void;
    onSelectNavItem: (label: string) => void;
    onThemeToggle: () => void;
    theme: string;
  }) => (
    <nav aria-label="mock sidebar">
      <button type="button" onClick={() => onSelectNavItem("Character Page")}>
        Character Page
      </button>
      <button type="button" onClick={() => onSelectNavItem("Inventory")}>
        Inventory
      </button>
      <button type="button" onClick={() => onSelectNavItem("Map")}>
        Map
      </button>
      {isAdmin ? (
        <button type="button" onClick={() => onSelectNavItem("Admin")}>
          Admin
        </button>
      ) : null}
      <button type="button" onClick={onThemeToggle}>
        Toggle {theme}
      </button>
      <button type="button" onClick={onLogout}>
        Logout
      </button>
    </nav>
  )
}));

jest.mock("@/components/organisms/main-application/MainApplicationHeader", () => ({
  MainApplicationHeader: ({ onChangeCharacter }: { onChangeCharacter: () => void }) => (
    <header>
      <button type="button" onClick={onChangeCharacter}>
        Header change character
      </button>
    </header>
  )
}));

jest.mock("@/components/molecules/main-application/ContentHeading", () => ({
  ContentHeading: ({ activeNavItem }: { activeNavItem: string }) => <h1>{activeNavItem}</h1>
}));

jest.mock("@/components/organisms/main-application/CharacterPageContent", () => ({
  CharacterPageContent: ({
    character,
    onAddSkillLevel,
    onAddStat,
    onApplySkills,
    onApplyStats,
    onRemoveSkillLevel,
    onRemoveStat,
    onResetSkills,
    onResetStats,
    onSelectEquipmentItem,
    onUnequipEquipmentSlot,
    availableStatPoints,
    pendingSkillLevels,
    pendingStats
  }: {
    character: Character;
    onAddSkillLevel: (skill: {
      id: string;
      costPerLevel: number;
      maxLevel: number;
      requiredLevel: number;
      requirements: unknown[];
    }) => void;
    onAddStat: (stat: "str") => void;
    onApplySkills: () => void;
    onApplyStats: () => void;
    onRemoveSkillLevel: (skill: {
      id: string;
      costPerLevel: number;
      maxLevel: number;
      requiredLevel: number;
      requirements: unknown[];
    }) => void;
    onRemoveStat: (stat: "str") => void;
    onResetSkills: () => void;
    onResetStats: () => void;
    onSelectEquipmentItem: (itemId: string) => void;
    onUnequipEquipmentSlot: (slot: "cloak") => void;
    pendingSkillLevels: Record<string, number>;
    pendingStats: Record<string, number>;
    availableStatPoints: number;
  }) => {
    const skill = {
      id: "vagrant-clean-hit",
      costPerLevel: 1,
      maxLevel: 20,
      requiredLevel: 1,
      requirements: []
    };

    return (
      <section aria-label="mock character page">
        <p>{character.name}</p>
        <p>available stats {availableStatPoints}</p>
        <p>pending str {pendingStats.str}</p>
        <p>pending skills {pendingSkillLevels["vagrant-clean-hit"] ?? 0}</p>
        <button type="button" onClick={() => onAddStat("str")}>
          Add STR
        </button>
        <button type="button" onClick={() => onRemoveStat("str")}>
          Remove STR
        </button>
        <button type="button" onClick={onApplyStats}>
          Apply Stats
        </button>
        <button type="button" onClick={onResetStats}>
          Reset Stats
        </button>
        <button type="button" onClick={() => onAddSkillLevel(skill)}>
          Add Skill
        </button>
        <button type="button" onClick={() => onRemoveSkillLevel(skill)}>
          Remove Skill
        </button>
        <button type="button" onClick={onApplySkills}>
          Apply Skills
        </button>
        <button type="button" onClick={onResetSkills}>
          Reset Skills
        </button>
        <button type="button" onClick={() => onSelectEquipmentItem("40")}>
          Select Equipment
        </button>
        <button type="button" onClick={() => onUnequipEquipmentSlot("cloak")}>
          Unequip Cloak
        </button>
      </section>
    );
  }
}));

jest.mock("./InventoryPage", () => ({
  InventoryPage: ({
    onEquipSlot,
    onMoveItem,
    onSelectSlot,
    onSortInventory,
    selectedSlotIndex
  }: {
    onEquipSlot: (slot: number) => void;
    onMoveItem: (from: number, to: number) => void;
    onSelectSlot: (slot: number | null) => void;
    onSortInventory: (sortBy: "name") => void;
    selectedSlotIndex: number | null;
  }) => (
    <section aria-label="mock inventory">
      <p>selected slot {selectedSlotIndex ?? "none"}</p>
      <button type="button" onClick={() => onSelectSlot(0)}>
        Select Slot
      </button>
      <button type="button" onClick={() => onEquipSlot(0)}>
        Equip Slot
      </button>
      <button type="button" onClick={() => onMoveItem(0, 3)}>
        Move Slot
      </button>
      <button type="button" onClick={() => onSortInventory("name")}>
        Sort Name
      </button>
    </section>
  )
}));

jest.mock("./AdminPage", () => ({
  AdminPage: ({
    onAddInventoryItem,
    onRefundSkills,
    onRefundStats
  }: {
    onAddInventoryItem: (itemId: string, quantity: number) => void;
    onRefundSkills: () => void;
    onRefundStats: () => void;
  }) => (
    <section aria-label="mock admin">
      <button type="button" onClick={onRefundStats}>
        Refund Stats
      </button>
      <button type="button" onClick={onRefundSkills}>
        Refund Skills
      </button>
      <button type="button" onClick={() => onAddInventoryItem("40", 2)}>
        Add Item
      </button>
    </section>
  )
}));

jest.mock("@/components/organisms/main-application/DashboardStatsGrid", () => ({
  DashboardStatsGrid: ({ character }: { character: Character }) => (
    <section>Dashboard {character.name}</section>
  )
}));

const baseCharacter: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Saint Morning",
  gender: "female",
  job: "Vagrant",
  progressionRank: "normal",
  level: 20,
  exp: 0,
  penya: 10,
  stats: { str: 15, sta: 15, dex: 15, int: 15 },
  skillLevels: {},
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
    cloak: "40",
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
    size: 50,
    items: [{ slotIndex: 0, itemId: "5325", quantity: 3 }]
  }
};

function getByTextContent(text: string) {
  return screen.getByText((_content, element) => element?.textContent === text);
}

function arrangeSession(character: Character = baseCharacter) {
  localStorage.setItem("flyffIdleToken", "token");
  localStorage.setItem("flyffIdleSelectedCharacterId", character.id);
  localStorage.setItem("flyffIdleUser", JSON.stringify({ isAdmin: true }));
  (fetchCharacters as jest.Mock).mockResolvedValue([character]);
  (fetchItems as jest.Mock).mockResolvedValue([{ id: "40", name: "Dragon Cloak" }]);
  (fetchUnlockedSkillTabs as jest.Mock).mockResolvedValue([
    {
      tier: "vagrant",
      label: "Vagrant",
      imageSrc: "/skills.png",
      imageWidth: 225,
      imageHeight: 135,
      skills: [
        {
          id: "vagrant-clean-hit",
          costPerLevel: 1,
          maxLevel: 20,
          requiredLevel: 1,
          requirements: []
        }
      ]
    }
  ]);
}

describe("MainApplicationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("redirects when required session state is missing", () => {
    render(<MainApplicationPage />);

    expect(replace).toHaveBeenCalledWith("/");

    localStorage.setItem("flyffIdleToken", "token");
    render(<MainApplicationPage />);

    expect(replace).toHaveBeenCalledWith("/characters");
  });

  it("loads the selected character, applies theme, and logs out", async () => {
    arrangeSession();
    localStorage.setItem("flyffIdleTheme", "light");

    render(<MainApplicationPage />);

    expect(await screen.findByText("Saint Morning")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");

    fireEvent.click(screen.getByRole("button", { name: "Toggle light" }));
    expect(document.documentElement.dataset.theme).toBe("dark");

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(localStorage.getItem("flyffIdleToken")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("updates stats, skills, and equipment from the character page", async () => {
    const underSpentCharacter = {
      ...baseCharacter,
      stats: { str: 10, sta: 10, dex: 10, int: 10 }
    };
    arrangeSession(underSpentCharacter);
    const statUpdated = { ...underSpentCharacter, stats: { ...underSpentCharacter.stats, str: 11 } };
    const skillUpdated = { ...statUpdated, skillLevels: { "vagrant-clean-hit": 1 } };
    const unequipped = { ...skillUpdated, equipment: { ...skillUpdated.equipment, cloak: null } };
    (updateCharacterProgression as jest.Mock)
      .mockResolvedValueOnce(statUpdated)
      .mockResolvedValueOnce(skillUpdated);
    (unequipItem as jest.Mock).mockResolvedValue(unequipped);

    render(<MainApplicationPage />);

    await screen.findByText("Saint Morning");

    fireEvent.click(screen.getByRole("button", { name: "Add STR" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Stats" }));

    await waitFor(() =>
      expect(updateCharacterProgression).toHaveBeenCalledWith("token", "char-1", {
        stats: { str: 10, sta: 10, dex: 10, int: 10 }
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Skill" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Skills" }));

    await waitFor(() =>
      expect(updateCharacterProgression).toHaveBeenCalledWith("token", "char-1", {
        skillLevels: {}
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Unequip Cloak" }));
    await waitFor(() => expect(unequipItem).toHaveBeenCalledWith("token", "char-1", "cloak"));
  });

  it("runs inventory and admin actions from their navigation tabs", async () => {
    arrangeSession();
    const inventoryUpdated = {
      ...baseCharacter,
      inventory: { ...baseCharacter.inventory, items: [{ slotIndex: 3, itemId: "5325", quantity: 3 }] }
    };
    const refunded = { ...baseCharacter, stats: { str: 15, sta: 15, dex: 15, int: 15 }, skillLevels: {} };
    (equipInventoryItem as jest.Mock).mockResolvedValue(inventoryUpdated);
    (moveInventoryItem as jest.Mock).mockResolvedValue(inventoryUpdated);
    (sortInventory as jest.Mock).mockResolvedValue(inventoryUpdated);
    (refundCharacterStats as jest.Mock).mockResolvedValue(refunded);
    (refundCharacterSkills as jest.Mock).mockResolvedValue(refunded);
    (addCharacterInventoryItem as jest.Mock).mockResolvedValue(inventoryUpdated);

    render(<MainApplicationPage />);

    await screen.findByText("Saint Morning");
    fireEvent.click(screen.getByRole("button", { name: "Inventory" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Slot" }));
    expect(getByTextContent("selected slot 0")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Equip Slot" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Slot" }));
    fireEvent.click(screen.getByRole("button", { name: "Sort Name" }));

    await waitFor(() => expect(equipInventoryItem).toHaveBeenCalledWith("token", "char-1", 0));
    expect(moveInventoryItem).toHaveBeenCalledWith("token", "char-1", 0, 3);
    expect(sortInventory).toHaveBeenCalledWith("token", "char-1", "name");

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Refund Stats" }));
    fireEvent.click(screen.getByRole("button", { name: "Refund Skills" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => expect(refundCharacterStats).toHaveBeenCalledWith("token", "char-1"));
    expect(refundCharacterSkills).toHaveBeenCalledWith("token", "char-1");
    expect(addCharacterInventoryItem).toHaveBeenCalledWith("token", "char-1", { itemId: "40", quantity: 2 });
  });

  it("handles failed character, inventory, and admin actions", async () => {
    arrangeSession();
    (updateCharacterProgression as jest.Mock).mockRejectedValue(new Error("save failed"));
    (unequipItem as jest.Mock).mockRejectedValue(new Error("unequip failed"));
    (equipInventoryItem as jest.Mock).mockRejectedValue(new Error("equip failed"));
    (moveInventoryItem as jest.Mock).mockRejectedValue(new Error("move failed"));
    (sortInventory as jest.Mock).mockRejectedValue(new Error("sort failed"));
    (refundCharacterStats as jest.Mock).mockRejectedValue(new Error("refund stats failed"));
    (refundCharacterSkills as jest.Mock).mockRejectedValue(new Error("refund skills failed"));
    (addCharacterInventoryItem as jest.Mock).mockRejectedValue(new Error("add failed"));

    render(<MainApplicationPage />);

    await screen.findByText("Saint Morning");
    fireEvent.click(screen.getByRole("button", { name: "Inventory" }));
    fireEvent.click(screen.getByRole("button", { name: "Equip Slot" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Slot" }));
    fireEvent.click(screen.getByRole("button", { name: "Sort Name" }));

    await waitFor(() => expect(equipInventoryItem).toHaveBeenCalledWith("token", "char-1", 0));
    expect(moveInventoryItem).toHaveBeenCalledWith("token", "char-1", 0, 3);
    expect(sortInventory).toHaveBeenCalledWith("token", "char-1", "name");

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Refund Stats" }));
    fireEvent.click(screen.getByRole("button", { name: "Refund Skills" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => expect(refundCharacterStats).toHaveBeenCalledWith("token", "char-1"));
    expect(refundCharacterSkills).toHaveBeenCalledWith("token", "char-1");
    expect(addCharacterInventoryItem).toHaveBeenCalledWith("token", "char-1", { itemId: "40", quantity: 2 });

    fireEvent.click(screen.getByRole("button", { name: "Character Page" }));
    fireEvent.click(screen.getByRole("button", { name: "Unequip Cloak" }));
    await waitFor(() => expect(unequipItem).toHaveBeenCalledWith("token", "char-1", "cloak"));

    fireEvent.click(screen.getByRole("button", { name: "Apply Stats" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply Skills" }));

    await waitFor(() => expect(updateCharacterProgression).toHaveBeenCalledTimes(2));
  });

  it("shows an error state when the selected character cannot load", async () => {
    localStorage.setItem("flyffIdleToken", "token");
    localStorage.setItem("flyffIdleSelectedCharacterId", "missing");
    (fetchCharacters as jest.Mock).mockRejectedValue(new Error("nope"));

    render(<MainApplicationPage />);

    expect(await screen.findByText("Your selected character could not be loaded.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change character" }));

    expect(push).toHaveBeenCalledWith("/characters");
  });
});
