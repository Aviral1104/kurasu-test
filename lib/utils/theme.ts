import type { Rank } from "./ranks";

export type ThemeId =
  | "shadow-purple"
  | "monarch-blue"
  | "flame-red"
  | "void-black"
  | "emerald-hunter"
  | "gold-sovereign"
  | "cyber-pink";

export interface Theme {
  id: ThemeId;
  name: string;
  lore: string;
  bgImage: string | null;      // path to /public image, null = CSS gradient only
  bgOverlay: string;           // gradient overlay on top of bg image
  bgPrimary: string;
  bgSidebar: string;
  bgCard: string;
  bgCardHover: string;
  accent: string;
  accentBright: string;
  accentGlow: string;
  accentSubtle: string;
  border: string;
  preview: [string, string, string];
}

export const THEMES: Record<ThemeId, Theme> = {
  "shadow-purple": {
    id: "shadow-purple",
    name: "Shadow Purple",
    lore: "Faithful to the Solo Leveling manga palette. Dark navy base, violet accent.",
    bgImage: "/bg-dungeon.png",
    bgOverlay: "linear-gradient(180deg,rgba(12,12,20,0.45) 0%,rgba(12,12,20,0.30) 40%,rgba(12,12,20,0.50) 100%)",
    bgPrimary: "#0c0c14",
    bgSidebar: "#0d0d18",
    bgCard: "#13131f",
    bgCardHover: "#1a1a2e",
    accent: "#7c3aed",
    accentBright: "#a78bfa",
    accentGlow: "rgba(124,58,237,0.40)",
    accentSubtle: "rgba(124,58,237,0.12)",
    border: "#2d2d44",
    preview: ["#0c0c14", "#7c3aed", "#a78bfa"],
  },
  "monarch-blue": {
    id: "monarch-blue",
    name: "Monarch Blue",
    lore: "Ice blue and silver — the Frost Monarch arc. Clean, cold, elite.",
    bgImage: "/bg-monarch.png",
    bgOverlay: "linear-gradient(180deg,rgba(6,12,24,0.40) 0%,rgba(6,12,24,0.25) 40%,rgba(6,12,24,0.45) 100%)",
    bgPrimary: "#060c18",
    bgSidebar: "#070d1c",
    bgCard: "#0d1628",
    bgCardHover: "#111e35",
    accent: "#1d6fa5",
    accentBright: "#7dd3fc",
    accentGlow: "rgba(29,111,165,0.40)",
    accentSubtle: "rgba(29,111,165,0.12)",
    border: "#1a2e44",
    preview: ["#060c18", "#1d6fa5", "#7dd3fc"],
  },
  "flame-red": {
    id: "flame-red",
    name: "Flame Red",
    lore: "Deep dark crimson and amber — the Beast Monarch. For hunters who grind hard.",
    bgImage: "/bg-flame.png",
    bgOverlay: "linear-gradient(180deg,rgba(15,5,5,0.45) 0%,rgba(15,5,5,0.30) 40%,rgba(15,5,5,0.50) 100%)",
    bgPrimary: "#0f0505",
    bgSidebar: "#120606",
    bgCard: "#1c0a0a",
    bgCardHover: "#221010",
    accent: "#dc2626",
    accentBright: "#f59e0b",
    accentGlow: "rgba(220,38,38,0.40)",
    accentSubtle: "rgba(220,38,38,0.12)",
    border: "#3a1010",
    preview: ["#0f0505", "#dc2626", "#f59e0b"],
  },
  "void-black": {
    id: "void-black",
    name: "Void Black",
    lore: "Pure black, barely-there teal — late-game Sung Jin-Woo energy. Most minimal.",
    bgImage: "/bg-void.png",
    bgOverlay: "linear-gradient(180deg,rgba(5,5,5,0.40) 0%,rgba(5,5,5,0.25) 40%,rgba(5,5,5,0.45) 100%)",
    bgPrimary: "#050505",
    bgSidebar: "#080808",
    bgCard: "#0e0e0e",
    bgCardHover: "#141414",
    accent: "#0d9488",
    accentBright: "#5eead4",
    accentGlow: "rgba(13,148,136,0.40)",
    accentSubtle: "rgba(13,148,136,0.12)",
    border: "#1a1a1a",
    preview: ["#050505", "#0d9488", "#5eead4"],
  },
  "emerald-hunter": {
    id: "emerald-hunter",
    name: "Emerald Hunter",
    lore: "Dark forest realm with emerald moon. The Hunter hidden in the deep wild.",
    bgImage: "/bg-emerald.png",
    bgOverlay: "linear-gradient(180deg,rgba(4,13,6,0.45) 0%,rgba(4,13,6,0.25) 40%,rgba(4,13,6,0.50) 100%)",
    bgPrimary: "#040d06",
    bgSidebar: "#061009",
    bgCard: "#0a1a0d",
    bgCardHover: "#0f2214",
    accent: "#16a34a",
    accentBright: "#4ade80",
    accentGlow: "rgba(22,163,74,0.40)",
    accentSubtle: "rgba(22,163,74,0.12)",
    border: "#143a1e",
    preview: ["#040d06", "#16a34a", "#4ade80"],
  },
  "gold-sovereign": {
    id: "gold-sovereign",
    name: "Gold Sovereign",
    lore: "Ancient Egyptian ruin drenched in gold. Reserved for those who have conquered all gates.",
    bgImage: "/bg-gold.png",
    bgOverlay: "linear-gradient(180deg,rgba(14,9,0,0.45) 0%,rgba(14,9,0,0.30) 40%,rgba(14,9,0,0.50) 100%)",
    bgPrimary: "#0e0900",
    bgSidebar: "#120b00",
    bgCard: "#1c1200",
    bgCardHover: "#251800",
    accent: "#d97706",
    accentBright: "#fbbf24",
    accentGlow: "rgba(217,119,6,0.40)",
    accentSubtle: "rgba(217,119,6,0.12)",
    border: "#3d2200",
    preview: ["#0e0900", "#d97706", "#fbbf24"],
  },
  "cyber-pink": {
    id: "cyber-pink",
    name: "Cyber Pink",
    lore: "Neon magenta meets dark ruins. For hunters who break the rules of reality.",
    bgImage: null,
    bgOverlay: "linear-gradient(135deg,rgba(26,0,48,0.40) 0%,rgba(60,0,90,0.25) 40%,rgba(26,0,48,0.50) 100%)",
    bgPrimary: "#0d0018",
    bgSidebar: "#120024",
    bgCard: "#1e003a",
    bgCardHover: "#2a0052",
    accent: "#db2777",
    accentBright: "#f472b6",
    accentGlow: "rgba(219,39,119,0.50)",
    accentSubtle: "rgba(219,39,119,0.15)",
    border: "#4a003d",
    preview: ["#0d0018", "#db2777", "#f472b6"],
  },
};

