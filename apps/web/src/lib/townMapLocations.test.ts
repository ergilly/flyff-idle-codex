import { townMapLocations, type TownMapId } from "@/lib/townMapLocations";

describe("town map locations", () => {
  it.each([
    ["flarine-town", 29, "Mikyel"],
    ["sain-city", 4000, "Lancomi"],
    ["darken-city", 4677, "Lurif"],
    ["eillun", 20250, "Miorang"]
  ] as const)("maps the %s quest office to its NPC", (townMapId, npcId, name) => {
    expect(
      townMapLocations[townMapId as TownMapId].find((location) => location.id === "quest-office")
    ).toEqual(
      expect.objectContaining({
        iconSrc: "/images/maps/town-icons/quest-office.png",
        kind: "npc",
        label: name,
        npcId
      })
    );
  });
});
