"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCharacterProgression } from "@/hooks/main-application/useCharacterProgression";
import { useCharacterItems } from "@/hooks/main-application/useCharacterItems";
import { useBattleSession } from "@/hooks/main-application/useBattleSession";
import { useAdminActions } from "@/hooks/main-application/useAdminActions";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { AdminPage } from "@/components/pages/AdminPage";
import { BattlePage } from "@/components/pages/BattlePage";
import { InventoryPage } from "@/components/pages/InventoryPage";
import { MapPage } from "@/components/pages/MapPage";
import { ContentHeading } from "@/components/molecules/main-application/ContentHeading";
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
import { fetchCharacters, type Character, type ItemMetadata, type MapMonsterFamily } from "@/lib/api";
import { getCombatStats } from "@/lib/combatStats";

const storageKey = "flyffIdleTheme";

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

export function MainApplicationPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [activeNavItem, setActiveNavItem] = useState<MainApplicationNavItem>(navItems[0].label);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<MainApplicationTheme>("dark");
  const [selectedMonsterFamily, setSelectedMonsterFamily] = useState<MapMonsterFamily | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const {
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
  } = useCharacterProgression({ selectedCharacter, setCharacters, setError });
  const {
    activeEquipmentSet,
    handleEquipmentSetChange,
    handleEquipConsumableItem,
    handleEquipInventorySlot,
    handleMoveInventoryItem,
    handleSelectEquipmentSlot,
    handleSelectInventorySlot,
    handleSortInventory,
    handleUnequipEquipmentSlot,
    isItemActionPending,
    itemActionError,
    itemsById,
    selectedEquipmentSlot,
    selectedInventorySlotIndex,
    setItemActionError
  } = useCharacterItems({
    onAuthenticationRequired: () => router.replace("/"),
    selectedCharacter,
    selectedMonsterFamily,
    updateCharacter
  });
  const {
    battleStateByCharacterId,
    characterResourcesById,
    handleBattleStateChange,
    handleCharacterResourcesChange,
    handleConsumeInventoryItem,
    handleLootInventoryItems,
    handleUpdateCharacterProgression
  } = useBattleSession({
    activeEquipmentSet,
    isCombatViewActive: activeNavItem === "Combat",
    itemsById,
    onAuthenticationRequired: () => router.replace("/"),
    selectedCharacter,
    setError,
    setItemActionError,
    updateCharacter
  });
  const {
    adminError,
    handleAddInventoryItem,
    handleRefundSkills,
    handleRefundStats,
    isAddingInventoryItem,
    refundingAdminAction
  } = useAdminActions({
    handleResetSkills,
    handleSelectInventorySlot,
    onAuthenticationRequired: () => router.replace("/"),
    resetProgressionForms,
    selectedCharacter,
    updateCharacter
  });

  const detailStats = useMemo(
    () => (selectedCharacter ? getDetailStats(selectedCharacter, itemsById, activeEquipmentSet) : []),
    [activeEquipmentSet, itemsById, selectedCharacter]
  );

  function handleSelectNavItem(label: MainApplicationNavItem) {
    setActiveNavItem(label);
    setIsMobileNavOpen(false);
  }

  function handleSelectMapMonster(monsterFamily: MapMonsterFamily) {
    setSelectedMonsterFamily(monsterFamily);
    setActiveNavItem("Combat");
    setIsMobileNavOpen(false);
  }

  function updateCharacter(updatedCharacter: Character) {
    setCharacters((currentCharacters) =>
      currentCharacters.map((character) =>
        character.id === updatedCharacter.id ? updatedCharacter : character
      )
    );
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
