import { buildCharacter, buildItem } from "@/test/fixtures";
import { canPerformAutoAttack, getEquippedArrowQuantity, isBowEquipped } from "./bowAmmo";

const bow = buildItem({ id: "bow", category: "weapon", subcategory: "bow" });
const arrows = buildItem({ id: "arrows", category: "arrow" });

it("requires equipped arrows with a positive quantity for bow attacks", () => {
  const character = buildCharacter({
    ammoQuantity: 2,
    ammoQuantities: [2, 0, 0],
    equipment: { ...buildCharacter().equipment, ammo: "arrows", mainhand: "bow" }
  });
  const items = { bow, arrows };

  expect(isBowEquipped(character, items, 0)).toBe(true);
  expect(getEquippedArrowQuantity(character, 0)).toBe(2);
  expect(canPerformAutoAttack(character, items, 0)).toBe(true);
  expect(canPerformAutoAttack({ ...character, ammoQuantity: 0, ammoQuantities: [0, 0, 0] }, items, 0)).toBe(
    false
  );
});

it("allows non-bow attacks without ammunition", () => {
  expect(canPerformAutoAttack(buildCharacter(), {}, 0)).toBe(true);
});
