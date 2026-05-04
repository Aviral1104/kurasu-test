"use client";

import Link from "next/link";
import Image from "next/image";
import { CourseDoc } from "@/lib/firebase/schema";
import { getDungeonRank, RANK_COLORS, XP_PER_VIDEO, type Rank, getRankNumber } from "@/lib/utils/ranks";
import HunterRankIcon from "@/components/HunterRankIcon";

interface Props {
  course: CourseDoc & { id: string };
  completedCount: number;
}

// Dungeon scene thumbnail per rank (mapped to the 6 dungeon ranks returned by getDungeonRank)
const RANK_THUMB: Partial<Record<Rank, string>> = {
  S:  "/dungeon-s.png",
  A: "/dungeon-a.png",
  B: "/dungeon-b.png",
  C: "/dungeon-c.png",
  D:  "/dungeon-d.png",
  E: "/dungeon-e.png",
};

// Outer glow color per rank
const RANK_GLOW: Partial<Record<Rank, string>> = {
  S:  "rgba(251,191,36,0.55)",
  A: "rgba(168,85,247,0.55)",
  B: "rgba(56,189,248,0.55)",
  C: "rgba(245,158,11,0.50)",
  D:  "rgba(45,212,191,0.50)",
  E: "rgba(239,68,68,0.50)",
};

// Inner border color
const RANK_BORDER: Partial<Record<Rank, string>> = {
  S:  "#fbbf24",
  A: "#a855f7",
  B: "#38bdf8",
  C: "#f59e0b",
  D:  "#2dd4bf",
  E: "#ef4444",
};

export default function QuestCard({ course, completedCount }: Props) {
  const rank: Rank = getDungeonRank(course.totalVideos);
  const rankNum = getRankNumber(rank);
  const rankColor  = RANK_COLORS[rank] || "#6b7280";
  const xpNext     = XP_PER_VIDEO[rank] || 20;
  const glow       = RANK_GLOW[rank] || "rgba(107,114,128,0.40)";
  const border     = RANK_BORDER[rank] || "#6b7280";
  const thumb      = RANK_THUMB[rank] || "/dungeon-e.png";

  const percent =
    course.totalVideos > 0
      ? Math.round((completedCount / course.totalVideos) * 100)
      : 0;

  const isComplete = percent === 100;

  const totalSecs  = course.totalVideos * 8 * 60;
  const hours      = Math.floor(totalSecs / 3600);
  const mins       = Math.floor((totalSecs % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}H ${mins}M` : `${mins}M`;

  return (
    <Link href={`/course/${course.id}`} style={{ display: "block", textDecoration: "none" }}>
      <div
        style={{
          background: "#0d0d18",
          border: `3px solid ${border}`,
          boxShadow: `0 0 0 1px ${border}30, 0 0 18px 2px ${glow}, 4px 4px 0 rgba(0,0,0,0.6)`,
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.1s ease, box-shadow 0.1s ease",
          position: "relative",
          borderRadius: 2,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translate(-2px, -2px)";
          el.style.boxShadow = `0 0 0 1px ${border}50, 0 0 28px 5px ${glow}, 6px 6px 0 rgba(0,0,0,0.6)`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translate(0, 0)";
          el.style.boxShadow = `0 0 0 1px ${border}30, 0 0 18px 2px ${glow}, 4px 4px 0 rgba(0,0,0,0.6)`;
        }}
      >
        {/* ── Thumbnail area ── */}
        <div style={{ position: "relative", height: 170, overflow: "hidden" }}>
          {/* Dungeon scene image */}
          <Image
            src={thumb}
            alt={`${rank}-rank dungeon`}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            style={{ objectFit: "cover", objectPosition: "center" }}
            priority={false}
          />

          {/* Bottom gradient fade into card body */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to bottom, transparent 40%, #0d0d18 100%)`,
            pointerEvents: "none",
          }} />

          {/* Scanline overlay — authentic CRT feel */}
          <div style={{
            position: "absolute", inset: 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)",
            pointerEvents: "none",
          }} />

          {/* Rank badge — top-right corner, matches theme.png exactly */}
          <div style={{
            position: "absolute", top: 10, right: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `rgba(5,5,12,0.88)`,
            border: `2px solid ${border}`,
            boxShadow: `0 0 10px ${glow}, 2px 2px 0 rgba(0,0,0,0.6)`,
            padding: "2px 4px",
            borderRadius: 2,
            zIndex: 10,
          }}>
            <HunterRankIcon rank={rankNum} size={28} />
          </div>

          {/* Corner bracket accents — pixel art style */}
          <div style={{ position: "absolute", top: 6, left: 6, width: 12, height: 12, borderTop: `2px solid ${border}80`, borderLeft: `2px solid ${border}80` }} />
          <div style={{ position: "absolute", bottom: 6, left: 6, width: 12, height: 12, borderBottom: `2px solid ${border}80`, borderLeft: `2px solid ${border}80` }} />
        </div>

        {/* ── Card body ── */}
        <div style={{ padding: "12px 14px 14px" }}>

          {/* Title */}
          <h3 style={{
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: 5,
            color: "#e8e6f0",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}>
            {course.title}
          </h3>

          {/* Metadata row — VIDEO COUNT · DURATION */}
          <p style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "#6b6880",
            letterSpacing: "1.5px",
            marginBottom: 12,
            textTransform: "uppercase",
          }}>
            {course.totalVideos} VIDEOS · {durationStr}
          </p>

          {/* Pixel progress bar — thick chunky look as in theme.png */}
          <div style={{
            background: "#1a1a2e",
            border: "2px solid #2d2d44",
            height: 10,
            marginBottom: 10,
            overflow: "hidden",
            borderRadius: 1,
          }}>
            <div style={{
              width: `${percent}%`,
              height: "100%",
              background: isComplete
                ? "repeating-linear-gradient(90deg,#34d399 0,#34d399 6px,#059669 6px,#059669 12px)"
                : `repeating-linear-gradient(90deg,${border} 0,${border} 6px,${rankColor}88 6px,${rankColor}88 12px)`,
              transition: "width 0.5s steps(10, end)",
            }} />
          </div>

          {/* Footer — % DONE and +XP */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "1.5px",
              color: isComplete ? "#34d399" : "#6b6880",
              textTransform: "uppercase",
            }}>
              {isComplete ? "■ CLEARED" : `${percent}% DONE`}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "1px",
                color: border,
                textShadow: `0 0 8px ${glow}`,
              }}>
                +{xpNext}XP
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
