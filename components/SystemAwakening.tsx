"use client";

import { useEffect, useState } from "react";
import HunterRankIcon from "@/components/HunterRankIcon";

interface Props {
  onComplete: () => void;
}

const LINES = [
  "Initializing The System...",
  "Hunter detected.",
  "You have been selected.",
  "A new Hunter has awakened.",
];

export default function SystemAwakening({ onComplete }: Props) {
  const [phase, setPhase] = useState(0); // which line we're typing
  const [shown, setShown] = useState<string[]>([]);
  const [typing, setTyping] = useState("");
  const [charIdx, setCharIdx] = useState(0);
  const [rankVisible, setRankVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Type current line character by character
  useEffect(() => {
    if (phase >= LINES.length) {
      // All lines done — show rank badge then fade out
      const t1 = setTimeout(() => setRankVisible(true), 400);
      const t2 = setTimeout(() => setFadeOut(true), 2800);
      const t3 = setTimeout(() => onComplete(), 3400);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }

    const line = LINES[phase];
    if (charIdx < line.length) {
      const t = setTimeout(() => {
        setTyping((prev) => prev + line[charIdx]);
        setCharIdx((i) => i + 1);
      }, 38);
      return () => clearTimeout(t);
    } else {
      // Line complete — move to next
      const t = setTimeout(() => {
        setShown((prev) => [...prev, line]);
        setTyping("");
        setCharIdx(0);
        setPhase((p) => p + 1);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [phase, charIdx, onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease",
        cursor: "default",
      }}
      onClick={() => {
        setFadeOut(true);
        setTimeout(() => onComplete(), 600);
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", maxWidth: 480, width: "100%", padding: "0 24px" }}>

        {/* System icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "linear-gradient(135deg, #7c3aed, #c084fc)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
            fontSize: 24,
            boxShadow: "0 0 40px rgba(124,58,237,0.5)",
          }}
        >
          ⚡
        </div>

        {/* Completed lines */}
        <div style={{ marginBottom: 8 }}>
          {shown.map((line, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-system)",
                fontSize: 18,
                color: "rgba(255,255,255,0.35)",
                marginBottom: 10,
                letterSpacing: "0.02em",
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Currently typing line */}
        {phase < LINES.length && (
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <p
              style={{
                fontFamily: "var(--font-system)",
                fontSize: 18,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "0.02em",
              }}
            >
              {typing}
            </p>
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: 20,
                background: "var(--accent-bright)",
                animation: "blink-cursor 0.7s step-end infinite",
                borderRadius: 1,
                marginLeft: 2,
              }}
            />
          </div>
        )}

        {/* Rank badge — appears after all lines */}
        {rankVisible && (
          <div
            style={{
              marginTop: 40,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              animation: "awakening-fade-in 0.5s ease forwards",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-system)",
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Rank assigned
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(107,114,128,0.15)",
                border: "1px solid rgba(107,114,128,0.4)",
                borderRadius: 12,
                padding: "12px 20px",
                width: "fit-content",
              }}
            >
                <span
                  style={{
                    fontFamily: "var(--font-rank)",
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#9ca3af",
                    letterSpacing: "0.2em",
                  }}
                >
                  RANK XII
                </span>
                <HunterRankIcon rank={12} size={32} />
            </div>
            <p
              style={{
                fontFamily: "var(--font-system)",
                fontSize: 13,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              The System is watching. Begin your ascent.
            </p>
          </div>
        )}

        {/* Skip hint */}
        <p
          style={{
            position: "absolute",
            bottom: -60,
            right: 0,
            fontSize: 11,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.1em",
          }}
        >
          click to skip
        </p>
      </div>
    </div>
  );
}
