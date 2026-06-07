"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Backpack,
  ChevronDown,
  CircleUserRound,
  Cog,
  Minus,
  LogOut,
  Map,
  Moon,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Sun,
  UserPlus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Actions } from "@/components/atoms/Actions";
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { MutedText } from "@/components/atoms/MutedText";
import { Panel } from "@/components/atoms/Panel";
import { Stack } from "@/components/atoms/Stack";
import { StatLabel, StatRow } from "@/components/atoms/StatRow";
import { ItemDetailsPanel } from "@/components/molecules/ItemDetailsPanel";
import { SectionHeading } from "@/components/molecules/SectionHeading";
import { fetchCharacters, fetchItems, getItemIconUrl, type Character, type ItemMetadata } from "@/lib/api";
import { borders, colors, radii, shadows, spacing } from "@/styles/tokens";

type Theme = "dark" | "light";
type StatKey = "str" | "sta" | "dex" | "int";

const navItems = [
  { label: "Character Page", icon: CircleUserRound },
  { label: "Inventory", icon: Backpack },
  { label: "Map", icon: Map },
  { label: "Combat", icon: Swords },
  { label: "Upgrading", icon: Sparkles }
];

const storageKey = "flyffIdleTheme";
const statKeys: StatKey[] = ["str", "sta", "dex", "int"];

const equipmentSlots: {
  slot: keyof Character["equipment"];
  label: string;
  frame: string;
}[] = [
  { slot: "mainhand", label: "Main Hand", frame: "left-1" },
  { slot: "offhand", label: "Off Hand", frame: "left-2" },
  { slot: "ammo", label: "Ammo", frame: "left-3" },
  { slot: "cloak", label: "Cloak", frame: "left-4" },
  { slot: "mask", label: "Mask", frame: "left-5" },
  { slot: "ringL", label: "Left Ring", frame: "jewel-1" },
  { slot: "earringL", label: "Left Earring", frame: "jewel-2" },
  { slot: "necklace", label: "Necklace", frame: "jewel-3" },
  { slot: "earringR", label: "Right Earring", frame: "jewel-4" },
  { slot: "ringR", label: "Right Ring", frame: "jewel-5" },
  { slot: "helmet", label: "Helmet", frame: "right-1" },
  { slot: "suit", label: "Suit", frame: "right-2" },
  { slot: "gloves", label: "Gloves", frame: "right-3" },
  { slot: "boots", label: "Boots", frame: "right-4" },
  { slot: "flying", label: "Flying", frame: "right-5" },
  { slot: "csHelm", label: "Fashion Helm", frame: "bottom-1" },
  { slot: "csSuit", label: "Fashion Suit", frame: "bottom-2" },
  { slot: "csGloves", label: "Fashion Gloves", frame: "bottom-3" },
  { slot: "csBoots", label: "Fashion Boots", frame: "bottom-4" }
];

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(storageKey, theme);
}

function getEquipmentValue(character: Character, slot: keyof Character["equipment"]) {
  return character.equipment[slot] ?? "Empty";
}

