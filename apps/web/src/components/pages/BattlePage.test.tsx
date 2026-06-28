import { fireEvent, render, screen } from "@testing-library/react";
import { BattlePage } from "./BattlePage";
import type { Character, ItemMetadata } from "@/lib/api";
import type { SkillDefinition, SkillTreeTab } from "@/lib/skillTrees";

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
  skillLevels: { clean: 1, empower: 1, splmash: 1 },
  equipment: {
    helmet: null,
    suit: null,
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
    mainhand: null,
    ringR: null,
    earringR: null,
    necklace: null,
    earringL: null,
    ringL: null
  },
  inventory: { size: 50, items: [] }
};

function skill(overrides: Partial<SkillDefinition>): SkillDefinition {
  return {
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
    y: 35,
    ...overrides
  };
}

const cleanHit = skill({});
const empowered = skill({
  classId: 2,
  className: "Mercenary",
  description: "Empower your weapon.",
  icon: "empower.png",
  id: "empower",
  name: "Empower Weapon",
  requiredLevel: 15,
  tier: "first",
  x: 50,
  y: 50
});
const splmash = skill({
  classId: 2,
  className: "Mercenary",
  icon: "splmash.png",
  id: "splmash",
  name: "Splmash",
  requiredLevel: 15,
  tier: "first",
  x: 70,
  y: 50
});
const stepSkill = skill({
  combo: "step",
  icon: "step.png",
  id: "step",
  name: "Step Strike",
  x: 20,
  y: 65
});
const circularSkill = skill({
  combo: "circular",
  icon: "circular.png",
  id: "circular",
  name: "Circle Slash",
  x: 40,
  y: 65
});
const finishSkill = skill({
  combo: "finish",
  icon: "finish.png",
  id: "finish",
  name: "Final Blow",
  x: 60,
  y: 65
});
const generalSkill = skill({
  combo: "general",
  icon: "general.png",
  id: "general",
  name: "Recovery",
  x: 80,
  y: 65
});

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
    skills: [empowered, splmash, stepSkill, circularSkill, finishSkill, generalSkill]
  }
];

const comboCharacter = {
  ...character,
  skillLevels: {
    ...character.skillLevels,
    step: 1,
    circular: 1,
    finish: 1,
    general: 1
  }
};

function createDataTransfer() {
  const data = new Map<string, string>();
  const dataTransfer = {
    dropEffect: "none",
    effectAllowed: "all",
    types: [] as string[],
    getData(type: string) {
      return data.get(type) ?? "";
    },
    setData(type: string, value: string) {
      data.set(type, value);

      if (!this.types.includes(type)) {
        this.types.push(type);
      }
    }
  };

  return dataTransfer;
}

function doubleClickAddSkill(name: string) {
  const button = screen.getByRole("button", { name });

  fireEvent.click(button, { detail: 1 });
  fireEvent.click(button, { detail: 2 });
}

function rapidClickAddSkill(name: string, doubleClicks: number) {
  const button = screen.getByRole("button", { name });

  for (let clickCount = 1; clickCount <= doubleClicks * 2; clickCount += 1) {
    fireEvent.click(button, { detail: clickCount });
  }
}

function doubleClickActionSlot(name: string) {
  const button = screen.getByRole("button", { name });

  fireEvent.click(button, { detail: 1 });
  fireEvent.click(button, { detail: 2 });
}

