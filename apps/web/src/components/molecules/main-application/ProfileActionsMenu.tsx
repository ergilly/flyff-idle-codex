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
    <ProfileMenu role="menu">
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
  return <div className="relative flex-none max-[560px]:hidden">{children}</div>;
}

function ProfileButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="flex min-h-[42px] cursor-pointer items-center gap-2 rounded-control border border-border bg-panel px-3 font-extrabold text-foreground max-[560px]:w-full max-[560px]:items-stretch"
      {...props}
    />
  );
}

function MobileProfileMenu({ children }: { children: ReactNode }) {
  return <div className="relative hidden flex-none max-[560px]:block">{children}</div>;
}

function ProfileIconButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="grid h-[42px] w-[42px] cursor-pointer place-items-center rounded-control border border-border bg-panel-muted text-foreground"
      {...props}
    />
  );
}

function ProfileMenu(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="absolute right-0 top-[calc(100%+8px)] z-10 grid w-[230px] rounded-card border border-border bg-panel p-2 shadow-menu max-[560px]:w-[220px]"
      {...props}
    />
  );
}
