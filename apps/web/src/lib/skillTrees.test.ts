import {
  areSkillRequirementsMet,
  canRemovePendingSkillLevel,
  fetchUnlockedSkillTabs,
  getSpentSkillPointsForSkills,
  getUnlockedSkills,
  type SkillDefinition,
  type SkillTreeTab
} from "./skillTrees";
import { fetchDataSet, type Character } from "./api";

jest.mock("./api", () => ({
  fetchDataSet: jest.fn()
}));

const character: Character = {
  id: "char-1",
  slotIndex: 0,
  name: "Skill Tester",
  gender: "male",
  job: "Blade",
  progressionRank: "normal",
  level: 65,
  exp: 0,
  penya: 0,
  stats: { str: 15, sta: 15, dex: 15, int: 15 },
  skillLevels: { "100": 4 },
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
    description: "",
    icon: "skill.png",
    id: "skill",
    maxLevel: 10,
    name: "Skill",
    requiredLevel: 1,
    requirements: [],
    tier: "vagrant",
    x: 0,
    y: 0,
    ...overrides
  };
}

describe("skillTrees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads unlocked lineage tabs and maps display skills with requirements", async () => {
    const jobs = [
      { id: 1, name: "Vagrant" },
      { id: 2, name: "Mercenary", parent: 1 },
      { id: 3, name: "Blade", parent: 2 },
      { id: 4, name: "Slayer", parent: 3 }
    ];
    const skillsByClass: Record<number, unknown[]> = {
      1: [
        {
          id: 100,
          name: "Clean Hit",
          icon: "clean.png",
          level: 1,
          levels: [{}, {}, {}],
          skillPoints: 1,
          treePosition: { x: 0, y: 0 }
        },
        {
          id: 101,
          name: "Clean Hit (Alt)",
          icon: "clean-alt.png",
          level: 2,
          treePosition: { x: 0, y: 0 }
        }
      ],
      2: [
        {
          id: 200,
          name: "Empower Weapon",
          combo: "circle",
          description: "Buffs attacks",
          icon: "empower.png",
          level: 20,
          requirements: [{ skill: 100, level: 3 }],
          skillPoints: 2,
          levels: [{}, {}],
          treePosition: { x: 10, y: 20 }
        },
        {
          id: 201,
          name: "Heart of Fury",
          icon: "hidden.png",
          level: 20,
          treePosition: { x: 30, y: 20 }
        }
      ],
      3: [
        {
          id: 300,
          name: "Blade Dance",
          icon: "blade.png",
          level: 60,
          levels: [{}],
          treePosition: { x: 10, y: 20 }
        }
      ]
    };

    (fetchDataSet as jest.Mock).mockImplementation((dataSet: string, query: { classId?: number }) => {
      if (dataSet === "jobs") {
        return Promise.resolve(jobs);
      }

      return Promise.resolve(skillsByClass[query.classId ?? 0] ?? []);
    });

    await expect(fetchUnlockedSkillTabs(character)).resolves.toMatchObject([
      {
        label: "Vagrant",
        tier: "vagrant",
        skills: [
          expect.objectContaining({
            id: "100",
            maxLevel: 3,
            name: "Clean Hit",
            tier: "vagrant"
          })
        ]
      },
      {
        label: "Mercenary",
        tier: "first",
        skills: [
          expect.objectContaining({
            costPerLevel: 2,
            combo: "circular",
            description: "Buffs attacks",
            name: "Empower Weapon",
            requirements: [{ skill: "100", skillName: "Clean Hit", level: 3 }]
          })
        ]
      },
      {
        label: "Blade",
        tier: "second",
        skills: [expect.objectContaining({ id: "300", name: "Blade Dance" })]
      }
    ]);
  });

  it("hides locked tiers for lower level characters", async () => {
    (fetchDataSet as jest.Mock).mockImplementation((dataSet: string, query: { classId?: number }) => {
      if (dataSet === "jobs") {
        return Promise.resolve([
          { id: 1, name: "Vagrant" },
          { id: 2, name: "Mercenary", parent: 1 },
          { id: 3, name: "Blade", parent: 2 }
        ]);
      }

      return Promise.resolve([
        {
          id: query.classId === 1 ? 100 : 200,
          name: query.classId === 1 ? "Clean Hit" : "Empower Weapon",
          icon: "skill.png",
          level: 1,
          treePosition: { x: 0, y: 0 }
        }
      ]);
    });

    await expect(fetchUnlockedSkillTabs({ ...character, level: 10, job: "Blade" })).resolves.toEqual([
      expect.objectContaining({ label: "Vagrant", tier: "vagrant" })
    ]);
  });

  it("orders dependency-based Ringmaster rows and unlocks hero third-job tabs", async () => {
    (fetchDataSet as jest.Mock).mockImplementation((dataSet: string, query: { classId?: number }) => {
      if (dataSet === "jobs") {
        return Promise.resolve([
          { id: 1, name: "Vagrant" },
          { id: 2, name: "Assist", parent: 1 },
          { id: 3, name: "Ringmaster", parent: 2 },
          { id: 4, name: "Seraph", parent: 3 }
        ]);
      }

      const skillsByClass: Record<number, unknown[]> = {
        1: [
          {
            id: 100,
            name: "Clean Hit",
            icon: "clean.png",
            level: 1,
            treePosition: { x: 0, y: 0 }
          }
        ],
        2: [
          {
            id: 200,
            name: "Heap Up",
            icon: "heap.png",
            level: 15,
            treePosition: { x: 30, y: 10 }
          }
        ],
        3: [
          {
            id: 299,
            name: "Hidden No Position",
            icon: "hidden.png",
            level: 60
          },
          {
            id: 300,
            name: "Geburah Tiphreth",
            icon: "geburah.png",
            level: 60,
            requirements: [{ skill: 301, level: 1 }],
            treePosition: { x: 50, y: 20 }
          },
          {
            id: 301,
            name: "Protect",
            icon: "protect.png",
            level: 60,
            treePosition: { x: 10, y: 20 }
          },
          {
            id: 302,
            name: "Single Row Skill",
            icon: "single.png",
            level: 60,
            treePosition: { x: 70, y: 50 }
          }
        ]
      };

      return Promise.resolve(skillsByClass[query.classId ?? 0] ?? []);
    });

    const tabs = await fetchUnlockedSkillTabs({
      ...character,
      job: "Seraph",
      progressionRank: "hero",
      level: 130
    });

    expect(tabs.map((tab) => tab.label)).toEqual(["Vagrant", "Assist", "Ringmaster", "Seraph"]);
    expect(tabs.find((tab) => tab.label === "Seraph")?.skills).toEqual([]);
    expect(
      tabs.find((tab) => tab.label === "Ringmaster")?.skills.map((mappedSkill) => mappedSkill.name)
    ).toEqual(["Protect", "Geburah Tiphreth", "Single Row Skill"]);
  });

  it("ignores duplicate display slots when no primary skill exists", async () => {
    (fetchDataSet as jest.Mock).mockImplementation((dataSet: string) => {
      if (dataSet === "jobs") {
        return Promise.resolve([{ id: 1, name: "Vagrant" }]);
      }

      return Promise.resolve([
        {
          id: 100,
          name: "Clean Hit (A)",
          icon: "clean-a.png",
          level: 1,
          treePosition: { x: 0, y: 0 }
        },
        {
          id: 101,
          name: "Clean Hit (B)",
          icon: "clean-b.png",
          level: 2,
          treePosition: { x: 0, y: 0 }
        }
      ]);
    });

    await expect(fetchUnlockedSkillTabs({ ...character, job: "Vagrant" })).resolves.toEqual([
      expect.objectContaining({ label: "Vagrant", skills: [] })
    ]);
  });

  it("checks requirements, removal safety, and spent points", () => {
    const rootSkill = skill({ id: "100", name: "Clean Hit", maxLevel: 3 });
    const dependentSkill = skill({
      id: "200",
      name: "Dependent",
      costPerLevel: 2,
      requiredLevel: 15,
      requirements: [{ skill: "100", skillName: "Clean Hit", level: 3 }]
    });
    const tabs: SkillTreeTab[] = [
      {
        tier: "vagrant",
        label: "Vagrant",
        imageSrc: "/skill.png",
        imageWidth: 225,
        imageHeight: 135,
        skills: [rootSkill, dependentSkill]
      }
    ];

    expect(areSkillRequirementsMet(character, { "100": 3 }, dependentSkill)).toBe(true);
    expect(areSkillRequirementsMet({ ...character, level: 10 }, { "100": 3 }, dependentSkill)).toBe(false);
    expect(areSkillRequirementsMet(character, { "100": 2 }, dependentSkill)).toBe(false);

    expect(getUnlockedSkills(tabs)).toEqual([rootSkill, dependentSkill]);
    expect(
      getSpentSkillPointsForSkills([rootSkill, dependentSkill], {
        "100": 9,
        "200": 2,
        missing: 10
      })
    ).toBe(7);

    expect(canRemovePendingSkillLevel(character, { "100": 1, "200": 1 }, tabs, dependentSkill)).toBe(true);
    expect(
      canRemovePendingSkillLevel(
        { ...character, skillLevels: { "100": 2, "200": 1 } },
        { "100": 1 },
        tabs,
        rootSkill
      )
    ).toBe(false);
    expect(canRemovePendingSkillLevel(character, {}, tabs, rootSkill)).toBe(false);
  });
});
