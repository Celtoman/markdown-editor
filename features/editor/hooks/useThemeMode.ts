import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_COOKIE_KEY = "markdown-editor-theme";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const setCookie = (
  name: string,
  value: string,
  maxAgeSeconds = 60 * 60 * 24 * 365,
) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

export const useThemeMode = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = getCookie(THEME_COOKIE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "system";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const useDark =
        themeMode === "dark" || (themeMode === "system" && mediaQuery.matches);
      document.documentElement.classList.toggle("dark", useDark);
      document.documentElement.style.colorScheme = useDark ? "dark" : "light";
    };

    applyTheme();
    setCookie(THEME_COOKIE_KEY, themeMode);

    const handleSystemThemeChange = () => {
      if (themeMode === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [themeMode]);

  return [themeMode, setThemeMode] as const;
};
