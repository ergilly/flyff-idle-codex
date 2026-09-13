import { buildCharacter } from "@/test/fixtures";
import { getCharacterMaxHp } from "./characterResources";

test("returns the equipped character max HP", () => {
  expect(getCharacterMaxHp(buildCharacter(), {}, 0)).toBeGreaterThan(0);
});
