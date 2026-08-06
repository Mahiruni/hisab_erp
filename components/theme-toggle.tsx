"use client";

import { useEffect } from "react";

const THEME_EVENT = "hisab:theme-change";

function lockLightTheme() {
  const root = document.documentElement;
  root.dataset.theme = "light";
  root.style.colorScheme = "light";

  try {
    window.localStorage.setItem("hisab-theme", "light");
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }

  document.cookie = "hisab_theme=light; Path=/; Max-Age=31536000; SameSite=Lax";
}

/**
 * Compatibility controller for any legacy call sites. Hisab has one permanent
 * light appearance and renders no light/dark control.
 */
export function ThemeToggle() {
  useEffect(() => {
    lockLightTheme();

    const keepLightTheme = () => {
      if (document.documentElement.dataset.theme !== "light") lockLightTheme();
    };

    window.addEventListener("storage", keepLightTheme);
    window.addEventListener(THEME_EVENT, keepLightTheme);

    return () => {
      window.removeEventListener("storage", keepLightTheme);
      window.removeEventListener(THEME_EVENT, keepLightTheme);
    };
  }, []);

  return null;
}
