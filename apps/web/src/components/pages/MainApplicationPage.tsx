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
import { Button } from "@/components/atoms/Button";
import { ErrorMessage } from "@/components/atoms/ErrorMessage";
import { fetchCharacters, type Character } from "@/lib/api";

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

const equipmentGroups = {
  jewelry: [
    ["ringL", "Left Ring"],
    ["earringL", "Left Earring"],
    ["necklace", "Necklace"],
    ["earringR", "Right Earring"],
    ["ringR", "Right Ring"]
  ],
  weapons: [
    ["mainhand", "Main Hand"],
    ["offhand", "Off Hand"],
    ["ammo", "Ammo"]
  ],
  armor: [
    ["helmet", "Helmet"],
    ["suit", "Suit"],
    ["gloves", "Gloves"],
    ["boots", "Boots"]
  ],
  fashion: [
    ["csHelm", "Fashion Helm"],
    ["csSuit", "Fashion Suit"],
    ["csGloves", "Fashion Gloves"],
    ["csBoots", "Fashion Boots"],
    ["mask", "Mask"],
    ["cloak", "Cloak"],
    ["flying", "Flying"]
  ]
} as const;

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(storageKey, theme);
}

function getEquipmentValue(character: Character, slot: keyof Character["equipment"]) {
  return character.equipment[slot] ?? "Empty";
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
        <p className="muted">Loading character...</p>
      </main>
    );
  }

  if (error || !selectedCharacter) {
    return (
      <main className="app-shell">
        <section className="selection-panel stack">
          <ErrorMessage message={error || "That character is no longer available."} />
          <Button type="button" onClick={handleChangeCharacter}>
            Change character
          </Button>
        </section>
      </main>
    );
  }

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
            {theme === "dark" ? (
              <Sun aria-hidden="true" size={18} />
            ) : (
              <Moon aria-hidden="true" size={18} />
            )}
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
              <section className="character-equipment-panel">
                <div className="section-heading">
                  <h3>Character Equipment</h3>
                </div>
                <div className="equipment-layout">
                  <div className="equipment-zone equipment-jewelry" aria-label="Jewelry equipment">
                    {equipmentGroups.jewelry.map(([slot, label]) => (
                      <div className="equipment-slot" key={slot}>
                        <span>{label}</span>
                        <strong>{getEquipmentValue(selectedCharacter, slot)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="equipment-zone equipment-weapons" aria-label="Weapon equipment">
                    {equipmentGroups.weapons.map(([slot, label]) => (
                      <div className="equipment-slot" key={slot}>
                        <span>{label}</span>
                        <strong>{getEquipmentValue(selectedCharacter, slot)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="model-viewer-reserved">
                    <span>Model Viewer</span>
                  </div>
                  <div className="equipment-zone equipment-armor" aria-label="Armor equipment">
                    {equipmentGroups.armor.map(([slot, label]) => (
                      <div className="equipment-slot" key={slot}>
                        <span>{label}</span>
                        <strong>{getEquipmentValue(selectedCharacter, slot)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="equipment-zone equipment-fashion" aria-label="Fashion equipment">
                    {equipmentGroups.fashion.map(([slot, label]) => (
                      <div className="equipment-slot" key={slot}>
                        <span>{label}</span>
                        <strong>{getEquipmentValue(selectedCharacter, slot)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="character-info-grid">
                <article className="dashboard-panel character-stat-panel">
                  <div className="section-heading">
                    <p className="eyebrow">Base</p>
                    <h3>Character Stats</h3>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Name</span>
                    <strong>{selectedCharacter.name}</strong>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Job</span>
                    <strong>{selectedCharacter.job}</strong>
                  </div>
                  <div className="stat-row">
                    <span className="stat-label">Level</span>
                    <strong>{selectedCharacter.level}</strong>
                  </div>
                </article>

                <article className="dashboard-panel character-stat-panel">
                  <div className="section-heading">
                    <p className="eyebrow">Detail</p>
                    <h3>Combat Detail</h3>
                  </div>
                  {detailStats.map((stat) => (
                    <div className="stat-row" key={stat.label}>
                      <span className="stat-label">{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </article>

                <article className="dashboard-panel character-stat-panel stats-allocation-panel">
                  <div className="section-heading">
                    <p className="eyebrow">Stats</p>
                    <h3>Point Allocation</h3>
                  </div>
                  <div className="points-summary">
                    <span>Available stat points</span>
                    <strong>{availableStatPoints}</strong>
                  </div>
                  {statKeys.map((stat) => (
                    <div className="allocation-row" key={stat}>
                      <div>
                        <span className="stat-label">{stat.toUpperCase()}</span>
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
                  <div className="panel-actions">
                    <Button
                      type="button"
                      onClick={handleApplyStats}
                      disabled={statKeys.every((stat) => pendingStats[stat] === 0)}
                    >
                      Apply
                    </Button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={handleResetStats}
                      disabled={statKeys.every((stat) => pendingStats[stat] === 0)}
                    >
                      Reset
                    </button>
                  </div>
                </article>
              </section>

              <section className="dashboard-panel skills-panel">
                <div className="section-heading">
                  <p className="eyebrow">Skills</p>
                  <h3>Character Skills</h3>
                </div>
                <div className="points-summary">
                  <span>Available skill points</span>
                  <strong>{availableSkillPoints}</strong>
                </div>
                <p className="muted">Skill trees and learned abilities will be added here later.</p>
                <div className="panel-actions">
                  <Button type="button" onClick={handleApplySkills} disabled={pendingSkillPoints === 0}>
                    Apply
                  </Button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleResetSkills}
                    disabled={pendingSkillPoints === 0}
                  >
                    Reset
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="dashboard-grid">
              <article className="dashboard-panel">
                <span className="stat-label">STR</span>
                <strong>{selectedCharacter.stats.str}</strong>
              </article>
              <article className="dashboard-panel">
                <span className="stat-label">STA</span>
                <strong>{selectedCharacter.stats.sta}</strong>
              </article>
              <article className="dashboard-panel">
                <span className="stat-label">DEX</span>
                <strong>{selectedCharacter.stats.dex}</strong>
              </article>
              <article className="dashboard-panel">
                <span className="stat-label">INT</span>
                <strong>{selectedCharacter.stats.int}</strong>
              </article>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
