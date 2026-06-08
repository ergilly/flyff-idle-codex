import { CircleUserRound, ChevronDown, LogOut, UserPlus } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { ProfileMenuButton } from "@/components/atoms/main-application/ProfileMenuButton";

type ProfileActionsMenuProps = {
  characterName: string;
  isOpen: boolean;
  onChangeCharacter: () => void;
  onLogout: () => void;
  onToggle: () => void;
  variant?: "desktop" | "mobile";
};

export function ProfileActionsMenu({
  characterName,
  isOpen,
  onChangeCharacter,
  onLogout,
  onToggle,
  variant = "desktop"
}: ProfileActionsMenuProps) {
  const menu = isOpen ? (
    <ProfileMenu role="menu" variant={variant}>
      <ProfileMenuButton type="button" role="menuitem" onClick={onChangeCharacter}>
        <UserPlus aria-hidden="true" size={17} />
        Change character
      </ProfileMenuButton>
      <ProfileMenuButton type="button" role="menuitem" onClick={onLogout}>
        <LogOut aria-hidden="true" size={17} />
        Log out
      </ProfileMenuButton>
    </ProfileMenu>
  ) : null;

  if (variant === "mobile") {
    return (
      <MobileProfileMenu>
        <ProfileIconButton
          type="button"
          aria-label={`${characterName} profile menu`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={onToggle}
        >
          <CircleUserRound aria-hidden="true" size={20} />
        </ProfileIconButton>
        {menu}
      </MobileProfileMenu>
    );
  }

  return (
    <ProfileMenuWrap>
      <ProfileButton type="button" aria-expanded={isOpen} aria-haspopup="menu" onClick={onToggle}>
        <CircleUserRound aria-hidden="true" size={20} />
        <span>{characterName}</span>
        <ChevronDown aria-hidden="true" size={16} />
      </ProfileButton>
      {menu}
    </ProfileMenuWrap>
  );
}

function ProfileMenuWrap({ children }: { children: ReactNode }) {
  return <div className="relative z-[1001] flex-none max-[560px]:hidden">{children}</div>;
}

function ProfileButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex min-h-[42px] cursor-pointer items-center gap-2 rounded-control border-2 border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.9),rgba(9,10,8,0.96))] px-3 font-extrabold text-foreground shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)] max-[560px]:w-full max-[560px]:items-stretch"
      {...props}
    />
  );
}

function MobileProfileMenu({ children }: { children: ReactNode }) {
  return <div className="relative z-40 hidden flex-none max-[560px]:block">{children}</div>;
}

function ProfileIconButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="grid h-[42px] w-[42px] cursor-pointer place-items-center rounded-control border-2 border-border bg-panel-muted text-foreground shadow-[inset_0_0_0_1px_rgba(255,225,115,0.1)]"
      {...props}
    />
  );
}

type ProfileMenuProps = HTMLAttributes<HTMLDivElement> & {
  variant: "desktop" | "mobile";
};

function ProfileMenu({ variant, ...props }: ProfileMenuProps) {
  return (
    <div
      className={
        variant === "mobile"
          ? "absolute right-0 top-[calc(100%+8px)] z-[1002] grid w-[220px] rounded-card border-2 border-border bg-panel p-2 shadow-menu"
          : "absolute right-0 top-[calc(100%+8px)] z-[1002] grid w-[230px] rounded-card border-2 border-border bg-panel p-2 shadow-menu"
      }
      {...props}
    />
  );
}
