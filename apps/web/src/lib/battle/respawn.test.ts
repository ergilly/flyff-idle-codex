import { getRespawnDestination, getRespawnHp } from "./respawn";

it.each([
  ["flaris", "flarine-town"],
  ["saint", "sain-city"],
  ["rhisis", "sain-city"],
  ["darkon12", "darken-city"],
  ["darkon3", "darken-city"],
  ["shaduwar", "darken-city"],
  ["valley", "darken-city"],
  ["kaillun", "eillun"],
  ["bahara", "eillun"]
] as const)("maps %s deaths to %s", (regionId, townMapId) => {
  expect(getRespawnDestination(regionId)?.townMapId).toBe(townMapId);
});

it("rejects an unknown combat area", () => {
  expect(getRespawnDestination("unknown")).toBeNull();
});

it("restores half of maximum HP, rounded up", () => {
  expect(getRespawnHp(101)).toBe(51);
  expect(getRespawnHp(100)).toBe(50);
});
