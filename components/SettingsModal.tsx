"use client";

import { useState } from "react";
import { THEMES, type ThemeId, applyTheme, THEME_STORAGE_KEY } from "@/lib/utils/theme";
import { X, Check } from "lucide-react";

interface Props { onClose: () => void }

export default function SettingsModal({ onClose }: Props) {
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeId) || "shadow-purple";
    }
    return "shadow-purple";
  });

  function selectTheme(id: ThemeId) {
    setActiveTheme(id);
    applyTheme(THEMES[id]);
    localStorage.setItem(THEME_STORAGE_KEY, id);
  }

  const themeList = Object.values(THEMES);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", zIndex: 1000 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1001,
        width: "min(640px, calc(100vw - 32px))",
        background: "#13131f",
        border: "3px solid var(--accent, #7c3aed)",
        boxShadow: "8px 8px 0 rgba(0,0,0,0.6), inset 0 0 30px rgba(124,58,237,0.04)",
        padding: "24px 24px 28px",
        animation: "pxSlideUp 0.25s ease-out forwards",
        maxHeight: "88vh",
        overflowY: "auto",
      }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "3px", color: "#4a4760", marginBottom: 5 }}>
              SYSTEM INTERFACE · CONFIGURATION
            </p>
            <h2 style={{
              fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 900,
              color: "#e8e6f0", letterSpacing: "2px", textTransform: "uppercase",
            }}>
              ▸ System Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "2px solid #2d2d44", cursor: "pointer",
              color: "#6b6880", width: 32, height: 32, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; (e.currentTarget as HTMLElement).style.borderColor = "#dc2626"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#6b6880"; (e.currentTarget as HTMLElement).style.borderColor = "#2d2d44"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Theme section header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ height: 2, flex: 1, background: "repeating-linear-gradient(90deg,#2d2d44 0,#2d2d44 4px,transparent 4px,transparent 8px)" }} />
          <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "3px", color: "#6b6880", whiteSpace: "nowrap" }}>
            ■ HUNTER AURA THEME
          </p>
          <div style={{ height: 2, flex: 1, background: "repeating-linear-gradient(90deg,#2d2d44 0,#2d2d44 4px,transparent 4px,transparent 8px)" }} />
        </div>

        {/* ── Theme grid — 3 columns ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 26 }}>
          {themeList.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                style={{
                  position: "relative", overflow: "hidden",
                  background: isActive ? `${theme.accent}14` : "#0d0d18",
                  border: `2px solid ${isActive ? theme.accent : "#2d2d44"}`,
                  boxShadow: isActive
                    ? `0 0 12px ${theme.accentGlow}, 3px 3px 0 rgba(0,0,0,0.5)`
                    : "3px 3px 0 rgba(0,0,0,0.4)",
                  padding: "12px 12px 10px",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = theme.accent + "80"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = "#2d2d44"; }}
              >
                {/* Top stripe */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `repeating-linear-gradient(90deg, ${theme.accent} 0, ${theme.accent} 4px, ${theme.accentBright} 4px, ${theme.accentBright} 8px)`,
                }} />

                {/* Colour swatches + active check */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, marginTop: 2 }}>
                  {theme.preview.map((c, i) => (
                    <div key={i} style={{
                      width: i === 0 ? 22 : 14, height: 12,
                      background: c, border: `1px solid ${c}70`, flexShrink: 0,
                    }} />
                  ))}
                  {isActive && (
                    <div style={{ marginLeft: "auto" }}>
                      <Check size={12} color={theme.accent} />
                    </div>
                  )}
                </div>

                {/* Name */}
                <p style={{
                  fontFamily: "monospace", fontSize: 10, fontWeight: 700,
                  color: isActive ? theme.accentBright : "#c4b5fd",
                  letterSpacing: "1.5px", marginBottom: 4, textTransform: "uppercase",
                }}>
                  {theme.name}
                </p>

                {/* Lore */}
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: 10,
                  color: "#5a5778", lineHeight: 1.45,
                }}>
                  {theme.lore}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── System parameters header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ height: 2, flex: 1, background: "repeating-linear-gradient(90deg,#2d2d44 0,#2d2d44 4px,transparent 4px,transparent 8px)" }} />
          <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "3px", color: "#6b6880", whiteSpace: "nowrap" }}>
            ■ SYSTEM PARAMETERS
          </p>
          <div style={{ height: 2, flex: 1, background: "repeating-linear-gradient(90deg,#2d2d44 0,#2d2d44 4px,transparent 4px,transparent 8px)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            { label: "NOTIFICATION SOUNDS", desc: "Play a chime when a quest completes" },
            { label: "REDUCED MOTION",      desc: "Disable ceremony animations" },
            { label: "AUTO-ADVANCE VIDEOS", desc: "Mark complete and scroll to next" },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "11px 0",
              borderBottom: i < arr.length - 1 ? "1px solid #1a1a2e" : "none",
            }}>
              <div>
                <p style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#6b6880", letterSpacing: "1px", marginBottom: 2 }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 11, color: "#4a4760", fontFamily: "var(--font-body)" }}>{s.desc}</p>
              </div>
              <span style={{ fontSize: 9, fontFamily: "monospace", color: "#3a3858", padding: "3px 8px", border: "1px solid #2d2d44", letterSpacing: "1px" }}>
                PHASE II
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
