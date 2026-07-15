declare module "*assets/flyff/jobs.js" {
  export const jobsjson: import("./types.js").JobDefinition[];
}

declare module "*assets/flyff/sets.js" {
  export const setsjson: import("./types.js").ArmorSet[];
}

declare module "*assets/flyff/items.js" {
  export const itemsjson: import("./types.js").Item[];
}

declare module "*assets/flyff/skills.js" {
  export const skillsjson: import("./types.js").Skill[];
}

declare module "*assets/flyff/monsters.js" {
  export const monstersjson: import("./types.js").Monster[];
}

declare module "*assets/flyff/upgradeBonus.js" {
  export const upgradesjson: import("./types.js").UpgradeBonus[];
}

interface ImportMeta {
  glob<T>(pattern: string, options: { eager: true }): Record<string, T>;
}

interface Math {
  lerp(start: number, end: number, amount: number): number;
}
