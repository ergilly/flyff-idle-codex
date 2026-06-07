export const colors = {
  accent: "var(--accent)",
  background: "var(--background)",
  border: "var(--border)",
  buttonText: "var(--button-text)",
  danger: "var(--danger)",
  dangerPanel: "var(--danger-panel)",
  foreground: "var(--foreground)",
  panel: "var(--panel)",
  panelElevated: "var(--panel-elevated)",
  panelMuted: "var(--panel-muted)",
  panelShell: "var(--panel-shell)",
  primary: "var(--primary)",
  primaryStrong: "var(--primary-strong)",
  textMuted: "var(--text-muted)",
  transparent: "transparent"
} as const;

export const rarityColors = {
  common: "#5fb3ff",
  uncommon: "#64d875",
  rare: "#f5d451",
  veryRare: "#ff6464",
  unique: "#c27bff"
} as const;

export const equipmentColors = {
  goldText: "#f3d676",
  goldTextStrong: "#f7e7a3",
  goldBorder: "rgba(229, 191, 73, 0.38)",
  goldBorderMuted: "rgba(187, 161, 89, 0.45)",
  goldBorderStrong: "rgba(187, 161, 89, 0.58)",
  goldBorderFaint: "rgba(187, 161, 89, 0.18)",
  goldBorderSoft: "rgba(187, 161, 89, 0.22)",
  goldGlow: "rgba(255, 216, 76, 0.1)",
  goldShellGlow: "rgba(255, 225, 115, 0.08)",
  goldGlowStrong: "rgba(255, 216, 76, 0.2)",
  goldOutline: "rgba(255, 222, 91, 0.74)",
  darkGlass: "rgba(0, 0, 0, 0.62)",
  itemDescription: "#d6cfb2",
  modelPlaceholder: "rgba(205, 208, 177, 0.26)",
  awakeningAvailable: "rgba(3, 54, 223, 0.72)"
} as const;

export const overlayColors = {
  modalBackdrop: "rgba(8, 12, 18, 0.72)",
  darkPanelStart: "rgba(13, 13, 11, 0.94)",
  darkPanelEnd: "rgba(5, 6, 5, 0.98)",
  primaryBorderSoft: "rgba(88, 166, 201, 0.34)",
  primaryPanelSoft: "rgba(88, 166, 201, 0.12)"
} as const;

export const spacing = {
  px1: "2px",
  px2: "4px",
  xs: "6px",
  sm: "8px",
  md: "10px",
  lg: "12px",
  xl: "14px",
  "2xl": "16px",
  "3xl": "18px",
  "4xl": "22px",
  "5xl": "24px",
  "6xl": "28px",
  "7xl": "32px"
} as const;

export const radii = {
  xs: "3px",
  sm: "6px",
  md: "8px",
  pill: "999px",
  round: "50%"
} as const;

export const typography = {
  eyebrowSize: "0.78rem",
  labelSize: "0.85rem",
  fieldLabelSize: "0.9rem",
  bodyLineHeight: 1.55,
  titleLineHeight: 1.1,
  weightBold: 700,
  weightHeavy: 800
} as const;

export const shadows = {
  shell: "0 22px 70px var(--shell-shadow)",
  menu: "0 18px 45px var(--shell-shadow)",
  toggle: "0 12px 30px var(--shell-shadow)"
} as const;

export const outlines = {
  focusPrimary: "2px solid rgba(88, 166, 201, 0.28)",
  focusPrimaryStrong: "2px solid rgba(88, 166, 201, 0.35)"
} as const;

export const borders = {
  default: `1px solid ${colors.border}`,
  transparent: "1px solid transparent",
  dangerLeft: `4px solid ${colors.danger}`
} as const;
