"use client";

import { useEffect, useState } from "react";
import { borders, colors, radii, shadows, spacing, typography } from "@/styles/tokens";

type Theme = "dark" | "light";

const storageKey = "flyffIdleTheme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  return localStorage.getItem(storageKey) === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(storageKey, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const storedTheme = getStoredTheme();
    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <>
      <button
        className="theme-toggle"
        type="button"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-pressed={theme === "light"}
        onClick={handleToggle}
      >
        <span className="theme-toggle-track" aria-hidden="true">
          <span className="theme-toggle-thumb" />
        </span>
        <span className="theme-toggle-label">{theme === "dark" ? "Dark" : "Light"}</span>
      </button>
      <style>{`
        .theme-toggle {
          position: absolute;
          top: 18px;
          right: 18px;
          display: inline-flex;
          align-items: center;
          gap: ${spacing.md};
          min-height: 38px;
          border: ${borders.default};
          border-radius: ${radii.pill};
          padding: 5px ${spacing.lg} 5px ${spacing.xs};
          background: ${colors.panelShell};
          color: ${colors.foreground};
          cursor: pointer;
          font-weight: ${typography.weightHeavy};
          box-shadow: ${shadows.toggle};
        }

        .theme-toggle-track {
          width: 48px;
          height: 26px;
          border: ${borders.default};
          border-radius: ${radii.pill};
          background: ${colors.panelMuted};
          padding: ${spacing.px1};
        }

        .theme-toggle-thumb {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: ${radii.round};
          background: ${colors.accent};
          transform: translateX(0);
          transition: transform 160ms ease;
        }

        [data-theme="light"] .theme-toggle-thumb {
          transform: translateX(22px);
        }

        .theme-toggle-label {
          min-width: 38px;
          font-size: ${typography.labelSize};
        }

        @media (max-width: 560px) {
          .theme-toggle {
            position: static;
            justify-self: end;
            margin-bottom: ${spacing["2xl"]};
          }
        }
      `}</style>
    </>
  );
}
