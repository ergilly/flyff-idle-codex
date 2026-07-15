import {
  getAutoAttackDamage,
  getCombatStats,
  rollMonsterAutoAttack,
  rollPlayerAutoAttack
} from "@/lib/combatStats";
import { buildCharacter, buildItem, buildMonster } from "@/test/fixtures";

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++] ?? 0.99;
}

describe("deterministic combat scenarios", () => {
  it("returns no damage and no critical when a player misses", () => {
    const character = buildCharacter();
    const result = rollPlayerAutoAttack(character, {}, buildMonster(), 0, () => 0.99);

    expect(result).toMatchObject({ damage: 0, isCritical: false, isHit: false });
  });

  it("makes guaranteed critical hits stronger than equivalent normal hits", () => {
    const mainhand = buildItem({ id: "weapon", minAttack: 40, maxAttack: 40 });
    const normalCharacter = buildCharacter({
      equipment: { ...buildCharacter().equipment, mainhand: mainhand.id }
    });
    const criticalItem = buildItem({
      ...mainhand,
      abilities: [{ parameter: "criticalchance", add: 100, rate: true }]
    });
    const normal = rollPlayerAutoAttack(
      normalCharacter,
      { weapon: mainhand },
      buildMonster({ defense: 0 }),
      0,
      sequence([0, 0.99])
    );
    const critical = rollPlayerAutoAttack(
      normalCharacter,
      { weapon: criticalItem },
      buildMonster({ defense: 0 }),
      0,
      sequence([0, 0, 0.5])
    );

    expect(normal).toMatchObject({ isHit: true, isCritical: false });
    expect(critical).toMatchObject({ isHit: true, isCritical: true });
    expect(critical.damage).toBeGreaterThan(normal.damage);
  });

  it("does not estimate a kill time for an invulnerable or already-dead target", () => {
    const projection = getAutoAttackDamage(
      buildCharacter(),
      {},
      buildMonster({ hp: 0, defense: Number.MAX_SAFE_INTEGER })
    );

    expect(projection.secondsToKill).toBeNull();
  });

  it("supports monster misses and reduces blocked incoming damage", () => {
    const character = buildCharacter({ level: 20, stats: { str: 15, sta: 15, dex: 200, int: 15 } });
    const monster = buildMonster({ minAttack: 500, maxAttack: 500, dex: 15, hitRate: 20 });
    const stats = getCombatStats(character, {});
    const miss = rollMonsterAutoAttack(monster, character, stats, () => 0.99);
    const unblocked = rollMonsterAutoAttack(monster, character, stats, sequence([0, 0.5, 0.99, 0]));
    const blocked = rollMonsterAutoAttack(monster, character, stats, sequence([0, 0.5, 0.99, 0.99]));

    expect(miss).toMatchObject({ damage: 0, isHit: false });
    expect(blocked.damage).toBeLessThan(unblocked.damage);
  });

  it("penalizes attacks against monsters far above the character level", () => {
    const character = buildCharacter({ level: 20 });
    const weapon = buildItem({ id: "weapon", minAttack: 80, maxAttack: 80 });
    const equippedCharacter = {
      ...character,
      equipment: { ...character.equipment, mainhand: weapon.id }
    };
    const equalLevel = getAutoAttackDamage(
      equippedCharacter,
      { weapon },
      buildMonster({ level: 20, defense: 0 })
    );
    const highLevel = getAutoAttackDamage(
      equippedCharacter,
      { weapon },
      buildMonster({ level: 35, defense: 0 })
    );

    expect(highLevel.averageDamage).toBeLessThan(equalLevel.averageDamage);
  });
});
