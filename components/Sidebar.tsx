"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useState, useEffect } from "react";
import SettingsModal from "@/components/SettingsModal";
import { LayoutGrid, Layers, CheckSquare, User, Settings, LogOut, Skull, Brain } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { isDue, ShadowDoc } from "@/lib/utils/shadows";

const NAV_ITEMS = [
  { icon: LayoutGrid,  href: "/dashboard", label: "CMD CENTER",    shortcut: "01" },
  { icon: Layers,      href: "/dungeons",  label: "DUNGEONS",      shortcut: "02" },
  { icon: Brain,       href: "/quests",    label: "QUIZ ARENA",    shortcut: "03", badge: false },
  { icon: Skull,       href: "/shadows",   label: "SHADOW ARMY",  shortcut: "04", badge: true },
  { icon: User,        href: "/profile",   label: "HUNTER",        shortcut: "05" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [dueShadows, setDueShadows] = useState(0);

  // Listen to shadows due count
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "shadows");
    const unsub = onSnapshot(ref, (snap) => {
      const due = snap.docs.filter((d) => isDue(d.data() as ShadowDoc)).length;
      setDueShadows(due);
    });
    return unsub;
  }, [user]);

  return (
    <>
      <aside
        style={{
          position: "fixed",
          top: 0, left: 0,
          height: "100vh",
          width: 64,
          background: "var(--bg-sidebar, #0d0d18)",
          borderRight: "2px solid var(--border, #2d2d44)",
          boxShadow: "4px 0 0 rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 16,
          paddingBottom: 16,
          zIndex: 100,
          transition: "background 0.4s ease, border-color 0.4s ease",
        }}
      >
        {/* Logo mark */}
        <Link
          href="/dashboard"
          style={{
            width: 38, height: 38,
            background: "var(--accent, #7c3aed)",
            border: "2px solid var(--accent-bright, #a78bfa)",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            flexShrink: 0,
            textDecoration: "none",
            transition: "transform 0.08s, box-shadow 0.08s, background 0.4s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translate(-1px,-1px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 rgba(0,0,0,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0 rgba(0,0,0,0.5)";
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 900, color: "white", letterSpacing: "-1px" }}>K</span>
        </Link>

        {/* Pixel dashes separator */}
        <div style={{ width: 36, height: 2, background: "repeating-linear-gradient(90deg,var(--border,#2d2d44) 0,var(--border,#2d2d44) 3px,transparent 3px,transparent 6px)", marginBottom: 18 }} />

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(({ icon: Icon, href, label, badge }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            const showBadge = badge && dueShadows > 0;
            return (
              <div
                key={href}
                style={{ position: "relative" }}
                onMouseEnter={() => setTooltip(label)}
                onMouseLeave={() => setTooltip(null)}
              >
                <Link
                  href={href}
                  style={{
                    width: 40, height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    background: isActive ? "var(--accent-subtle, rgba(124,58,237,0.20))" : "transparent",
                    color: isActive ? "var(--accent-bright, #a78bfa)" : "#6b6880",
                    border: isActive ? "2px solid var(--accent, #7c3aed)" : "2px solid transparent",
                    boxShadow: isActive ? "2px 2px 0 rgba(0,0,0,0.4)" : "none",
                    transition: "all 0.08s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "var(--accent-subtle, rgba(124,58,237,0.12))";
                      (e.currentTarget as HTMLElement).style.color = "var(--accent-bright, #a78bfa)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--accent, #7c3aed)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#6b6880";
                      (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }
                  }}
                >
                  <Icon size={18} />
                  {/* Badge for due shadows */}
                  {showBadge && (
                    <div style={{
                      position: "absolute", top: 2, right: 2,
                      width: 14, height: 14,
                      background: "#f59e0b",
                      border: "2px solid #0d0d18",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "monospace", fontSize: 8, fontWeight: 700, color: "#000",
                      lineHeight: 1,
                    }}>
                      {dueShadows > 9 ? "9+" : dueShadows}
                    </div>
                  )}
                </Link>

                {/* Tooltip */}
                {tooltip === label && (
                  <div style={{
                    position: "absolute",
                    left: 50, top: "50%", transform: "translateY(-50%)",
                    background: "var(--bg-card, #13131f)",
                    border: "2px solid var(--accent, #7c3aed)",
                    boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
                    padding: "4px 10px",
                    fontFamily: "monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "2px",
                    color: "var(--accent-bright, #a78bfa)",
                    whiteSpace: "nowrap",
                    zIndex: 200,
                    pointerEvents: "none",
                  }}>
                    {label}
                    {showBadge && (
                      <span style={{ marginLeft: 6, color: "#f59e0b" }}>({dueShadows} DUE)</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pixel dashes separator */}
        <div style={{ width: 36, height: 2, background: "repeating-linear-gradient(90deg,var(--border,#2d2d44) 0,var(--border,#2d2d44) 3px,transparent 3px,transparent 6px)", marginBottom: 10 }} />

        {/* Bottom actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { icon: Settings, label: "SETTINGS", action: () => setShowSettings(true), hoverColor: "#a78bfa", hoverBg: "rgba(124,58,237,0.15)" },
            { icon: LogOut,   label: "SIGN OUT",  action: signOut,                     hoverColor: "#dc2626", hoverBg: "rgba(220,38,38,0.12)"   },
          ].map(({ icon: Icon, label, action, hoverColor, hoverBg }) => (
            <div
              key={label}
              style={{ position: "relative" }}
              onMouseEnter={() => setTooltip(label)}
              onMouseLeave={() => setTooltip(null)}
            >
              <button
                onClick={action}
                title={label}
                style={{
                  width: 40, height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "transparent",
                  border: "2px solid transparent",
                  color: "#6b6880",
                  cursor: "pointer",
                  transition: "all 0.08s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = hoverBg;
                  (e.currentTarget as HTMLElement).style.color = hoverColor;
                  (e.currentTarget as HTMLElement).style.borderColor = hoverColor + "44";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#6b6880";
                  (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                }}
              >
                <Icon size={17} />
              </button>
              {tooltip === label && (
                <div style={{
                  position: "absolute",
                  left: 50, top: "50%", transform: "translateY(-50%)",
                  background: "var(--bg-card, #13131f)",
                  border: "2px solid var(--accent, #7c3aed)",
                  boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
                  padding: "4px 10px",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "2px",
                  color: "var(--accent-bright, #a78bfa)",
                  whiteSpace: "nowrap",
                  zIndex: 200,
                  pointerEvents: "none",
                }}>
                  {label}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
