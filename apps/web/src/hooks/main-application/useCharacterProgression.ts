import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { type StatKey } from "@/components/molecules/main-application/StatAllocationPanel";
import { updateCharacterProgression, type Character, type CharacterSkillLevels } from "@/lib/api";
import { getAvailableStatPoints, getTotalSkillPoints } from "@/lib/characterProgression";
import {
  areSkillRequirementsMet,
  canRemovePendingSkillLevel,
  fetchUnlockedSkillTabs,
  getSpentSkillPointsForSkills,
  getUnlockedSkills,
  type SkillDefinition,
  type SkillTreeTab
} from "@/lib/skillTrees";

const statKeys: StatKey[] = ["str", "sta", "dex", "int"];
const emptyStats: Record<StatKey, number> = { str: 0, sta: 0, dex: 0, int: 0 };

type UseCharacterProgressionOptions = {
  selectedCharacter: Character | null;
  setCharacters: Dispatch<SetStateAction<Character[]>>;
  setError: Dispatch<SetStateAction<string>>;
};

export function useCharacterProgression({
  selectedCharacter,
  setCharacters,
  setError
}: UseCharacterProgressionOptions) {
  const [appliedStats, setAppliedStats] = useState<Record<StatKey, number>>(emptyStats);
  const [pendingStats, setPendingStats] = useState<Record<StatKey, number>>(emptyStats);
  const [availableStatPoints, setAvailableStatPoints] = useState(0);
  const [pendingSkillLevels, setPendingSkillLevels] = useState<CharacterSkillLevels>({});
  const [availableSkillPoints, setAvailableSkillPoints] = useState(0);
  const [skillTabs, setSkillTabs] = useState<SkillTreeTab[]>([]);

  function resetProgressionForms() {
    setAppliedStats(emptyStats);
    setPendingStats(emptyStats);
    setPendingSkillLevels({});
  }

  useEffect(() => {
    if (!selectedCharacter) {
      return;
    }

    setAppliedStats({ str: 0, sta: 0, dex: 0, int: 0 });
    setPendingStats({ str: 0, sta: 0, dex: 0, int: 0 });
    setAvailableStatPoints(getAvailableStatPoints(selectedCharacter));
    setPendingSkillLevels({});
    setAvailableSkillPoints(0);
    setSkillTabs([]);

    let ignoreResult = false;
    const refreshSkillTabs = () => {
      fetchUnlockedSkillTabs(selectedCharacter)
        .then((loadedSkillTabs) => {
          if (!ignoreResult) {
            setSkillTabs(loadedSkillTabs);
          }
        })
        .catch(() => {
          if (!ignoreResult) {
            setSkillTabs([]);
            setError("Unable to load skill data.");
          }
        });
    };

    refreshSkillTabs();

    const refreshInterval =
      process.env.NODE_ENV === "development" ? window.setInterval(refreshSkillTabs, 2500) : undefined;

    return () => {
      ignoreResult = true;
      if (refreshInterval) {
        window.clearInterval(refreshInterval);
      }
    };
  }, [selectedCharacter]);

  useEffect(() => {
    if (!selectedCharacter) {
      return;
    }

    const unlockedSkills = getUnlockedSkills(skillTabs);

    setAvailableSkillPoints(
      Math.max(
        0,
        getTotalSkillPoints(selectedCharacter) -
          getSpentSkillPointsForSkills(unlockedSkills, selectedCharacter.skillLevels) -
          getSpentSkillPointsForSkills(unlockedSkills, pendingSkillLevels)
      )
    );
  }, [pendingSkillLevels, selectedCharacter, skillTabs]);

  function handleAddStat(stat: StatKey) {
    if (availableStatPoints <= 0) {
      return;
    }

    setPendingStats((currentStats) => ({ ...currentStats, [stat]: currentStats[stat] + 1 }));
    setAvailableStatPoints((currentPoints) => currentPoints - 1);
  }

  function handleRemoveStat(stat: StatKey) {
    if (pendingStats[stat] <= 0) {
      return;
    }

    setPendingStats((currentStats) => ({ ...currentStats, [stat]: currentStats[stat] - 1 }));
    setAvailableStatPoints((currentPoints) => currentPoints + 1);
  }

  function handleClearStat(stat: StatKey) {
    if (pendingStats[stat] <= 0) {
      return;
    }

    setPendingStats((currentStats) => ({ ...currentStats, [stat]: 0 }));
    setAvailableStatPoints((currentPoints) => currentPoints + pendingStats[stat]);
  }

  function handleMaxStat(stat: StatKey) {
    if (availableStatPoints <= 0) {
      return;
    }

    setPendingStats((currentStats) => ({
      ...currentStats,
      [stat]: currentStats[stat] + availableStatPoints
    }));
    setAvailableStatPoints(0);
  }

  function handleSetStat(stat: StatKey, value: number) {
    const nextValue = Number.isFinite(value) ? Math.floor(value) : 0;
    const boundedValue = Math.max(0, Math.min(nextValue, pendingStats[stat] + availableStatPoints));

    setPendingStats((currentStats) => ({ ...currentStats, [stat]: boundedValue }));
    setAvailableStatPoints((currentPoints) => currentPoints + pendingStats[stat] - boundedValue);
  }

  async function handleApplyStats() {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      return;
    }

    const nextStats = statKeys.reduce(
      (stats, stat) => ({ ...stats, [stat]: selectedCharacter.stats[stat] + pendingStats[stat] }),
      selectedCharacter.stats
    );

    try {
      const updatedCharacter = await updateCharacterProgression(token, selectedCharacter.id, {
        stats: nextStats
      });
      setCharacters((currentCharacters) =>
        currentCharacters.map((character) =>
          character.id === updatedCharacter.id ? updatedCharacter : character
        )
      );
      setAppliedStats({ str: 0, sta: 0, dex: 0, int: 0 });
      setPendingStats({ str: 0, sta: 0, dex: 0, int: 0 });
    } catch {
      setError("Unable to save stat points.");
    }
  }

  function handleResetStats() {
    const pointsToReturn = statKeys.reduce((totalPoints, stat) => totalPoints + pendingStats[stat], 0);

    setAvailableStatPoints((currentPoints) => currentPoints + pointsToReturn);
    setPendingStats({ str: 0, sta: 0, dex: 0, int: 0 });
  }

  function handleAddSkillLevel(skill: SkillDefinition) {
    const currentLevel =
      (selectedCharacter?.skillLevels[skill.id] ?? 0) + (pendingSkillLevels[skill.id] ?? 0);
    const displayedSkillLevels = { ...(selectedCharacter?.skillLevels ?? {}) };

    Object.entries(pendingSkillLevels).forEach(([skillId, level]) => {
      displayedSkillLevels[skillId] = (displayedSkillLevels[skillId] ?? 0) + level;
    });

    if (
      !selectedCharacter ||
      !areSkillRequirementsMet(selectedCharacter, displayedSkillLevels, skill) ||
      availableSkillPoints < skill.costPerLevel ||
      currentLevel >= skill.maxLevel
    ) {
      return;
    }

    setPendingSkillLevels((currentLevels) => ({
      ...currentLevels,
      [skill.id]: (currentLevels[skill.id] ?? 0) + 1
    }));
  }

  function handleRemoveSkillLevel(skill: SkillDefinition) {
    if (
      !selectedCharacter ||
      !canRemovePendingSkillLevel(selectedCharacter, pendingSkillLevels, skillTabs, skill)
    ) {
      return;
    }

    setPendingSkillLevels((currentLevels) => {
      const nextLevel = (currentLevels[skill.id] ?? 0) - 1;
      const { [skill.id]: _removedSkill, ...otherLevels } = currentLevels;

      return nextLevel > 0 ? { ...otherLevels, [skill.id]: nextLevel } : otherLevels;
    });
  }

  function handleCanRemoveSkillLevel(skill: SkillDefinition) {
    return selectedCharacter
      ? canRemovePendingSkillLevel(selectedCharacter, pendingSkillLevels, skillTabs, skill)
      : false;
  }

  async function handleApplySkills() {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      return;
    }

    const nextSkillLevels = Object.entries(pendingSkillLevels).reduce(
      (skillLevels, [skillId, pendingLevel]) => ({
        ...skillLevels,
        [skillId]: (skillLevels[skillId] ?? 0) + pendingLevel
      }),
      selectedCharacter.skillLevels
    );

    try {
      const updatedCharacter = await updateCharacterProgression(token, selectedCharacter.id, {
        skillLevels: nextSkillLevels
      });
      setCharacters((currentCharacters) =>
        currentCharacters.map((character) =>
          character.id === updatedCharacter.id ? updatedCharacter : character
        )
      );
      setPendingSkillLevels({});
    } catch {
      setError("Unable to save skill points.");
    }
  }

  function handleResetSkills() {
    setPendingSkillLevels({});
  }

  return {
    appliedStats,
    availableSkillPoints,
    availableStatPoints,
    handleAddSkillLevel,
    handleAddStat,
    handleApplySkills,
    handleApplyStats,
    handleCanRemoveSkillLevel,
    handleClearStat,
    handleMaxStat,
    handleRemoveSkillLevel,
    handleRemoveStat,
    handleResetSkills,
    handleResetStats,
    handleSetStat,
    pendingSkillLevels,
    pendingStats,
    resetProgressionForms,
    skillTabs,
    statKeys
  };
}
