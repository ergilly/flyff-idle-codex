import {
  Backpack,
  ChevronDown,
  CircleUserRound,
  Cog,
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

export const navItems = [
  { label: "Character Page", icon: CircleUserRound },
  { label: "Inventory", icon: Backpack },
  { label: "Map", icon: Map },
  { label: "Combat", icon: Swords },
  { label: "Upgrading", icon: Sparkles }
];

export type MainApplicationNavItem = (typeof navItems)[number]["label"] | "Settings";
export type MainApplicationTheme = "dark" | "light";

type MainApplicationSidebarProps = {
  activeNavItem: string;
  characterName: string;
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
    <AppSidebar aria-label="Primary navigation">
      <MobileSidebarTop>
        <AppBrand isOpen={isMobileNavOpen} onToggle={onToggleMobileNav}>
          <Shield aria-hidden="true" size={24} />
          <strong>Flyff Idle</strong>
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
            type="button"
            onClick={() => onSelectNavItem(label)}
          >
            <Icon aria-hidden="true" size={18} />
            <span>{label}</span>
          </AppNavButton>
        ))}
      </AppNav>
      <AppSidebarActions isOpen={isMobileNavOpen}>
        <AppNavButton $active={false} type="button" onClick={() => onSelectNavItem("Settings")}>
          <Cog aria-hidden="true" size={18} />
          <span>Settings</span>
        </AppNavButton>
        <AppNavButton type="button" $active={false} onClick={onThemeToggle}>
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
      className="grid content-start gap-6 border-r border-border bg-panel px-4 py-[22px] max-[920px]:border-b max-[920px]:border-r-0 max-[560px]:gap-3 max-[560px]:py-3 [grid-template-rows:auto_auto_1fr_auto]"
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
    <div className="flex items-center gap-2.5 text-primary-strong max-[560px]:flex-1">
      <button
        className="hidden min-h-[42px] w-full cursor-pointer items-center justify-between rounded-control border border-border bg-panel-muted px-3 text-left font-extrabold text-primary-strong max-[560px]:flex"
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-primary-nav"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2.5">{children}</span>
        <ChevronDown aria-hidden="true" className={cx("transition-transform", isOpen && "rotate-180")} size={17} />
      </button>
      <div className="flex items-center gap-2.5 max-[560px]:hidden">{children}</div>
    </div>
  );
}

function MobileSidebarTop({ children }: { children: ReactNode }) {
  return <div className="contents max-[560px]:flex max-[560px]:items-start max-[560px]:gap-2">{children}</div>;
}

function AppNav({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  return (
    <nav
      className={cx("grid gap-2 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1", !isOpen && "max-[560px]:hidden")}
      id="mobile-primary-nav"
    >
      {children}
    </nav>
  );
}

function AppSidebarActions({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  return (
    <div
      className={cx(
        "grid self-end gap-2 border-t border-border pt-3.5 max-[560px]:self-auto max-[560px]:pt-3",
        !isOpen && "max-[560px]:hidden"
      )}
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
        "flex min-h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-control border px-3 text-left font-extrabold hover:border-border hover:bg-panel-muted hover:text-foreground",
        $active ? "border-border bg-panel-muted text-foreground" : "border-transparent bg-transparent text-text-muted",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