describe("BattlePage", () => {
  it("renders skill trees and double-click adds skills to the first available action slots", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    expect(screen.getByRole("tab", { name: "Mercenary" })).toBeInTheDocument();

    doubleClickAddSkill("Add Empower Weapon to action bar");
    doubleClickAddSkill("Add Splmash to action bar");
    fireEvent.click(screen.getByRole("tab", { name: "Vagrant" }));
    doubleClickAddSkill("Add Clean Hit to action bar");

    expect(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Splmash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Clean Hit" })).toBeInTheDocument();
  });

  it("adds skills for every rapid double click without waiting for dblclick cooldown", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    rapidClickAddSkill("Add Empower Weapon to action bar", 2);

    expect(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Empower Weapon" })).toBeInTheDocument();
  });

  it("clears a packed action bar by rapidly double-clicking the first filled slot", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    rapidClickAddSkill("Add Empower Weapon to action bar", 6);

    const firstFilledSlot = screen.getByRole("button", { name: "Action slot 4: Empower Weapon" });

    for (let clickCount = 1; clickCount <= 12; clickCount += 1) {
      fireEvent.click(firstFilledSlot, { detail: clickCount });
    }

    expect(screen.getByRole("button", { name: "Action slot 4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 5" })).toBeInTheDocument();
  });

  it("inserts dropped skills into filled action slots and pushes later skills forward", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Empower Weapon to action bar");
    doubleClickAddSkill("Add Splmash to action bar");
    fireEvent.click(screen.getByRole("tab", { name: "Vagrant" }));

    const insertDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Add Clean Hit to action bar" }), {
      dataTransfer: insertDrag
    });
    fireEvent.drop(screen.getByRole("button", { name: "Action slot 3: Splmash" }), {
      dataTransfer: insertDrag
    });

    expect(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Clean Hit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Splmash" })).toBeInTheDocument();

    const reorderDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Action slot 2: Splmash" }), {
      dataTransfer: reorderDrag
    });
    fireEvent.drop(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" }), {
      dataTransfer: reorderDrag
    });

    expect(screen.getByRole("button", { name: "Action slot 4: Splmash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Empower Weapon" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Clean Hit" })).toBeInTheDocument();
  });

  it("adds combo skills only in a valid action sequence", () => {
    render(
      <BattlePage
        character={comboCharacter}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Circle Slash to action bar");
    expect(screen.getByRole("button", { name: "Action slot 4" })).toBeInTheDocument();

    doubleClickAddSkill("Add Step Strike to action bar");
    doubleClickAddSkill("Add Recovery to action bar");
    expect(screen.queryByRole("button", { name: "Action slot 3: Recovery" })).not.toBeInTheDocument();

    doubleClickAddSkill("Add Circle Slash to action bar");
    doubleClickAddSkill("Add Final Blow to action bar");
    doubleClickAddSkill("Add Recovery to action bar");

    expect(screen.getByRole("button", { name: "Action slot 4: Step Strike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Circle Slash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Final Blow" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 1: Recovery" })).toBeInTheDocument();
  });

  it("removes and reorders action slots with double click and drag rules", () => {
    render(
      <BattlePage
        character={comboCharacter}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Step Strike to action bar");
    doubleClickAddSkill("Add Circle Slash to action bar");
    doubleClickAddSkill("Add Final Blow to action bar");
    doubleClickAddSkill("Add Recovery to action bar");

    expect(
      screen.queryByRole("button", { name: "Remove selected action slot skill" })
    ).not.toBeInTheDocument();

    const invalidDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Action slot 4: Step Strike" }), {
      dataTransfer: invalidDrag
    });
    fireEvent.drop(screen.getByRole("button", { name: "Action slot 3: Circle Slash" }), {
      dataTransfer: invalidDrag
    });

    expect(screen.getByRole("button", { name: "Action slot 4: Step Strike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Circle Slash" })).toBeInTheDocument();

    doubleClickActionSlot("Action slot 1: Recovery");
    expect(screen.getByRole("button", { name: "Action slot 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Vagrant" }));
    doubleClickAddSkill("Add Clean Hit to action bar");
    expect(screen.getByRole("button", { name: "Action slot 1: Clean Hit" })).toBeInTheDocument();

    const emptySlotDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Action slot 1: Clean Hit" }), {
      dataTransfer: emptySlotDrag
    });
    fireEvent.drop(screen.getByRole("button", { name: "Action slot 6" }), {
      dataTransfer: emptySlotDrag
    });

    expect(screen.getByRole("button", { name: "Action slot 1: Clean Hit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 6" })).toBeInTheDocument();

    const removeDrag = createDataTransfer();
    fireEvent.dragStart(screen.getByRole("button", { name: "Action slot 1: Clean Hit" }), {
      dataTransfer: removeDrag
    });
    fireEvent.drop(screen.getByRole("group", { name: "Action wheel" }), { dataTransfer: removeDrag });

    expect(screen.getByRole("button", { name: "Action slot 1" })).toBeInTheDocument();
  });

  it("does not remove combo skills when the remaining sequence would be invalid", () => {
    render(
      <BattlePage
        character={comboCharacter}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Step Strike to action bar");
    doubleClickAddSkill("Add Circle Slash to action bar");
    doubleClickAddSkill("Add Final Blow to action bar");

    doubleClickActionSlot("Action slot 4: Step Strike");
    expect(screen.getByRole("button", { name: "Action slot 4: Step Strike" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 3: Circle Slash" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action slot 2: Final Blow" })).toBeInTheDocument();

    doubleClickActionSlot("Action slot 2: Final Blow");
    expect(screen.getByRole("button", { name: "Action slot 2" })).toBeInTheDocument();

    doubleClickActionSlot("Action slot 3: Circle Slash");
    expect(screen.getByRole("button", { name: "Action slot 3" })).toBeInTheDocument();

    doubleClickActionSlot("Action slot 4: Step Strike");
    expect(screen.getByRole("button", { name: "Action slot 4" })).toBeInTheDocument();
  });

  it("removes a slotted skill when it is dragged out without a valid drop target", () => {
    render(
      <BattlePage
        character={character}
        itemsById={{} as Record<string, ItemMetadata>}
        selectedMonsterFamily={null}
        skillTabs={skillTabs}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skills" }));
    doubleClickAddSkill("Add Empower Weapon to action bar");
    expect(screen.getByRole("button", { name: "Action slot 4: Empower Weapon" })).toBeInTheDocument();

    const removeDrag = createDataTransfer();
    const slottedSkill = screen.getByRole("button", { name: "Action slot 4: Empower Weapon" });

    fireEvent.dragStart(slottedSkill, { dataTransfer: removeDrag });
    fireEvent.dragEnd(slottedSkill, { dataTransfer: removeDrag });

    expect(screen.getByRole("button", { name: "Action slot 4" })).toBeInTheDocument();
  });
});
