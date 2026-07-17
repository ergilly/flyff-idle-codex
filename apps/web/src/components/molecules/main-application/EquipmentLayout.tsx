import Image from "next/image";
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { Character } from "@/lib/api";
import { cx } from "@/lib/classNames";

export type EquipmentFrame =
  | "left-1"
  | "left-2"
  | "left-3"
  | "left-4"
  | "left-5"
  | "right-1"
  | "right-2"
  | "right-3"
  | "right-4"
  | "right-5"
  | "jewel-1"
  | "jewel-2"
  | "jewel-3"
  | "jewel-4"
  | "jewel-5"
  | "bottom-1"
  | "bottom-2"
  | "bottom-3"
  | "bottom-4";

export type EquipmentSlotDefinition = {
  frame: EquipmentFrame;
  label: string;
  slot: keyof Character["equipment"];
};

export const equipmentSlots: EquipmentSlotDefinition[] = [
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

const equipmentFrameStyles: Record<EquipmentFrame, CSSProperties> = {
  "left-1": { top: "10.069444%", left: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "left-2": { top: "26.388889%", left: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "left-3": { top: "42.708333%", left: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "left-4": { top: "59.027778%", left: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "left-5": { top: "75.347222%", left: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "right-1": { top: "10.069444%", right: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "right-2": { top: "26.388889%", right: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "right-3": { top: "42.708333%", right: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "right-4": { top: "59.027778%", right: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "right-5": { top: "75.347222%", right: "4.296875%", width: "17.96875%", height: "15.972222%" },
  "jewel-1": { top: "10.069444%", left: "25.78125%", width: "9.375%", height: "8.333333%" },
  "jewel-2": { top: "10.069444%", left: "35.546875%", width: "9.375%", height: "8.333333%" },
  "jewel-3": { top: "10.069444%", left: "45.3125%", width: "9.375%", height: "8.333333%" },
  "jewel-4": { top: "10.069444%", left: "55.078125%", width: "9.375%", height: "8.333333%" },
  "jewel-5": { top: "10.069444%", left: "64.84375%", width: "9.375%", height: "8.333333%" },
  "bottom-1": { top: "80.555556%", left: "25%", width: "11.71875%", height: "10.416667%" },
  "bottom-2": { top: "80.555556%", left: "37.890625%", width: "11.71875%", height: "10.416667%" },
  "bottom-3": { top: "80.555556%", left: "50.78125%", width: "11.71875%", height: "10.416667%" },
  "bottom-4": { top: "80.555556%", left: "63.671875%", width: "11.71875%", height: "10.416667%" }
};

export function EquipmentSetSelector({
  activeEquipmentSet,
  onEquipmentSetChange
}: {
  activeEquipmentSet: number;
  onEquipmentSetChange?: (equipmentSet: number) => void;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-control border border-border bg-black/35 p-1"
      data-testid="equipment_div_set_selector"
    >
      {[0, 1, 2].map((equipmentSet) => {
        const isActive = activeEquipmentSet === equipmentSet;

        return (
          <button
            aria-label={`Equipment set ${equipmentSet + 1}`}
            aria-pressed={isActive}
            className={cx(
              "h-8 min-w-9 rounded-[4px] px-2 text-xs font-black transition-colors",
              isActive
                ? "bg-primary text-button-text"
                : "text-text-muted hover:bg-panel-muted hover:text-foreground"
            )}
            data-testid={`equipment_button_set_${equipmentSet}`}
            key={equipmentSet}
            onClick={() => onEquipmentSetChange?.(equipmentSet)}
            type="button"
          >
            {equipmentSet + 1}
          </button>
        );
      })}
    </div>
  );
}

export function EquipmentPanelFrame({ children }: { children: ReactNode }) {
  return (
    <section
      className="grid h-full content-start gap-4 rounded-card border-[3px] border-border bg-[linear-gradient(180deg,rgba(31,29,22,0.92),rgba(5,6,5,0.98)),var(--panel)] p-[18px] shadow-[inset_0_0_0_2px_rgba(255,225,115,0.16),inset_0_16px_30px_rgba(255,255,255,0.04),0_18px_38px_rgba(0,0,0,0.38)]"
      data-testid="equipment_section_panel"
    >
      {children}
    </section>
  );
}

export function EquipmentPanelContent({
  children,
  showItemDetails
}: {
  children: ReactNode;
  showItemDetails: boolean;
}) {
  return (
    <div
      className={cx(
        "grid items-start justify-start gap-4",
        showItemDetails
          ? "grid-cols-[minmax(280px,1fr)_minmax(220px,0.72fr)] max-[1500px]:grid-cols-1"
          : "grid-cols-1"
      )}
      data-testid="equipment_div_content"
    >
      {children}
    </div>
  );
}

export function EquipmentLayout({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="relative aspect-[8/9] w-full max-w-[560px] justify-self-center overflow-hidden rounded-card border-[3px] border-border bg-[radial-gradient(circle_at_50%_35%,rgba(255,230,119,0.08),transparent_30%),linear-gradient(180deg,rgba(26,25,19,0.98)_0%,rgba(4,4,3,0.99)_13%,rgba(0,0,0,1)_100%)] shadow-[inset_0_8px_0_rgba(255,255,255,0.08),inset_0_-8px_18px_rgba(0,0,0,0.72),0_18px_30px_rgba(0,0,0,0.34)]"
      data-testid="equipment_div_layout"
      {...props}
    >
      {children}
    </div>
  );
}

type EquipmentSlotProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  $equipped: boolean;
  $frame: EquipmentFrame;
  $selected: boolean;
  $twoHandedOccupied: boolean;
};

export function EquipmentSlot({
  $equipped,
  $frame,
  $selected,
  $twoHandedOccupied,
  children,
  className,
  style,
  ...props
}: EquipmentSlotProps) {
  return (
    <button
      className={cx(
        "absolute grid rounded-[5px] border-2 border-[rgba(118,107,73,0.72)] bg-[linear-gradient(180deg,rgba(12,12,10,0.94),rgba(0,0,0,0.98))] text-center text-[#f3d676] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.9),inset_0_0_12px_rgba(214,199,119,0.12),0_0_8px_rgba(0,0,0,0.56)] disabled:opacity-100",
        $equipped ? "cursor-pointer place-items-center p-0.5" : "cursor-default place-items-end p-[5px]",
        $selected &&
          "outline outline-1 -outline-offset-4 outline-[rgba(255,222,91,0.74)] shadow-[inset_0_0_18px_rgba(255,216,76,0.2)]",
        $equipped &&
          "hover:outline hover:outline-1 hover:-outline-offset-4 hover:outline-[rgba(255,222,91,0.74)] hover:shadow-[inset_0_0_18px_rgba(255,216,76,0.2)]",
        $twoHandedOccupied && "[&_img]:opacity-50",
        className
      )}
      data-frame={$frame}
      style={{ ...equipmentFrameStyles[$frame], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

export function EquipmentSlotLabel({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <span
      className="absolute h-px w-px overflow-hidden whitespace-nowrap text-[0.76rem] font-extrabold uppercase text-text-muted [clip-path:inset(50%)] [clip:rect(0_0_0_0)]"
      data-testid={testId}
    >
      {children}
    </span>
  );
}

export function EquipmentSlotIcon({
  alt,
  className,
  loading,
  src
}: {
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  src: string;
}) {
  return (
    <Image
      alt={alt}
      className={cx(
        "h-[92%] w-[92%] object-contain [filter:drop-shadow(0_2px_3px_rgba(0,0,0,0.72))]",
        className
      )}
      height={64}
      loading={loading}
      src={src}
      unoptimized
      width={64}
    />
  );
}

export function EquipmentSlotValue({
  $empty,
  children,
  testId
}: {
  $empty: boolean;
  children: ReactNode;
  testId: string;
}) {
  return (
    <strong
      className={cx(
        "max-w-full overflow-wrap-anywhere rounded-[3px] border border-[rgba(229,191,73,0.38)] bg-[rgba(0,0,0,0.62)] px-[5px] py-0.5 text-[0.72rem] leading-[1.15] text-[#f7e7a3] shadow-[0_0_12px_rgba(187,161,89,0.18)] [text-shadow:0_1px_2px_#000]",
        $empty && "opacity-0"
      )}
      data-testid={testId}
    >
      {children}
    </strong>
  );
}

export function ModelViewerReserved(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="pointer-events-none absolute left-[29%] top-[27%] grid h-[38%] w-[42%] place-items-center border-0 bg-transparent font-extrabold uppercase text-[rgba(205,208,177,0.26)]"
      data-testid="equipment_div_model_preview"
      {...props}
    />
  );
}
