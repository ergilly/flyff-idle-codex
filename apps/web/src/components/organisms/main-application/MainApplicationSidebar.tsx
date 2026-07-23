import {
  Backpack,
  ChevronDown,
  CircleUserRound,
  Cog,
  ListChecks,
  ShieldCheck,
  Map,
  Moon,
  Shield,
  Sparkles,
  Swords,
  Sun
} from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { ProfileActionsMenu } from "@/components/molecules/main-application/ProfileActionsMenu";
import { cx } from "@/lib/classNames";
import { getTestIdSegment } from "@/lib/testIds";

export const navItems = [
  { label: "Character Page", icon: CircleUserRound },
  { label: "Inventory", icon: Backpack },
  { label: "Quests", icon: ListChecks },
  { label: "Map", icon: Map },
  { label: "Combat", icon: Swords },
  { label: "Upgrading", icon: Sparkles }
];

export type MainApplicationNavItem = (typeof navItems)[number]["label"] | "Admin" | "Settings";
export type MainApplicationTheme = "dark" | "light";

type MainApplicationSidebarProps = {
  activeNavItem: string;
  characterName: string;
  isAdmin: boolean;
  isMobileNavOpen: boolean;
  isProfileMenuOpen: boolean;
  onChangeCharacter: () => void;
  onLogout: () => void;
  onProfileMenuToggle: () => void;
  onSelectNavItem: (label: MainApplicationNavItem) => void;
  onThemeToggle: () => void;
  onToggleMobileNav: () => void;
  theme: MainApplicationTheme;
};

export function MainApplicationSidebar({
  activeNavItem,
  characterName,
  isAdmin,
  isMobileNavOpen,
  isProfileMenuOpen,
  onChangeCharacter,
  onLogout,
  onProfileMenuToggle,
  onSelectNavItem,
  onThemeToggle,
  onToggleMobileNav,
  theme
}: MainApplicationSidebarProps) {
  return (
    <AppSidebar aria-label="Primary navigation" data-testid="game_sidebar_aside">
      <MobileSidebarTop>
        <AppBrand isOpen={isMobileNavOpen} onToggle={onToggleMobileNav}>
          <Shield aria-hidden="true" size={24} />
          <strong data-testid="game_sidebar_strong_brand">Flyff Idle</strong>
        </AppBrand>
        <ProfileActionsMenu
          characterName={characterName}
          isOpen={isProfileMenuOpen}
          onChangeCharacter={onChangeCharacter}
          onLogout={onLogout}
          onToggle={onProfileMenuToggle}
          variant="mobile"
        />
      </MobileSidebarTop>
      <AppNav isOpen={isMobileNavOpen}>
        {navItems.map(({ icon: Icon, label }) => (
          <AppNavButton
            key={label}
            $active={activeNavItem === label}
            data-testid={`game_sidebar_button_nav_${getTestIdSegment(label)}`}
            type="button"
            onClick={() => onSelectNavItem(label)}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{label}</span>
          </AppNavButton>
        ))}
      </AppNav>
      <AppSidebarActions isOpen={isMobileNavOpen}>
        {isAdmin ? (
          <AppNavButton
            $active={activeNavItem === "Admin"}
            data-testid="game_sidebar_button_nav_admin"
            type="button"
            onClick={() => onSelectNavItem("Admin")}
          >
            <ShieldCheck aria-hidden="true" size={18} />
            <span>Admin</span>
          </AppNavButton>
        ) : null}
        <AppNavButton
          $active={false}
          data-testid="game_sidebar_button_nav_settings"
          type="button"
          onClick={() => onSelectNavItem("Settings")}
        >
          <Cog aria-hidden="true" size={18} />
          <span>Settings</span>
        </AppNavButton>
        <AppNavButton
          type="button"
          $active={false}
          data-testid="game_sidebar_button_theme_toggle"
          onClick={onThemeToggle}
        >
          {theme === "dark" ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </AppNavButton>
      </AppSidebarActions>
    </AppSidebar>
  );
}

function AppSidebar(props: HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className="grid content-start gap-6 border-r-[3px] border-border bg-[linear-gradient(180deg,rgba(23,22,16,0.98),rgba(5,5,4,0.98)),var(--panel)] px-4 py-[22px] shadow-[inset_-2px_0_0_rgba(255,225,115,0.14)] max-[920px]:border-b-[3px] max-[920px]:border-r-0 max-[920px]:shadow-[inset_0_-2px_0_rgba(255,225,115,0.14)] max-[560px]:gap-3 max-[560px]:py-3 [grid-template-rows:auto_auto_1fr_auto]"
      {...props}
    />
  );
}

function AppBrand({
  children,
  isOpen,
  onToggle
}: {
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 text-primary-strong [text-shadow:0_1px_2px_#000] max-[560px]:flex-1">
      <button
        className="hidden min-h-[42px] w-full cursor-pointer items-center justify-between rounded-control border-2 border-border bg-panel-muted px-3 text-left font-extrabold text-primary-strong shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] max-[560px]:flex"
        data-testid="game_sidebar_button_mobile_nav_toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-primary-nav"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2.5">{children}</span>
        <ChevronDown
          aria-hidden="true"
          className={cx("transition-transform", isOpen && "rotate-180")}
          size={17}
        />
      </button>
      <div className="flex items-center gap-2.5 max-[560px]:hidden">{children}</div>
    </div>
  );
}

function MobileSidebarTop({ children }: { children: ReactNode }) {
  return (
    <div
      className="contents max-[560px]:flex max-[560px]:items-start max-[560px]:gap-2"
      data-testid="game_sidebar_div_mobile_top"
    >
      {children}
    </div>
  );
}

function AppNav({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  return (
    <nav
      className={cx(
        "grid gap-2 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1",
        !isOpen && "max-[560px]:hidden"
      )}
      id="mobile-primary-nav"
      data-testid="game_sidebar_nav_primary"
    >
      {children}
    </nav>
  );
}

function AppSidebarActions({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  return (
    <div
      className={cx(
        "grid self-end gap-2 border-t border-border pt-3.5 shadow-[inset_0_1px_0_rgba(255,225,115,0.08)] max-[560px]:self-auto max-[560px]:pt-3",
        !isOpen && "max-[560px]:hidden"
      )}
      data-testid="game_sidebar_div_actions"
    >
      {children}
    </div>
  );
}

type AppNavButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  $active: boolean;
};

function AppNavButton({ $active, children, className, ...props }: AppNavButtonProps) {
  return (
    <button
      className={cx(
        "flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-control border-2 px-3 text-left font-extrabold transition-colors hover:border-border hover:bg-panel-muted hover:text-foreground",
        $active
          ? "border-border bg-[linear-gradient(180deg,rgba(255,225,115,0.18),rgba(29,26,18,0.88))] text-foreground shadow-[inset_0_0_0_1px_rgba(255,225,115,0.18),0_0_14px_rgba(226,179,63,0.12)]"
          : "border-transparent bg-transparent text-text-muted",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
