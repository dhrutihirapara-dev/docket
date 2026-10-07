"use client";

import * as React from "react";
import {
  ALL_THEME_VARS,
  DARK_THEME_VARS,
  LIGHT_THEME_VARS,
  LS_APPEARANCE,
  LS_THEME,
} from "@/lib/theme-vars";

export interface ThemeContextType {
  appearanceMode: "light" | "dark" | "auto";
  cancelThemeSettings: () => void;
  currentTheme: string;
  savedAppearance: "light" | "dark" | "auto";
  savedTheme: string;
  saveThemeSettings: () => Promise<void>;
  setAppearance: (mode: "light" | "dark" | "auto") => void;
  setTheme: (theme: string) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined
);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialAppearanceMode: "light" | "dark" | "auto";
  initialTheme: string;
}

export function ThemeProvider({
  children,
  initialTheme,
  initialAppearanceMode,
}: ThemeProviderProps) {
  const [savedTheme, setSavedTheme] = React.useState(initialTheme);
  const [savedAppearance, setSavedAppearance] = React.useState<
    "light" | "dark" | "auto"
  >(initialAppearanceMode);
  const [currentTheme, setCurrentThemeState] = React.useState(initialTheme);
  const [appearanceMode, setAppearanceModeState] = React.useState<
    "light" | "dark" | "auto"
  >(initialAppearanceMode);

  // Layout effects (here and below) so a client-side navigation into the
  // portal (e.g. right after login) applies the theme before paint — a full
  // page load is already covered by theme-script.tsx.
  React.useLayoutEffect(() => {
    const localTheme = localStorage.getItem(LS_THEME);
    const localAppearance = localStorage.getItem(LS_APPEARANCE) as
      | "light"
      | "dark"
      | "auto"
      | null;
    const resolvedTheme = localTheme ?? initialTheme;
    const resolvedAppearance = localAppearance ?? initialAppearanceMode;
    setSavedTheme(resolvedTheme);
    setSavedAppearance(resolvedAppearance);
    setCurrentThemeState(resolvedTheme);
    setAppearanceModeState(resolvedAppearance);
  }, [initialTheme, initialAppearanceMode]);

  const applyThemeToDOM = React.useCallback(
    (theme: string, appearance: "light" | "dark" | "auto") => {
      if (typeof window === "undefined") {
        return;
      }
      const root = document.documentElement;

      let isDark = false;
      if (appearance === "dark") {
        isDark = true;
      } else if (appearance === "light") {
        isDark = false;
      } else {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      for (const key of ALL_THEME_VARS) {
        root.style.removeProperty(key);
      }

      const vars = isDark
        ? (DARK_THEME_VARS[theme] ?? DARK_THEME_VARS.default)
        : (LIGHT_THEME_VARS[theme] ?? LIGHT_THEME_VARS.default);

      for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value);
      }
    },
    []
  );

  React.useLayoutEffect(() => {
    applyThemeToDOM(currentTheme, appearanceMode);
    if (appearanceMode === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyThemeToDOM(currentTheme, "auto");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [currentTheme, appearanceMode, applyThemeToDOM]);

  const setTheme = React.useCallback(
    (theme: string) => setCurrentThemeState(theme),
    []
  );
  const setAppearance = React.useCallback(
    (mode: "light" | "dark" | "auto") => setAppearanceModeState(mode),
    []
  );

  const saveThemeSettings = React.useCallback(async () => {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: currentTheme, appearanceMode }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to save");
    }
    setSavedTheme(currentTheme);
    setSavedAppearance(appearanceMode);
    localStorage.setItem(LS_THEME, currentTheme);
    localStorage.setItem(LS_APPEARANCE, appearanceMode);
  }, [currentTheme, appearanceMode]);

  const cancelThemeSettings = React.useCallback(() => {
    setCurrentThemeState(savedTheme);
    setAppearanceModeState(savedAppearance);
  }, [savedTheme, savedAppearance]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        appearanceMode,
        setTheme,
        setAppearance,
        saveThemeSettings,
        cancelThemeSettings,
        savedTheme,
        savedAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
