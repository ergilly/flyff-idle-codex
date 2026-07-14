"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { AdminPage } from "@/components/pages/AdminPage";
import { BattlePage } from "@/components/pages/BattlePage";
import { InventoryPage } from "@/components/pages/InventoryPage";
import { MapPage } from "@/components/pages/MapPage";
import { ContentHeading } from "@/components/molecules/main-application/ContentHeading";
import { getEquippedItemIds } from "@/components/molecules/main-application/CharacterEquipmentPanel";
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
  addCharacterInventoryItem,
  consumeEquippedConsumableItem,
  equipInventoryItem,
  fetchCharacters,
  fetchItems,
  lootInventoryItems,
  moveInventoryItem,
  refundCharacterSkills,
  refundCharacterStats,
  sortInventory,
  type Character,
  type CharacterEquipmentSlot,
  type InventorySortOption,
  type CharacterSkillLevels,
  type ItemMetadata,
  type MapMonsterFamily,
  equipConsumableItem,
  unequipItem,
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
import { getCombatStats } from "@/lib/combatStats";

const storageKey = "flyffIdleTheme";
const statKeys: StatKey[] = ["str", "sta", "dex", "int"];
const passiveHpRegenIntervalMs = 5000;
const passiveHpRegenRate = 0.05;

type CharacterResourceState = {
  fp: number;
  hp: number;
  mp: number;
};
type PersistedBattleLogEntry = {
  id: number;
  message: string;
  tone: "danger" | "muted" | "success";
};
type PersistedBattleState = {
  droppedItems: Array<{ itemId: string; quantity: number }>;
  log: PersistedBattleLogEntry[];
};

function applyTheme(theme: MainApplicationTheme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(storageKey, theme);
}

function getDetailStats(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  activeEquipmentSet: number
) {
  const combatStats = getCombatStats(character, itemsById, activeEquipmentSet);
  const statsByLabel = new Map(combatStats.map((stat) => [stat.label, stat.value]));

  return [
    { label: "ATK", value: statsByLabel.get("Attack") ?? 0 },
    { label: "DEF", value: statsByLabel.get("Defense") ?? 0 },
    { label: "Crit%", value: statsByLabel.get("Critical Chance") ?? "0%" },
    { label: "Attk Speed", value: statsByLabel.get("Attack Speed") ?? "0%" }
  ];
}

function getCombatStatNumber(
  character: Character,
  itemsById: Record<string, ItemMetadata>,
  activeEquipmentSet: number,
  label: string
) {
  const combatStats = getCombatStats(character, itemsById, activeEquipmentSet);
  const value = combatStats.find((stat) => stat.label === label)?.value;
  const numberValue =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? "0").replace(/[^\d.-]/g, ""));

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getCharacterEquipmentSet(character: Character, equipmentSet: number) {
  return character.equipmentSets?.[equipmentSet] ?? character.equipment;
}