export const THEME_STORAGE_KEY = "kurasu_theme";
export const DEFAULT_THEME: ThemeId = "shadow-purple";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Core vars
  root.style.setProperty("--bg-primary",    theme.bgPrimary);
  root.style.setProperty("--bg-sidebar",    theme.bgSidebar);
  root.style.setProperty("--bg-card",       theme.bgCard);
  root.style.setProperty("--bg-card-hover", theme.bgCardHover);
  root.style.setProperty("--accent",        theme.accent);
  root.style.setProperty("--accent-bright", theme.accentBright);
  root.style.setProperty("--accent-glow",   theme.accentGlow);
  root.style.setProperty("--accent-subtle", theme.accentSubtle);
  root.style.setProperty("--border",        theme.border);
  // Pixel palette aliases
  root.style.setProperty("--px-purple2",    theme.accent);
  root.style.setProperty("--px-purple3",    theme.accentBright);
  root.style.setProperty("--px-shadow",     theme.bgSidebar);
  root.style.setProperty("--px-bg",         theme.bgPrimary);
  root.style.setProperty("--px-bg2",        theme.bgCard);
  root.style.setProperty("--px-bg3",        theme.bgSidebar);
  root.style.setProperty("--px-border",     theme.border);

  // Background image on body
  const body = document.body;
  if (theme.bgImage) {
    body.style.backgroundImage = `${theme.bgOverlay}, url('${theme.bgImage}')`;
  } else {
    body.style.backgroundImage = theme.bgOverlay;
  }

  // Store current theme id for sidebar to read
  root.setAttribute("data-theme", theme.id);
}

export function getSavedThemeId(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || DEFAULT_THEME;
}
