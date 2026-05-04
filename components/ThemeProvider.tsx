"use client";

import { useEffect } from "react";
import { THEMES, getSavedThemeId, applyTheme } from "@/lib/utils/theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const id = getSavedThemeId();
    applyTheme(THEMES[id]);
  }, []);
  return <>{children}</>;
}
