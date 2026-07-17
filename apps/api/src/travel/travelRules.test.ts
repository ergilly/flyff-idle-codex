import { travelDestinationIds, travelDestinations } from "./travelRules.js";

describe("travel rules", () => {
  it("defines every destination id exactly once", () => {
    expect(Object.keys(travelDestinations)).toEqual(travelDestinationIds);
    expect(new Set(travelDestinationIds).size).toBe(travelDestinationIds.length);
  });

  it("restricts Blinkwings to supported destination groups", () => {
    expect(travelDestinations.flaris.blinkwing?.id).toBe("8815");
    expect(travelDestinations.darkon12.blinkwing?.id).toBe("4602");
    expect(travelDestinations.darkon3.blinkwing).toBeUndefined();
    expect(travelDestinations.bahara.blinkwing).toBeUndefined();
  });
});
