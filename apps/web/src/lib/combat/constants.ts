import { type JobCombatConstants } from "@/lib/combat/types";

function constants(
  input: Omit<JobCombatConstants, "weaponFactors"> & { weaponFactors?: Record<string, number> }
) {
  return {
    ...input,
    weaponFactors: {
      ...defaultWeaponFactors,
      ...input.weaponFactors
    }
  };
}

export const defaultWeaponFactors = {
  sword: 4.5,
  axe: 5.5,
  staff: 0.8,
  stick: 3.0,
  knuckle: 5.0,
  wand: 6.0,
  yoyo: 4.2,
  bow: 3.6
};

export const weaponSpeedModifiers: Record<string, number> = {
  veryslow: 0.025,
  slow: 0.045,
  normal: 0.06,
  fast: 0.075,
  veryfast: 0.085
};

export const jobConstants: Record<string, JobCombatConstants> = {
  Vagrant: constants({
    attackSpeed: 72,
    block: 0.2,
    critical: 1,
    def: 0.9,
    hps: 4,
    hp: 0.18,
    hpLevel: 18,
    fp: 2.1,
    fpLevel: 0.6,
    mp: 2.7,
    mpLevel: 0.6,
    mDefSta: 0.3,
    mDefInt: 1.2
  }),
  Assist: constants({
    attackSpeed: 72,
    block: 0.5,
    critical: 1,
    def: 1.2,
    hps: 4,
    hp: 0.28,
    hpLevel: 28,
    fp: 4.2,
    fpLevel: 1.2,
    mp: 11.7,
    mpLevel: 2.6,
    mDefSta: 1.3,
    mDefInt: 2.3
  }),
  Billposter: constants({
    attackSpeed: 82,
    block: 0.7,
    critical: 1,
    def: 1.4,
    hps: 2.5,
    hp: 0.36,
    hpLevel: 36,
    fp: 7.7,
    fpLevel: 2.2,
    mp: 8.1,
    mpLevel: 1.8,
    mDefSta: 2,
    mDefInt: 2.8
  }),
  Ringmaster: constants({
    attackSpeed: 72,
    block: 0.6,
    critical: 1,
    def: 1.2,
    hps: 3,
    hp: 0.32,
    hpLevel: 32,
    fp: 2.8,
    fpLevel: 0.8,
    mp: 16.2,
    mpLevel: 3.6,
    mDefSta: 2,
    mDefInt: 3
  }),
  Acrobat: constants({
    attackSpeed: 77,
    block: 0.6,
    critical: 1,
    def: 1.2,
    hps: 2,
    hp: 0.28,
    hpLevel: 28,
    fp: 3.5,
    fpLevel: 1,
    mp: 4.5,
    mpLevel: 1,
    mDefSta: 0.75,
    mDefInt: 1.5
  }),
  Jester: constants({
    attackSpeed: 82,
    block: 0.8,
    critical: 4,
    def: 1.4,
    hps: 2.6,
    hp: 0.3,
    hpLevel: 30,
    fp: 7,
    fpLevel: 2,
    mp: 4.5,
    mpLevel: 1,
    mDefSta: 1.3,
    mDefInt: 2.3,
    weaponFactors: { bow: 2, yoyo: 5 }
  }),
  Ranger: constants({
    attackSpeed: 77,
    block: 0.8,
    critical: 2,
    def: 1.4,
    hps: 1.5,
    hp: 0.32,
    hpLevel: 32,
    fp: 4.2,
    fpLevel: 1.2,
    mp: 10.8,
    mpLevel: 2.4,
    mDefSta: 2,
    mDefInt: 3,
    weaponFactors: { bow: 4, yoyo: 2 }
  }),
  Magician: constants({
    attackSpeed: 62,
    block: 0.5,
    critical: 1,
    def: 1.15,
    hps: 1,
    hp: 0.28,
    hpLevel: 28,
    fp: 2.1,
    fpLevel: 0.6,
    mp: 15.3,
    mpLevel: 3.4,
    mDefSta: 3,
    mDefInt: 4.2
  }),
  Psykeeper: constants({
    attackSpeed: 67,
    block: 0.3,
    critical: 1,
    def: 1.2,
    hps: 1,
    hp: 0.3,
    hpLevel: 30,
    fp: 2.8,
    fpLevel: 0.8,
    mp: 18,
    mpLevel: 4,
    mDefSta: 3,
    mDefInt: 4.2,
    weaponFactors: { wand: 5.5 }
  }),
  Elementor: constants({
    attackSpeed: 67,
    block: 0.3,
    critical: 1,
    def: 1.2,
    hps: 1,
    hp: 0.3,
    hpLevel: 30,
    fp: 2.8,
    fpLevel: 0.8,
    mp: 18,
    mpLevel: 4,
    mDefSta: 3,
    mDefInt: 4
  }),
  Mercenary: constants({
    attackSpeed: 77,
    block: 0.5,
    critical: 1,
    def: 1.25,
    hps: 4,
    hp: 0.3,
    hpLevel: 30,
    fp: 4.9,
    fpLevel: 1.4,
    mp: 4.5,
    mpLevel: 1,
    mDefSta: 0.75,
    mDefInt: 1.5
  }),
  Blade: constants({
    attackSpeed: 87,
    block: 1.5,
    critical: 1,
    def: 1.45,
    hps: 3,
    hp: 0.3,
    hpLevel: 30,
    fp: 8.400001,
    fpLevel: 2.4,
    mp: 5.4,
    mpLevel: 1.2,
    mDefSta: 1.3,
    mDefInt: 2.3
  }),
  Knight: constants({
    attackSpeed: 77,
    block: 1,
    critical: 1,
    def: 1.55,
    hps: 2,
    hp: 0.4,
    hpLevel: 40,
    fp: 10.5,
    fpLevel: 3,
    mp: 5.4,
    mpLevel: 1.2,
    mDefSta: 1.3,
    mDefInt: 2.3
  })
};
