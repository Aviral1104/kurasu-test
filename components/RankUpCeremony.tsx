"use client";

import { useEffect, useState } from "react";
import { RANK_COLORS, type Rank, getRankNumber } from "@/lib/utils/ranks";
import HunterRankIcon from "@/components/HunterRankIcon";

interface Props {
  oldRank: Rank;
  newRank: Rank;
  courseName: string;
  onDismiss: () => void;
}

// Generate particle data once
function makeParticles(count = 24) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360;
    const dist = 100 + Math.random() * 150;
    const rad = (angle * Math.PI) / 180;
    return {
      tx: `${Math.cos(rad) * dist}px`,
      ty: `${Math.sin(rad) * dist}px`,
      delay: `${Math.random() * 0.4}s`,
      color: i % 3 === 0 ? "#c084fc" : i % 3 === 1 ? "#8b5cf6" : "#a78bfa",
      size: 4 + Math.random() * 8,
    };
  });
}

const PARTICLES = makeParticles(32);

export default function RankUpCeremony({ oldRank, newRank, courseName, onDismiss }: Props) {
  const [showParticles, setShowParticles] = useState(false);
  const rankChanged = oldRank !== newRank;
  const displayRank = rankChanged ? newRank : oldRank;
  const rankColor = RANK_COLORS[displayRank] || "#7c3aed";
  const rankNum = getRankNumber(displayRank);

  useEffect(() => {
    const t1 = setTimeout(() => setShowParticles(true), 200);
    const t2 = setTimeout(() => onDismiss(), 6000); // slightly longer ceremony
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(0,0,0,0.94)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        animation: "awakening-fade-in 0.5s ease forwards",
      }}
    >
      {/* Radial glow behind badge */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rankColor}40 0%, transparent 75%)`,
          pointerEvents: "none",
        }}
      />

      {/* Particles */}
      {showParticles && PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            "--tx": p.tx,
            "--ty": p.ty,
            "--delay": p.delay,
            background: p.color,
            width: p.size,
            height: p.size,
          } as React.CSSProperties}
        />
      ))}

      {/* ARISE text */}
      <p
        className="arise-text"
        style={{
          fontFamily: "var(--font-rank)",
          fontSize: 14,
          letterSpacing: "0.6em",
          color: rankColor,
          textTransform: "uppercase",
          marginBottom: 36,
          opacity: 0,
          textShadow: `0 0 15px ${rankColor}80`,
        }}
      >
        {rankChanged ? "HUNTER AWAKENING" : "DUNGEON CLEARED"}
      </p>

      {/* Rank badge container */}
      <div
        className="rank-badge-ceremony"
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: `radial-gradient(circle at 50% 50%, ${rankColor}20, transparent)`,
          border: `2px solid ${rankColor}40`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
          boxShadow: `0 0 40px ${rankColor}30`,
          position: "relative",
        }}
      >
        <HunterRankIcon rank={rankNum} size={120} />
      </div>

      {/* Title */}
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: 26,
          fontWeight: 800,
          marginBottom: 12,
          letterSpacing: "-0.5px",
          color: "#fff",
          animation: "awakening-fade-in 0.6s 0.8s ease both",
          opacity: 0,
          textTransform: "uppercase",
        }}
      >
        {rankChanged ? "RANK EVOLUTION" : "QUEST COMPLETE"}
      </h2>

      <p
        style={{
          fontFamily: "monospace",
          fontSize: 14,
          color: "#9ca3af",
          textAlign: "center",
          maxWidth: 400,
          lineHeight: 1.6,
          animation: "awakening-fade-in 0.6s 1.1s ease both",
          opacity: 0,
          letterSpacing: "1px",
        }}
      >
        {rankChanged
          ? `System Authority: Evolution to RANK ${displayRank} acknowledged.`
          : `The records for "${courseName}" have been updated.`}
      </p>

      {/* Dismiss hint */}
      <p
        style={{
          position: "absolute",
          bottom: 40,
          fontSize: 10,
          color: "rgba(255,255,255,0.2)",
          fontFamily: "monospace",
          letterSpacing: "0.2em",
          animation: "awakening-fade-in 0.5s 2.5s ease both",
          opacity: 0,
          textTransform: "uppercase",
        }}
      >
        tap anywhere to continue
      </p>
    </div>
  );
}
