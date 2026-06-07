"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/classNames";

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
    <button
      className="absolute right-[18px] top-[18px] inline-flex min-h-[38px] cursor-pointer items-center gap-2.5 rounded-full border border-border bg-panel-shell py-[5px] pl-1.5 pr-3 font-extrabold text-foreground shadow-toggle max-[560px]:static max-[560px]:mb-4 max-[560px]:justify-self-end"
      type="button"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-pressed={theme === "light"}
      onClick={handleToggle}
    >
      <span className="h-[26px] w-12 rounded-full border border-border bg-panel-muted p-0.5" aria-hidden="true">
        <span
          className={cx(
            "block h-5 w-5 rounded-full bg-accent transition-transform duration-150",
            theme === "light" && "translate-x-[22px]"
          )}
        />
      </span>
      <span className="min-w-[38px] text-[0.85rem]">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