function getEquippedItemIds(character: Character) {
  return Object.values(character.equipment).filter((itemId): itemId is string => Boolean(itemId));
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
  const [activeNavItem, setActiveNavItem] = useState(navItems[0].label);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
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
  const [pendingSkillPoints, setPendingSkillPoints] = useState(0);
  const [availableSkillPoints, setAvailableSkillPoints] = useState(0);
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

    fetchItems(token, equippedItemIds)
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

  function handleApplyStats() {
    setAppliedStats((currentStats) =>
      statKeys.reduce(
        (nextStats, stat) => ({ ...nextStats, [stat]: currentStats[stat] + pendingStats[stat] }),
        currentStats
      )
    );
    setPendingStats({ str: 0, sta: 0, dex: 0, int: 0 });
  }

  function handleResetStats() {
    const pointsToReturn = statKeys.reduce((totalPoints, stat) => totalPoints + pendingStats[stat], 0);

    setAvailableStatPoints((currentPoints) => currentPoints + pointsToReturn);
    setPendingStats({ str: 0, sta: 0, dex: 0, int: 0 });
  }

  function handleApplySkills() {
    setPendingSkillPoints(0);
  }

  function handleResetSkills() {
    setAvailableSkillPoints((currentPoints) => currentPoints + pendingSkillPoints);
    setPendingSkillPoints(0);
  }

  function handleThemeToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
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
      <main className="app-shell">
        <MutedText>Loading character...</MutedText>
      </main>
    );
  }

  if (error || !selectedCharacter) {
    return (
      <main className="app-shell">
        <Stack as="section" className="app-error-panel">
          <ErrorMessage message={error || "That character is no longer available."} />
          <Button type="button" onClick={handleChangeCharacter}>
            Change character
          </Button>
          <style>{`
            .app-error-panel {
              width: min(100%, 1040px);
              border: ${borders.default};
              border-radius: ${radii.md};
              background: ${colors.panelShell};
              box-shadow: ${shadows.shell};
              padding: ${spacing["6xl"]};
            }
          `}</style>
        </Stack>
      </main>
    );
  }

  const selectedEquipmentSlot = equipmentSlots.find(
    ({ slot }) => selectedCharacter.equipment[slot] === selectedEquipmentItemId
  );
  const selectedItem = selectedEquipmentItemId ? itemsById[selectedEquipmentItemId] : null;
  const mainhandItemId = selectedCharacter.equipment.mainhand;
  const mainhandItem = mainhandItemId ? itemsById[mainhandItemId] : null;
  const hasTwoHandedMainhand = mainhandItem?.category === "weapon" && mainhandItem.twoHanded === true;

  return (
    <main className="app-shell">
      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="app-brand">
          <Shield aria-hidden="true" size={24} />
          <strong>Flyff Idle</strong>
        </div>
        <nav className="app-nav">
          {navItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className={activeNavItem === label ? "app-nav-button active" : "app-nav-button"}
              type="button"
              onClick={() => setActiveNavItem(label)}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="app-sidebar-actions">
          <button className="app-nav-button" type="button" onClick={() => setActiveNavItem("Settings")}>
            <Cog aria-hidden="true" size={18} />
            <span>Settings</span>
          </button>
          <button className="app-nav-button" type="button" onClick={handleThemeToggle}>
            {theme === "dark" ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div className="character-summary">
            <div>
              <p className="eyebrow">Current character</p>
              <h1>{selectedCharacter.name}</h1>
            </div>
            <div className="header-stat">
              <span>Class</span>
              <strong>{selectedCharacter.job}</strong>
            </div>
            <div className="header-stat">
              <span>Level</span>
              <strong>{selectedCharacter.level}</strong>
            </div>
            <div className="header-stat">
              <span>Penya</span>
              <strong>{selectedCharacter.penya.toLocaleString()}</strong>
            </div>
          </div>

          <div className="profile-menu-wrap">
            <button
              className="profile-button"
              type="button"
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
            >
              <CircleUserRound aria-hidden="true" size={20} />
              <span>{selectedCharacter.name}</span>
              <ChevronDown aria-hidden="true" size={16} />
            </button>
            {isProfileMenuOpen ? (
              <div className="profile-menu" role="menu">
                <button type="button" role="menuitem" onClick={handleChangeCharacter}>
                  <UserPlus aria-hidden="true" size={17} />
                  Change character
                </button>
                <button type="button" role="menuitem" onClick={handleLogout}>
                  <LogOut aria-hidden="true" size={17} />
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <section className="app-content">
          <div className="content-heading">
            <p className="eyebrow">{activeNavItem}</p>
            <h2>{activeNavItem}</h2>
          </div>
          {activeNavItem === "Character Page" ? (
            <div className="character-page-layout">
              <div className="character-equipment-row">
                <section className="character-equipment-panel">
                  <SectionHeading title="Character Equipment" />
                  <div className="equipment-layout" aria-label="Character equipment slots">
                    {equipmentSlots.map(({ frame, label, slot }) => {
                      const isOffhandBlockedByTwoHander = slot === "offhand" && hasTwoHandedMainhand;
                      const itemId = isOffhandBlockedByTwoHander
                        ? mainhandItemId
                        : selectedCharacter.equipment[slot];
                      const item = itemId ? itemsById[itemId] : null;
                      const value = item?.name ?? getEquipmentValue(selectedCharacter, slot);
                      const iconUrl = item?.icon ? getItemIconUrl(item.icon) : null;
                      const isSelected = itemId !== null && itemId === selectedEquipmentItemId;
                      const slotLabel = isOffhandBlockedByTwoHander
                        ? `${label}: ${value} occupies this slot`
                        : `${label}: ${value}`;

                      return (
                        <button
                          className={`equipment-slot equipment-slot-${frame} ${
                            itemId ? "equipped" : "empty"
                          } ${isSelected ? "selected" : ""} ${
                            isOffhandBlockedByTwoHander ? "two-handed-occupied" : ""
                          }`}
                          key={slot}
                          type="button"
                          aria-label={slotLabel}
                          aria-pressed={isSelected}
                          title={slotLabel}
                          onClick={() => (itemId ? setSelectedEquipmentItemId(itemId) : undefined)}
                          disabled={!itemId}
                        >
                          <span>{label}</span>
                          {iconUrl ? (
                            <img className="equipment-slot-icon" src={iconUrl} alt={value} loading="lazy" />
                          ) : (
                            <strong>{value}</strong>
                          )}
                        </button>
                      );
                    })}
                    <div
                      className="model-viewer-reserved"
                      aria-label={`${selectedCharacter.name} model preview`}
                    />
                  </div>
                </section>

                <ItemDetailsPanel item={selectedItem} slotLabel={selectedEquipmentSlot?.label ?? null} />
              </div>

              <section className="character-info-grid">
                <Panel style={{ alignContent: "start" }}>
                  <SectionHeading eyebrow="Base" title="Character Stats" />
                  <StatRow label="Name" value={selectedCharacter.name} />
                  <StatRow label="Job" value={selectedCharacter.job} />
                  <StatRow label="Level" value={selectedCharacter.level} />
                </Panel>

                <Panel style={{ alignContent: "start" }}>
                  <SectionHeading eyebrow="Detail" title="Combat Detail" />
                  {detailStats.map((stat) => (
                    <StatRow key={stat.label} label={stat.label} value={stat.value} />
                  ))}
                </Panel>

                <Panel style={{ alignContent: "start" }}>
                  <SectionHeading eyebrow="Stats" title="Point Allocation" />
                  <div className="points-summary">
                    <span>Available stat points</span>
                    <strong>{availableStatPoints}</strong>
                  </div>
                  {statKeys.map((stat) => (
                    <div className="allocation-row" key={stat}>
                      <div>
                        <StatLabel>{stat.toUpperCase()}</StatLabel>
                        <strong>
                          {selectedCharacter.stats[stat] + appliedStats[stat] + pendingStats[stat]}
                        </strong>
                      </div>
                      <div className="allocation-controls">
                        <button
                          type="button"
                          aria-label={`Remove pending ${stat.toUpperCase()} point`}
                          onClick={() => handleRemoveStat(stat)}
                          disabled={pendingStats[stat] === 0}
                        >
                          <Minus aria-hidden="true" size={16} />
                        </button>
                        <span>{pendingStats[stat]}</span>
                        <button
                          type="button"
                          aria-label={`Add ${stat.toUpperCase()} point`}
                          onClick={() => handleAddStat(stat)}
                          disabled={availableStatPoints === 0}
                        >
                          <Plus aria-hidden="true" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Actions gap={10}>
                    <Button
                      type="button"
                      onClick={handleApplyStats}
                      disabled={statKeys.every((stat) => pendingStats[stat] === 0)}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handleResetStats}
                      disabled={statKeys.every((stat) => pendingStats[stat] === 0)}
                    >
                      Reset
                    </Button>
                  </Actions>
                </Panel>
              </section>

              <Panel as="section" style={{ maxWidth: 720 }}>
                <SectionHeading eyebrow="Skills" title="Character Skills" />
                <div className="points-summary">
                  <span>Available skill points</span>
                  <strong>{availableSkillPoints}</strong>
                </div>
                <MutedText>Skill trees and learned abilities will be added here later.</MutedText>
                <Actions gap={10}>
                  <Button type="button" onClick={handleApplySkills} disabled={pendingSkillPoints === 0}>
                    Apply
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={handleResetSkills}
                    disabled={pendingSkillPoints === 0}
                  >
                    Reset
                  </Button>
                </Actions>
              </Panel>
            </div>
          ) : (
            <div className="dashboard-grid">
              <Panel>
                <StatLabel>STR</StatLabel>
                <strong>{selectedCharacter.stats.str}</strong>
              </Panel>
              <Panel>
                <StatLabel>STA</StatLabel>
                <strong>{selectedCharacter.stats.sta}</strong>
              </Panel>
              <Panel>
                <StatLabel>DEX</StatLabel>
                <strong>{selectedCharacter.stats.dex}</strong>
              </Panel>
              <Panel>
                <StatLabel>INT</StatLabel>
                <strong>{selectedCharacter.stats.int}</strong>
              </Panel>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
