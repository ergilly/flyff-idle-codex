import { fireEvent, render, screen } from "@testing-library/react";
import { AllocationButton } from "@/components/atoms/main-application/AllocationButton";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { StatRow } from "@/components/atoms/StatRow";
import {
  CharacterEquipmentPanel,
  getEquippedItemIds
} from "@/components/molecules/main-application/CharacterEquipmentPanel";
import { CharacterSkillsPanel } from "@/components/molecules/main-application/CharacterSkillsPanel";
import { ContentHeading, PointsSummary } from "@/components/molecules/main-application/ContentHeading";
import { ProfileActionsMenu } from "@/components/molecules/main-application/ProfileActionsMenu";
import { StatAllocationPanel } from "@/components/molecules/main-application/StatAllocationPanel";
import { CharacterPageContent } from "@/components/organisms/main-application/CharacterPageContent";
import { DashboardStatsGrid } from "@/components/organisms/main-application/DashboardStatsGrid";
import { MainApplicationHeader } from "@/components/organisms/main-application/MainApplicationHeader";
import { MainApplicationSidebar } from "@/components/organisms/main-application/MainApplicationSidebar";
import type { Character, ItemMetadata } from "@/lib/api";
import type { SkillDefinition, SkillTreeTab } from "@/lib/skillTrees";

const equipment = {
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
};

const character: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Saint Morning",
  gender: "female",
  job: "Mercenary",
  progressionRank: "normal",
  level: 65,
  exp: 0,
  penya: 123456,
  stats: { str: 20, sta: 18, dex: 17, int: 15 },
  skillLevels: { clean: 1 },
  equipment,
  inventory: { size: 50, items: [] }
};

const woodenSword: ItemMetadata = {
  id: "3497",
  name: "Wooden Sword",
  description: "A basic Wooden Sword.",
  icon: "weaswowooden.png",
  category: "weapon",
  subcategory: "sword",
  rarity: "common",
  level: 1,
  sex: null,
  requiredJob: null,
  minAttack: 5,
  maxAttack: 7,
  attackSpeed: "fast",
  twoHanded: false,
  minDefense: null,
  maxDefense: null,
  stack: 1,
  abilities: [{ parameter: "str", add: 1, rate: false }]
};

