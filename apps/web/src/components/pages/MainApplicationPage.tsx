"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { ContentHeading } from "@/components/molecules/main-application/ContentHeading";
import {
  getEquippedItemIds,
  getEquipmentItems
} from "@/components/molecules/main-application/CharacterEquipmentPanel";
import { type StatKey } from "@/components/molecules/main-application/StatAllocationPanel";
import { CharacterPageContent } from "@/components/organisms/main-application/CharacterPageContent";
import { DashboardStatsGrid } from "@/components/organisms/main-application/DashboardStatsGrid";
import { MainApplicationHeader } from "@/components/organisms/main-application/MainApplicationHeader";
import {
  MainApplicationSidebar,
  navItems,
  type MainApplicationNavItem,
  type MainApplicationTheme
} from "@/components/organisms/main-application/MainApplicationSidebar";
import {
  MainApplicationCenteredState,
  MainApplicationContent,
  MainApplicationErrorPanel,
  MainApplicationTemplate
} from "@/components/templates/main-application/MainApplicationTemplate";
import { getAvailableStatPoints, getTotalSkillPoints } from "@/lib/characterProgression";
import {
  fetchCharacters,
  type Character,
  type CharacterSkillLevels,
  type ItemMetadata,
  updateCharacterProgression
} from "@/lib/api";
import {
  areSkillRequirementsMet,
  canRemovePendingSkillLevel,
  fetchUnlockedSkillTabs,
  getSpentSkillPointsForSkills,
  getUnlockedSkills,
  type SkillDefinition,
  type SkillTreeTab
} from "@/lib/skillTrees";

const storageKey = "flyffIdleTheme";
const statKeys: StatKey[] = ["str", "sta", "dex", "int"];

function applyTheme(theme: MainApplicationTheme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(storageKey, theme);
}

function getDetailStats(character: Character) {
  const { dex, sta, str } = character.stats;

  return [
    { label: "ATK", value: Math.round(str * 4 + dex * 1.5 + character.level * 2) },
    { label: "DEF", value: Math.round(sta * 3 + character.level * 1.8) },
    { label: "Crit%", value: `${Math.min(100, Math.round(dex / 2))}%` },
    { label: "Attk Speed", value: `${Math.min(100, Math.round(70 + dex / 3))}%` }
  ];
}

