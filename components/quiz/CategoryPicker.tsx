"use client";
import Image from "next/image";

export const QUIZ_CATEGORIES = [
  { id: "programming", label: "PROGRAMMING / CS",         thumb: "/cat-programming.png", color: "#a855f7", glow: "rgba(168,85,247,0.45)"  },
  { id: "data",        label: "DATA / ANALYTICS",         thumb: "/cat-data.png",        color: "#22c55e", glow: "rgba(34,197,94,0.45)"   },
  { id: "design",      label: "DESIGN / UI-UX",           thumb: "/cat-design.png",      color: "#38bdf8", glow: "rgba(56,189,248,0.45)"  },
  { id: "writing",     label: "WRITING / SOFT SKILLS",    thumb: "/cat-writing.png",     color: "#f59e0b", glow: "rgba(245,158,11,0.45)"  },
  { id: "language",    label: "LANGUAGE LEARNING",        thumb: "/cat-language.png",    color: "#34d399", glow: "rgba(52,211,153,0.45)"  },
  { id: "fitness",     label: "FITNESS / WELLNESS",       thumb: "/cat-fitness.png",     color: "#4ade80", glow: "rgba(74,222,128,0.45)"  },
] as const;

export type CategoryId = typeof QUIZ_CATEGORIES[number]["id"];

interface Props {
  selected: CategoryId | null;
  onChange: (id: CategoryId) => void;
}

export default function CategoryPicker({ selected, onChange }: Props) {
  return (
    <div style={{ background: "#13131f", border: "2px solid #2d2d44", padding: 20, marginBottom: 16 }}>
      <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 14 }}>
        ■ SELECT COURSE CATEGORY
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {QUIZ_CATEGORIES.map((cat) => {
          const active = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              style={{
                position: "relative", overflow: "hidden", cursor: "pointer",
                border: `2px solid ${active ? cat.color : "#2d2d44"}`,
                boxShadow: active ? `0 0 14px 2px ${cat.glow}, 3px 3px 0 rgba(0,0,0,0.5)` : "2px 2px 0 rgba(0,0,0,0.4)",
                background: "#0d0d18",
                transition: "all 0.1s",
                padding: 0,
                borderRadius: 2,
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: "relative", height: 72, overflow: "hidden" }}>
                <Image src={cat.thumb} alt={cat.label} fill sizes="200px"
                  style={{ objectFit: "cover", objectPosition: "center top" }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(to bottom, transparent 30%, #0d0d18 100%)`,
                }} />
                {active && (
                  <div style={{
                    position: "absolute", top: 5, right: 5,
                    width: 10, height: 10, background: cat.color,
                    boxShadow: `0 0 6px ${cat.color}`,
                  }} />
                )}
              </div>
              {/* Label */}
              <div style={{ padding: "6px 8px" }}>
                <p style={{
                  fontFamily: "monospace", fontSize: 8, fontWeight: 700,
                  letterSpacing: "0.8px", color: active ? cat.color : "#6b6880",
                  textAlign: "left", lineHeight: 1.3,
                }}>
                  {cat.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