const cloak: ItemMetadata = {
  id: "40",
  name: "Dragon Cloak",
  description: "A Dragon Cloak for the brave.",
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

const cleanHit: SkillDefinition = {
  classId: 1,
  className: "Vagrant",
  costPerLevel: 1,
  description: "Hit cleanly.",
  icon: "clean.png",
  id: "clean",
  maxLevel: 3,
  name: "Clean Hit",
  requiredLevel: 1,
  requirements: [],
  tier: "vagrant",
  x: 30,
  y: 35
};

const empowered: SkillDefinition = {
  ...cleanHit,
  classId: 2,
  className: "Mercenary",
  costPerLevel: 2,
  description: "Empower your weapon.",
  icon: "empower.png",
  id: "empower",
  maxLevel: 2,
  name: "Empower Weapon",
  requiredLevel: 15,
  requirements: [{ skill: "clean", skillName: "Clean Hit", level: 1 }],
  tier: "first",
  x: 50,
  y: 50
};

const skillTabs: SkillTreeTab[] = [
  {
    tier: "vagrant",
    label: "Vagrant",
    imageSrc: "/images/skills/Vagrant.png",
    imageWidth: 225,
    imageHeight: 135,
    skills: [cleanHit]
  },
  {
    tier: "first",
    label: "Mercenary",
    imageSrc: "/images/skills/1st-job/Back_Me.png",
    imageWidth: 225,
    imageHeight: 135,
    skills: [empowered]
  }
];

describe("main application components", () => {
  it("renders sidebar, header, profile menus, headings, and dashboard controls", () => {
    const onSelectNavItem = jest.fn();
    const onToggle = jest.fn();
    const onChangeCharacter = jest.fn();
    const onLogout = jest.fn();

    render(
      <>
        <MainApplicationSidebar
          activeNavItem="Inventory"
          characterName="Saint Morning"
          isAdmin
          isMobileNavOpen
          isProfileMenuOpen
          onChangeCharacter={onChangeCharacter}
          onLogout={onLogout}
          onProfileMenuToggle={onToggle}
          onSelectNavItem={onSelectNavItem}
          onThemeToggle={onToggle}
          onToggleMobileNav={onToggle}
          theme="dark"
        />
        <MainApplicationHeader
          character={character}
          isProfileMenuOpen
          onChangeCharacter={onChangeCharacter}
          onLogout={onLogout}
          onProfileMenuToggle={onToggle}
        />
        <ProfileActionsMenu
          characterName="Saint Morning"
          isOpen
          onChangeCharacter={onChangeCharacter}
          onLogout={onLogout}
          onToggle={onToggle}
          variant="mobile"
        />
        <ContentHeading activeNavItem="Inventory" />
        <PointsSummary>
          <span>Available</span>
          <strong>3</strong>
        </PointsSummary>
        <DashboardStatsGrid character={character} />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Light mode" }));
    fireEvent.click(screen.getByRole("button", { name: "Saint Morning" }));
    fireEvent.click(screen.getAllByRole("menuitem", { name: "Change character" })[0]);
    fireEvent.click(screen.getAllByRole("menuitem", { name: "Log out" })[0]);

    expect(onSelectNavItem).toHaveBeenCalledWith("Admin");
    expect(onToggle).toHaveBeenCalled();
    expect(onChangeCharacter).toHaveBeenCalled();
    expect(onLogout).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Saint Morning" })).toBeInTheDocument();
    expect(screen.getByTestId("game_header_strong_stat_sex_value")).toHaveTextContent("Female");
    expect(screen.getByTestId("game_header_div_exp_bar")).toHaveAttribute("title", "0 / 22,280,630");
    expect(screen.getByText("123,456")).toBeInTheDocument();
  });

  it("renders closed non-admin sidebar with light theme labels", () => {
    render(
      <MainApplicationSidebar
        activeNavItem="Character Page"
        characterName="Saint Morning"
        isAdmin={false}
        isMobileNavOpen={false}
        isProfileMenuOpen={false}
        onChangeCharacter={jest.fn()}
        onLogout={jest.fn()}
        onProfileMenuToggle={jest.fn()}
        onSelectNavItem={jest.fn()}
        onThemeToggle={jest.fn()}
        onToggleMobileNav={jest.fn()}
        theme="light"
      />
    );

    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark mode" })).toBeInTheDocument();
  });

  it("renders stat allocation and low-level atoms", () => {
    const onAddStat = jest.fn();
    const onRemoveStat = jest.fn();
    const onApplyStats = jest.fn();
    const onClearStat = jest.fn();
    const onMaxStat = jest.fn();
    const onResetStats = jest.fn();
    const onSetStat = jest.fn();

    render(
      <>
        <StatAllocationPanel
          appliedStats={{ str: 1, sta: 0, dex: 0, int: 0 }}
          availableStatPoints={2}
          character={character}
          onAddStat={onAddStat}
          onApplyStats={onApplyStats}
          onClearStat={onClearStat}
          onMaxStat={onMaxStat}
          onRemoveStat={onRemoveStat}
          onResetStats={onResetStats}
          onSetStat={onSetStat}
          pendingStats={{ str: 1, sta: 0, dex: 0, int: 0 }}
          statKeys={["str", "sta", "dex", "int"]}
        />
        <AllocationButton type="button">+</AllocationButton>
        <StatRow label="HP" value={100} />
        <ErrorMessage message={"Missing requirements:\nLevel: 75\nJob: Mercenary"} />
        <ErrorMessage message={"Something happened\nwithout a detail separator"} />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: "Add STR point" }));
    fireEvent.click(screen.getByRole("button", { name: "Assign all available points to STR" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove all pending STR points" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove pending STR point" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: "Pending STR points" }), {
      target: { value: "2" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(onAddStat).toHaveBeenCalledWith("str");
    expect(onMaxStat).toHaveBeenCalledWith("str");
    expect(onClearStat).toHaveBeenCalledWith("str");
    expect(onRemoveStat).toHaveBeenCalledWith("str");
    expect(onSetStat).toHaveBeenCalledWith("str", 2);
    expect(onApplyStats).toHaveBeenCalled();
    expect(onResetStats).toHaveBeenCalled();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Missing requirements");
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Mercenary");
    expect(screen.getByText(/without a detail separator/)).toBeInTheDocument();
  });

  it("renders equipment and skill panels with selectable actions", () => {
    const onSelectEquipmentSlot = jest.fn();
    const onUnequipEquipmentSlot = jest.fn();
    const onAddSkillLevel = jest.fn();
    const onRemoveSkillLevel = jest.fn();
    const onApplySkills = jest.fn();
    const onResetSkills = jest.fn();

    render(
      <>
        <CharacterEquipmentPanel
          actionError="Unable to unequip item"
          character={character}
          itemsById={{ "3497": woodenSword, "40": cloak }}
          onSelectEquipmentSlot={onSelectEquipmentSlot}
          onUnequipEquipmentSlot={onUnequipEquipmentSlot}
          selectedEquipmentSlot="cloak"
        />
        <CharacterSkillsPanel
          availableSkillPoints={3}
          character={character}
          onAddSkillLevel={onAddSkillLevel}
          onApplySkills={onApplySkills}
          onCanRemoveSkillLevel={() => true}
          onRemoveSkillLevel={onRemoveSkillLevel}
          onResetSkills={onResetSkills}
          pendingSkillLevels={{ empower: 1 }}
          skillTabs={skillTabs}
        />
      </>
    );

    expect(getEquippedItemIds(character)).toEqual(["3314", "40", "3497"]);
    fireEvent.click(screen.getByRole("button", { name: "Cloak: Dragon Cloak" }));
    fireEvent.click(screen.getByRole("button", { name: "Unequip" }));
    fireEvent.click(screen.getByRole("tab", { name: "Vagrant" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Clean Hit" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Clean Hit level" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove pending Clean Hit level" }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(onSelectEquipmentSlot).toHaveBeenCalledWith("cloak");
    expect(onUnequipEquipmentSlot).toHaveBeenCalledWith("cloak", 0);
    expect(onAddSkillLevel).toHaveBeenCalledWith(expect.objectContaining({ id: "clean" }));
    expect(onRemoveSkillLevel).toHaveBeenCalledWith(expect.objectContaining({ id: "clean" }));
    expect(onApplySkills).toHaveBeenCalled();
    expect(onResetSkills).toHaveBeenCalled();
  });

  it("selects duplicate equipped items by slot instead of item id", () => {
    const onSelectEquipmentSlot = jest.fn();
    const onUnequipEquipmentSlot = jest.fn();
    const dualWieldCharacter = {
      ...character,
      equipment: {
        ...character.equipment,
        mainhand: "3497",
        offhand: "3497"
      }
    };

    render(
      <CharacterEquipmentPanel
        character={dualWieldCharacter}
        itemsById={{ "3497": woodenSword }}
        onSelectEquipmentSlot={onSelectEquipmentSlot}
        onUnequipEquipmentSlot={onUnequipEquipmentSlot}
        selectedEquipmentSlot="offhand"
      />
    );

    expect(screen.getByRole("button", { name: "Main Hand: Wooden Sword" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: "Off Hand: Wooden Sword" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "Off Hand: Wooden Sword" }));
    fireEvent.click(screen.getByRole("button", { name: "Unequip" }));

    expect(onSelectEquipmentSlot).toHaveBeenCalledWith("offhand");
    expect(onUnequipEquipmentSlot).toHaveBeenCalledWith("offhand", 0);
  });

  it("composes the full character page content", () => {
    render(
      <CharacterPageContent
        activeEquipmentSet={0}
        appliedStats={{ str: 0, sta: 0, dex: 0, int: 0 }}
        availableSkillPoints={3}
        availableStatPoints={2}
        character={character}
        detailStats={[{ label: "ATK", value: 100 }]}
        itemsById={{ "3497": woodenSword, "40": cloak }}
        onAddSkillLevel={jest.fn()}
        onAddStat={jest.fn()}
        onApplySkills={jest.fn()}
        onApplyStats={jest.fn()}
        onCanRemoveSkillLevel={() => true}
        onClearStat={jest.fn()}
        onEquipmentSetChange={jest.fn()}
        onMaxStat={jest.fn()}
        onRemoveSkillLevel={jest.fn()}
        onRemoveStat={jest.fn()}
        onResetSkills={jest.fn()}
        onResetStats={jest.fn()}
        onSelectEquipmentSlot={jest.fn()}
        onSetStat={jest.fn()}
        onUnequipEquipmentSlot={jest.fn()}
        pendingSkillLevels={{}}
        pendingStats={{ str: 0, sta: 0, dex: 0, int: 0 }}
        selectedEquipmentSlot={null}
        skillTabs={skillTabs}
        statKeys={["str", "sta", "dex", "int"]}
      />
    );

    expect(screen.getByText("ATK")).toBeInTheDocument();
    expect(screen.getByText("Equipment")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
  });
});