export function MainApplicationPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [activeNavItem, setActiveNavItem] = useState<MainApplicationNavItem>(navItems[0].label);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<MainApplicationTheme>("dark");
  const [appliedStats, setAppliedStats] = useState<Record<StatKey, number>>({
    str: 0,
    sta: 0,
    dex: 0,
    int: 0
  });
  const [pendingStats, setPendingStats] = useState<Record<StatKey, number>>({
    str: 0,
    sta: 0,
    dex: 0,
    int: 0
  });
  const [availableStatPoints, setAvailableStatPoints] = useState(0);
  const [pendingSkillLevels, setPendingSkillLevels] = useState<CharacterSkillLevels>({});
  const [availableSkillPoints, setAvailableSkillPoints] = useState(0);
  const [skillTabs, setSkillTabs] = useState<SkillTreeTab[]>([]);
  const [itemsById, setItemsById] = useState<Record<string, ItemMetadata>>({});
  const [selectedEquipmentItemId, setSelectedEquipmentItemId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("flyffIdleToken");
    const storedCharacterId = localStorage.getItem("flyffIdleSelectedCharacterId");
    const storedTheme = localStorage.getItem(storageKey) === "light" ? "light" : "dark";

    setTheme(storedTheme);
    applyTheme(storedTheme);
    setSelectedCharacterId(storedCharacterId);

    if (!token) {
      router.replace("/");
      return;
    }

    if (!storedCharacterId) {
      router.replace("/characters");
      return;
    }

    fetchCharacters(token)
      .then(setCharacters)
      .catch(() => setError("Your selected character could not be loaded."))
      .finally(() => setIsLoading(false));
  }, [router]);

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.id === selectedCharacterId) ?? null,
    [characters, selectedCharacterId]
  );

  const detailStats = useMemo(
    () => (selectedCharacter ? getDetailStats(selectedCharacter) : []),
    [selectedCharacter]
  );

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

  useEffect(() => {
    if (!selectedCharacter) {
      setItemsById({});
      setSelectedEquipmentItemId(null);
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");
    const equippedItemIds = getEquippedItemIds(selectedCharacter);
    let ignoreResult = false;

    if (!token || equippedItemIds.length === 0) {
      setItemsById({});
      setSelectedEquipmentItemId(null);
      return;
    }

    getEquipmentItems(token, selectedCharacter)
      .then((items) => {
        if (!ignoreResult) {
          setItemsById(Object.fromEntries(items.map((item) => [item.id, item])));
        }
      })
      .catch(() => {
        if (!ignoreResult) {
          setItemsById({});
        }
      });

    return () => {
      ignoreResult = true;
    };
  }, [selectedCharacter]);

  useEffect(() => {
    if (!selectedCharacter || !selectedEquipmentItemId) {
      return;
    }

    if (!getEquippedItemIds(selectedCharacter).includes(selectedEquipmentItemId)) {
      setSelectedEquipmentItemId(null);
    }
  }, [selectedCharacter, selectedEquipmentItemId]);

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

  function handleSelectNavItem(label: MainApplicationNavItem) {
    setActiveNavItem(label);
    setIsMobileNavOpen(false);
  }

  function handleThemeToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    setIsMobileNavOpen(false);
  }

  function handleChangeCharacter() {
    localStorage.removeItem("flyffIdleSelectedCharacterId");
    router.push("/characters");
  }

  function handleLogout() {
    localStorage.removeItem("flyffIdleToken");
    localStorage.removeItem("flyffIdleUser");
    localStorage.removeItem("flyffIdleSelectedCharacterId");
    router.replace("/");
  }

  if (isLoading) {
    return (
      <MainApplicationCenteredState>
        <MutedText>Loading character...</MutedText>
      </MainApplicationCenteredState>
    );
  }

  if (error || !selectedCharacter) {
    return (
      <MainApplicationCenteredState>
        <MainApplicationErrorPanel>
          <ErrorMessage message={error || "That character is no longer available."} />
          <Button type="button" onClick={handleChangeCharacter}>
            Change character
          </Button>
        </MainApplicationErrorPanel>
      </MainApplicationCenteredState>
    );
  }

  return (
    <MainApplicationTemplate
      sidebar={
        <MainApplicationSidebar
          activeNavItem={activeNavItem}
          characterName={selectedCharacter.name}
          isMobileNavOpen={isMobileNavOpen}
          isProfileMenuOpen={isProfileMenuOpen}
          onChangeCharacter={handleChangeCharacter}
          onLogout={handleLogout}
          onProfileMenuToggle={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
          onSelectNavItem={handleSelectNavItem}
          onThemeToggle={handleThemeToggle}
          onToggleMobileNav={() => setIsMobileNavOpen((isOpen) => !isOpen)}
          theme={theme}
        />
      }
      header={
        <MainApplicationHeader
          character={selectedCharacter}
          isProfileMenuOpen={isProfileMenuOpen}
          onChangeCharacter={handleChangeCharacter}
          onLogout={handleLogout}
          onProfileMenuToggle={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
        />
      }
    >
      <MainApplicationContent>
        <ContentHeading activeNavItem={activeNavItem} />
        {activeNavItem === "Character Page" ? (
          <CharacterPageContent
            appliedStats={appliedStats}
            availableSkillPoints={availableSkillPoints}
            availableStatPoints={availableStatPoints}
            character={selectedCharacter}
            detailStats={detailStats}
            itemsById={itemsById}
            onAddSkillLevel={handleAddSkillLevel}
            onAddStat={handleAddStat}
            onApplySkills={handleApplySkills}
            onCanRemoveSkillLevel={handleCanRemoveSkillLevel}
            onApplyStats={handleApplyStats}
            onRemoveSkillLevel={handleRemoveSkillLevel}
            onRemoveStat={handleRemoveStat}
            onResetSkills={handleResetSkills}
            onResetStats={handleResetStats}
            onSelectEquipmentItem={setSelectedEquipmentItemId}
            pendingSkillLevels={pendingSkillLevels}
            pendingStats={pendingStats}
            selectedEquipmentItemId={selectedEquipmentItemId}
            skillTabs={skillTabs}
            statKeys={statKeys}
          />
        ) : (
          <DashboardStatsGrid character={selectedCharacter} />
        )}
      </MainApplicationContent>
    </MainApplicationTemplate>
  );
}