function getChangedEquipmentSlot(
  previousCharacter: Character,
  nextCharacter: Character,
  equipmentSet: number
) {
  const previousEquipment = getCharacterEquipmentSet(previousCharacter, equipmentSet);
  const nextEquipment = getCharacterEquipmentSet(nextCharacter, equipmentSet);
  const changedSlot = (Object.keys(nextEquipment) as CharacterEquipmentSlot[]).find(
    (slot) => previousEquipment[slot] !== nextEquipment[slot]
  );

  return changedSlot ?? null;
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
  const [selectedMonsterFamily, setSelectedMonsterFamily] = useState<MapMonsterFamily | null>(null);
  const [characterResourcesById, setCharacterResourcesById] = useState<
    Record<string, CharacterResourceState>
  >({});
  const [battleStateByCharacterId, setBattleStateByCharacterId] = useState<
    Record<string, PersistedBattleState>
  >({});
  const [activeEquipmentSet, setActiveEquipmentSet] = useState(0);
  const [selectedEquipmentSlot, setSelectedEquipmentSlot] = useState<CharacterEquipmentSlot | null>(null);
  const [selectedInventorySlotIndex, setSelectedInventorySlotIndex] = useState<number | null>(null);
  const [itemActionError, setItemActionError] = useState("");
  const [isItemActionPending, setIsItemActionPending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [refundingAdminAction, setRefundingAdminAction] = useState<"stats" | "skills" | null>(null);
  const [isAddingInventoryItem, setIsAddingInventoryItem] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("flyffIdleToken");
    const storedUser = localStorage.getItem("flyffIdleUser");
    const storedCharacterId = localStorage.getItem("flyffIdleSelectedCharacterId");
    const storedTheme = localStorage.getItem(storageKey) === "light" ? "light" : "dark";

    setTheme(storedTheme);
    applyTheme(storedTheme);
    setSelectedCharacterId(storedCharacterId);
    try {
      setIsAdmin(storedUser ? Boolean((JSON.parse(storedUser) as { isAdmin?: boolean }).isAdmin) : false);
    } catch {
      setIsAdmin(false);
    }

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
    () => (selectedCharacter ? getDetailStats(selectedCharacter, itemsById, activeEquipmentSet) : []),
    [activeEquipmentSet, itemsById, selectedCharacter]
  );

  useEffect(() => {
    if (!selectedCharacter || activeNavItem === "Combat") {
      return undefined;
    }

    const currentResources = characterResourcesById[selectedCharacter.id];

    if (!currentResources) {
      return undefined;
    }

    const maxHp = getCombatStatNumber(selectedCharacter, itemsById, activeEquipmentSet, "Max HP");

    if (maxHp <= 0 || currentResources.hp >= maxHp) {
      return undefined;
    }

    const regenAmount = Math.max(1, Math.floor(maxHp * passiveHpRegenRate));
    const regenInterval = window.setInterval(() => {
      setCharacterResourcesById((currentResourcesById) => {
        const resources = currentResourcesById[selectedCharacter.id];

        if (!resources || resources.hp >= maxHp) {
          return currentResourcesById;
        }

        return {
          ...currentResourcesById,
          [selectedCharacter.id]: {
            ...resources,
            hp: Math.min(maxHp, resources.hp + regenAmount)
          }
        };
      });
    }, passiveHpRegenIntervalMs);

    return () => window.clearInterval(regenInterval);
  }, [activeEquipmentSet, activeNavItem, characterResourcesById, itemsById, selectedCharacter]);

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
    setActiveEquipmentSet(0);

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
      setSelectedEquipmentSlot(null);
      setSelectedInventorySlotIndex(null);
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");
    const itemIds = [
      ...getEquippedItemIds(selectedCharacter),
      ...selectedCharacter.inventory.items.map((item) => item.itemId),
      ...(selectedMonsterFamily?.variants?.flatMap(
        (variant) => variant.drops?.map((drop) => String(drop.item)) ?? []
      ) ?? [])
    ];
    let ignoreResult = false;

    if (!token || itemIds.length === 0) {
      setItemsById({});
      setSelectedEquipmentSlot(null);
      setSelectedInventorySlotIndex(null);
      return;
    }

    fetchItems(token, itemIds)
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
  }, [selectedCharacter, selectedMonsterFamily]);

  useEffect(() => {
    if (!selectedCharacter || !selectedEquipmentSlot) {
      return;
    }

    const selectedEquipment =
      selectedCharacter.equipmentSets?.[activeEquipmentSet] ?? selectedCharacter.equipment;

    if (!selectedEquipment[selectedEquipmentSlot]) {
      setSelectedEquipmentSlot(null);
    }
  }, [activeEquipmentSet, selectedCharacter, selectedEquipmentSlot]);

  function handleEquipmentSetChange(equipmentSet: number) {
    setActiveEquipmentSet(equipmentSet);
    setSelectedEquipmentSlot(null);
  }

  useEffect(() => {
    if (!selectedCharacter || selectedInventorySlotIndex === null) {
      return;
    }

    if (!selectedCharacter.inventory.items.some((item) => item.slotIndex === selectedInventorySlotIndex)) {
      setSelectedInventorySlotIndex(null);
    }
  }, [selectedCharacter, selectedInventorySlotIndex]);

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

  async function handleUpdateCharacterProgression(progression: {
    exp?: number;
    level?: number;
    penya?: number;
  }) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const updatedCharacter = await updateCharacterProgression(token, selectedCharacter.id, progression);
      updateCharacter(updatedCharacter);
    } catch {
      setError("Unable to save character progression.");
    }
  }

  async function handleLootInventoryItems(items: Array<{ itemId: string; quantity: number }>) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    const updatedCharacter = await lootInventoryItems(token, selectedCharacter.id, items);

    updateCharacter(updatedCharacter);
  }

  async function handleConsumeInventoryItem(resource: "hp" | "mp" | "fp") {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const updatedCharacter = await consumeEquippedConsumableItem(token, selectedCharacter.id, resource);
      updateCharacter(updatedCharacter);
    } catch (consumeError) {
      setItemActionError(
        consumeError instanceof Error ? consumeError.message : "Unable to consume equipped item"
      );
    }
  }

  function handleCharacterResourcesChange(resources: CharacterResourceState) {
    if (!selectedCharacter) {
      return;
    }

    setCharacterResourcesById((currentResourcesById) => {
      const currentResources = currentResourcesById[selectedCharacter.id];

      if (
        currentResources?.fp === resources.fp &&
        currentResources.hp === resources.hp &&
        currentResources.mp === resources.mp
      ) {
        return currentResourcesById;
      }

      return {
        ...currentResourcesById,
        [selectedCharacter.id]: resources
      };
    });
  }

  function handleBattleStateChange(battleState: PersistedBattleState) {
    if (!selectedCharacter) {
      return;
    }

    setBattleStateByCharacterId((currentBattleStateByCharacterId) => {
      const currentBattleState = currentBattleStateByCharacterId[selectedCharacter.id];

      if (
        currentBattleState &&
        JSON.stringify(currentBattleState.droppedItems) === JSON.stringify(battleState.droppedItems) &&
        JSON.stringify(currentBattleState.log) === JSON.stringify(battleState.log)
      ) {
        return currentBattleStateByCharacterId;
      }

      return {
        ...currentBattleStateByCharacterId,
        [selectedCharacter.id]: battleState
      };
    });
  }

  function handleResetSkills() {
    setPendingSkillLevels({});
  }

  function handleSelectNavItem(label: MainApplicationNavItem) {
    setActiveNavItem(label);
    setIsMobileNavOpen(false);
  }

  function handleSelectMapMonster(monsterFamily: MapMonsterFamily) {
    setSelectedMonsterFamily(monsterFamily);
    setActiveNavItem("Combat");
    setIsMobileNavOpen(false);
  }

  function handleSelectEquipmentSlot(slot: CharacterEquipmentSlot) {
    setItemActionError("");
    setSelectedEquipmentSlot(slot);
  }

  function handleSelectInventorySlot(slotIndex: number | null) {
    setItemActionError("");
    setSelectedInventorySlotIndex(slotIndex);
  }

  function updateCharacter(updatedCharacter: Character) {
    setCharacters((currentCharacters) =>
      currentCharacters.map((character) =>
        character.id === updatedCharacter.id ? updatedCharacter : character
      )
    );
  }

  async function handleRefundStats() {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    setAdminError("");
    setRefundingAdminAction("stats");

    try {
      const updatedCharacter = await refundCharacterStats(token, selectedCharacter.id);
      updateCharacter(updatedCharacter);
      setAppliedStats({ str: 0, sta: 0, dex: 0, int: 0 });
      setPendingStats({ str: 0, sta: 0, dex: 0, int: 0 });
      setPendingSkillLevels({});
    } catch (refundError) {
      setAdminError(refundError instanceof Error ? refundError.message : "Unable to refund points");
    } finally {
      setRefundingAdminAction(null);
    }
  }

  async function handleRefundSkills() {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    setAdminError("");
    setRefundingAdminAction("skills");

    try {
      const updatedCharacter = await refundCharacterSkills(token, selectedCharacter.id);
      updateCharacter(updatedCharacter);
      setPendingSkillLevels({});
    } catch (refundError) {
      setAdminError(refundError instanceof Error ? refundError.message : "Unable to refund points");
    } finally {
      setRefundingAdminAction(null);
    }
  }

  async function handleAddInventoryItem(itemId: string, quantity: number) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    setAdminError("");
    setIsAddingInventoryItem(true);

    try {
      const previousInventoryItemsBySlot = new Map(
        selectedCharacter.inventory.items.map((item) => [item.slotIndex, item])
      );
      const updatedCharacter = await addCharacterInventoryItem(token, selectedCharacter.id, {
        itemId,
        quantity
      });
      updateCharacter(updatedCharacter);
      const addedItem = [...updatedCharacter.inventory.items].reverse().find((item) => {
        const previousItem = previousInventoryItemsBySlot.get(item.slotIndex);

        return (
          item.itemId === itemId &&
          (!previousItem || previousItem.itemId !== item.itemId || previousItem.quantity !== item.quantity)
        );
      });
      setSelectedInventorySlotIndex(addedItem?.slotIndex ?? null);
    } catch (addItemError) {
      setAdminError(addItemError instanceof Error ? addItemError.message : "Unable to add item");
    } finally {
      setIsAddingInventoryItem(false);
    }
  }

  async function handleEquipInventorySlot(slotIndex: number, equipmentSet: number) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    setItemActionError("");
    setIsItemActionPending(true);

    try {
      const updatedCharacter = await equipInventoryItem(token, selectedCharacter.id, slotIndex, equipmentSet);
      updateCharacter(updatedCharacter);
      setSelectedInventorySlotIndex(null);
      setActiveEquipmentSet(equipmentSet);
      setSelectedEquipmentSlot(getChangedEquipmentSlot(selectedCharacter, updatedCharacter, equipmentSet));
    } catch (equipError) {
      setItemActionError(equipError instanceof Error ? equipError.message : "Unable to equip item");
    } finally {
      setIsItemActionPending(false);
    }
  }

  async function handleEquipConsumableItem(resource: "hp" | "mp" | "fp", slotIndex: number | null) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const updatedCharacter = await equipConsumableItem(token, selectedCharacter.id, resource, slotIndex);
      updateCharacter(updatedCharacter);
    } catch (equipError) {
      setItemActionError(equipError instanceof Error ? equipError.message : "Unable to equip consumable");
    }
  }

  async function handleMoveInventoryItem(fromSlotIndex: number, toSlotIndex: number) {
    if (!selectedCharacter || fromSlotIndex === toSlotIndex) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    setItemActionError("");
    setIsItemActionPending(true);

    try {
      const updatedCharacter = await moveInventoryItem(
        token,
        selectedCharacter.id,
        fromSlotIndex,
        toSlotIndex
      );
      updateCharacter(updatedCharacter);
      setSelectedInventorySlotIndex(toSlotIndex);
    } catch (moveError) {
      setItemActionError(moveError instanceof Error ? moveError.message : "Unable to move item");
    } finally {
      setIsItemActionPending(false);
    }
  }

  async function handleSortInventory(sortBy: InventorySortOption) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    setItemActionError("");
    setIsItemActionPending(true);

    try {
      const updatedCharacter = await sortInventory(token, selectedCharacter.id, sortBy);
      updateCharacter(updatedCharacter);
      setSelectedInventorySlotIndex(null);
    } catch (sortError) {
      setItemActionError(sortError instanceof Error ? sortError.message : "Unable to sort inventory");
    } finally {
      setIsItemActionPending(false);
    }
  }

  async function handleUnequipEquipmentSlot(equipmentSlot: CharacterEquipmentSlot, equipmentSet: number) {
    if (!selectedCharacter) {
      return;
    }

    const token = localStorage.getItem("flyffIdleToken");

    if (!token) {
      router.replace("/");
      return;
    }

    setItemActionError("");
    setIsItemActionPending(true);

    try {
      const updatedCharacter = await unequipItem(token, selectedCharacter.id, equipmentSlot, equipmentSet);
      updateCharacter(updatedCharacter);
      setSelectedEquipmentSlot(null);
    } catch (unequipError) {
      setItemActionError(unequipError instanceof Error ? unequipError.message : "Unable to unequip item");
    } finally {
      setIsItemActionPending(false);
    }
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
        <MutedText data-testid="game_p_loading_character">Loading character...</MutedText>
      </MainApplicationCenteredState>
    );
  }

  if (error || !selectedCharacter) {
    return (
      <MainApplicationCenteredState>
        <MainApplicationErrorPanel>
          <ErrorMessage
            message={error || "That character is no longer available."}
            testId="game_error_selected_character"
          />
          <Button
            data-testid="game_error_button_change_character"
            type="button"
            onClick={handleChangeCharacter}
          >
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
          isAdmin={isAdmin}
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
            activeEquipmentSet={activeEquipmentSet}
            appliedStats={appliedStats}
            availableSkillPoints={availableSkillPoints}
            availableStatPoints={availableStatPoints}
            character={selectedCharacter}
            detailStats={detailStats}
            itemsById={itemsById}
            equipmentActionError={itemActionError}
            isEquipmentActionPending={isItemActionPending}
            onAddSkillLevel={handleAddSkillLevel}
            onAddStat={handleAddStat}
            onApplySkills={handleApplySkills}
            onCanRemoveSkillLevel={handleCanRemoveSkillLevel}
            onClearStat={handleClearStat}
            onEquipmentSetChange={handleEquipmentSetChange}
            onMaxStat={handleMaxStat}
            onApplyStats={handleApplyStats}
            onRemoveSkillLevel={handleRemoveSkillLevel}
            onRemoveStat={handleRemoveStat}
            onResetSkills={handleResetSkills}
            onResetStats={handleResetStats}
            onSelectEquipmentSlot={handleSelectEquipmentSlot}
            onSetStat={handleSetStat}
            onUnequipEquipmentSlot={handleUnequipEquipmentSlot}
            pendingSkillLevels={pendingSkillLevels}
            pendingStats={pendingStats}
            selectedEquipmentSlot={selectedEquipmentSlot}
            skillTabs={skillTabs}
            statKeys={statKeys}
          />
        ) : activeNavItem === "Inventory" ? (
          <InventoryPage
            character={selectedCharacter}
            actionError={itemActionError}
            isActionPending={isItemActionPending}
            itemsById={itemsById}
            onEquipSlot={handleEquipInventorySlot}
            activeEquipmentSet={activeEquipmentSet}
            onMoveItem={handleMoveInventoryItem}
            onSelectSlot={handleSelectInventorySlot}
            onSortInventory={handleSortInventory}
            selectedSlotIndex={selectedInventorySlotIndex}
          />
        ) : activeNavItem === "Map" ? (
          <MapPage onSelectMonster={handleSelectMapMonster} />
        ) : activeNavItem === "Combat" ? (
          <BattlePage
            character={selectedCharacter}
            initialBattleState={battleStateByCharacterId[selectedCharacter.id]}
            initialCharacterResources={characterResourcesById[selectedCharacter.id]}
            itemsById={itemsById}
            onBattleStateChange={handleBattleStateChange}
            onClearMonsterTarget={() => setSelectedMonsterFamily(null)}
            onCharacterResourcesChange={handleCharacterResourcesChange}
            onConsumeInventoryItem={handleConsumeInventoryItem}
            onEquipConsumableItem={handleEquipConsumableItem}
            onLootInventoryItems={handleLootInventoryItems}
            onUpdateCharacterProgression={handleUpdateCharacterProgression}
            selectedMonsterFamily={selectedMonsterFamily}
            skillTabs={skillTabs}
          />
        ) : activeNavItem === "Admin" ? (
          <AdminPage
            addingInventoryItem={isAddingInventoryItem}
            character={selectedCharacter}
            error={adminError}
            onAddInventoryItem={handleAddInventoryItem}
            onRefundSkills={handleRefundSkills}
            onRefundStats={handleRefundStats}
            refundingAction={refundingAdminAction}
          />
        ) : (
          <DashboardStatsGrid character={selectedCharacter} />
        )}
      </MainApplicationContent>
    </MainApplicationTemplate>
  );
}
