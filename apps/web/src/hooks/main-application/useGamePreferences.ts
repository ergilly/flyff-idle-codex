import { useEffect, useState } from "react";
import type { CombatLogDetail } from "@/lib/battle/types";

export const autosaveIntervals = [30, 60, 120, 300, 600, 1800] as const;
export type GamePreferences = {
  autosaveIntervalSeconds: number;
  compactInventoryGrid: boolean;
  combatLogDetail: CombatLogDetail;
  reducedMotion: boolean;
};

export const defaultGamePreferences: GamePreferences = {
  autosaveIntervalSeconds: 60,
  compactInventoryGrid: false,
  combatLogDetail: "expanded",
  reducedMotion: false
};

const storageKey = "flyffIdlePreferences";
const legacyAutosaveStorageKey = "flyffIdleAutosaveSeconds";

function readStoredPreferences(): GamePreferences {
  if (typeof window === "undefined") {
    return defaultGamePreferences;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as Partial<GamePreferences> | null;
    const legacyAutosave = Number(localStorage.getItem(legacyAutosaveStorageKey));

    return {
      autosaveIntervalSeconds: isAutosaveInterval(stored?.autosaveIntervalSeconds)
        ? stored.autosaveIntervalSeconds
        : isAutosaveInterval(legacyAutosave)
          ? legacyAutosave
          : defaultGamePreferences.autosaveIntervalSeconds,
      compactInventoryGrid: stored?.compactInventoryGrid === true,
      combatLogDetail:
        stored?.combatLogDetail === "concise" ? "concise" : defaultGamePreferences.combatLogDetail,
      reducedMotion: stored?.reducedMotion === true
    };
  } catch {
    return defaultGamePreferences;
  }
}

function isAutosaveInterval(value: unknown): value is (typeof autosaveIntervals)[number] {
  return typeof value === "number" && autosaveIntervals.includes(value as (typeof autosaveIntervals)[number]);
}

function applyReducedMotion(reducedMotion: boolean) {
  document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
}

export function useGamePreferences() {
  const [preferences, setPreferences] = useState<GamePreferences>(defaultGamePreferences);

  useEffect(() => {
    setPreferences(readStoredPreferences());
  }, []);

  useEffect(() => {
    applyReducedMotion(preferences.reducedMotion);
    localStorage.setItem(storageKey, JSON.stringify(preferences));
    localStorage.setItem(legacyAutosaveStorageKey, String(preferences.autosaveIntervalSeconds));
  }, [preferences]);

  function updatePreferences(updates: Partial<GamePreferences>) {
    setPreferences((current) => ({ ...current, ...updates }));
  }

  return { preferences, updatePreferences };
}
