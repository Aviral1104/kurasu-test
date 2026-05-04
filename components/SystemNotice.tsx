"use client";

import { useEffect, useState } from "react";
import HunterRankIcon from "@/components/HunterRankIcon";
import { getRankNumber, type Rank } from "@/lib/utils/ranks";

export type NoticeType = "rank-up" | "deadline" | "goal" | "warning";

export interface Notice {
  type: NoticeType;
  title: string;
  message: string;
  rank?: Rank;
}

interface Props {
  notice: Notice | null;
  onDismiss: () => void;
}

const NOTICE_CONFIG = {
  "rank-up": { color: "#7c3aed", icon: "⚡", border: "#7c3aed" },
  "deadline": { color: "#f59e0b", icon: "⏰", border: "#f59e0b" },
  "goal":     { color: "#34d399", icon: "✅", border: "#34d399" },
  "warning":  { color: "#dc2626", icon: "⚠️", border: "#dc2626" },
};

export default function SystemNotice({ notice, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [animOut, setAnimOut] = useState(false);

  useEffect(() => {
    if (notice) {
      setAnimOut(false);
      setVisible(true);
      // Auto dismiss after 6s
      const t = setTimeout(() => dismiss(), 6000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  function dismiss() {
    setAnimOut(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 400);
  }

  if (!notice || !visible) return null;

  const cfg = NOTICE_CONFIG[notice.type];

  return (
    <>
      <style>{`
        @keyframes noticeIn {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes noticeOut {
          from { transform: translateY(0);     opacity: 1; }
          to   { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes noticePulse {
          0%, 100% { box-shadow: 0 0 0 0 ${cfg.color}44; }
          50%       { box-shadow: 0 0 24px 4px ${cfg.color}33; }
        }
        @keyframes scanline {
          0%   { top: -2px; }
          100% { top: 100%; }
        }
      `}</style>
      <div
        style={{
          position: "fixed", top: 16, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999, maxWidth: 520, width: "calc(100% - 80px)",
          animation: `${animOut ? "noticeOut" : "noticeIn"} 0.4s cubic-bezier(0.16,1,0.3,1) forwards`,
        }}
      >
        <div
          style={{
            background: "#0d0d18",
            border: `2px solid ${cfg.border}`,
            boxShadow: `0 0 0 1px #000, 6px 6px 0 ${cfg.border}44`,
            padding: "14px 20px",
            position: "relative", overflow: "hidden",
            animation: "noticePulse 2s ease-in-out infinite",
          }}
        >
          {/* Top stripe */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: `repeating-linear-gradient(90deg, ${cfg.color} 0, ${cfg.color} 6px, transparent 6px, transparent 12px)`,
          }} />
          {/* Scanline */}
          <div style={{
            position: "absolute", left: 0, right: 0, height: 1,
            background: `rgba(255,255,255,0.04)`,
            animation: "scanline 3s linear infinite",
          }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative" }}>
            {/* Icon */}
            <div style={{
              width: 40, height: 40, border: `2px solid ${cfg.border}`,
              background: `${cfg.color}11`, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0,
            }}>
              {notice.rank ? <HunterRankIcon rank={getRankNumber(notice.rank)} size={32} /> : cfg.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{
                  fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px",
                  color: cfg.color, marginBottom: 4, fontWeight: 700,
                }}>
                  SYSTEM NOTICE
                </p>
                <button
                  onClick={dismiss}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: "#4a4760", fontFamily: "monospace", fontSize: 14, lineHeight: 1,
                    padding: "0 0 0 8px",
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, color: "#e8e6f0", marginBottom: 2 }}>
                {notice.title}
              </p>
              <p style={{ fontFamily: "var(--font-system)", fontSize: 10, color: "#9d9ab0", lineHeight: 1.5 }}>
                {notice.message}
              </p>
            </div>
          </div>

          {/* Auto-dismiss progress bar */}
          <div style={{ marginTop: 12, height: 2, background: "#1a1a2e", overflow: "hidden" }}>
            <div style={{
              height: "100%", background: cfg.color, width: "100%",
              animation: "noticeOut 6s linear forwards",
              transformOrigin: "left",
            }} />
          </div>
        </div>
      </div>
    </>
  );
}
