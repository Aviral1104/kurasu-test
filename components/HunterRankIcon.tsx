/**
 * HunterRankIcon
 * Renders individual rank emblem images from /public/ranks/
 * Rank 1 (best / gold) → Rank 12 (start / skull)
 */

interface Props {
  rank: number;       // 1 (best) to 12 (start)
  size?: number;      // rendered size in px (default 48)
  className?: string;
}

export default function HunterRankIcon({ rank, size = 48, className }: Props) {
  const r = Math.max(1, Math.min(12, rank));

  return (
    <img
      src={`/ranks/avatar_${r}_enhanced.png`}
      alt={`Rank ${r}`}
      className={className}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        imageRendering: "pixelated",
        pointerEvents: "none",
        userSelect: "none" as const,
        flexShrink: 0,
      }}
      draggable={false}
    />
  );
}

/**
 * Rank label helpers
 */
export const RANK_NUMERALS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"] as const;
export type HunterRankNum = 1|2|3|4|5|6|7|8|9|10|11|12;

// Colours matching each emblem
export const RANK_NUMERAL_COLORS: Record<number, string> = {
  1:  "#fbbf24", // gold
  2:  "#a855f7", // purple
  3:  "#38bdf8", // ice blue
  4:  "#f59e0b", // amber
  5:  "#2dd4bf", // teal
  6:  "#ef4444", // red
  7:  "#9333ea", // dark purple
  8:  "#3b82f6", // blue
  9:  "#84cc16", // green
  10: "#d97706", // bronze
  11: "#9ca3af", // silver
  12: "#78716c", // stone/skull
};

// XP thresholds — rank 12 is starting, rank 1 is max
export const HUNTER_RANK_XP: Record<number, number> = {
  12: 0,
  11: 500,
  10: 1_500,
  9:  3_000,
  8:  6_000,
  7:  12_000,
  6:  22_000,
  5:  36_000,
  4:  55_000,
  3:  80_000,
  2:  110_000,
  1:  150_000,
};

export function getHunterRankNum(xp: number): HunterRankNum {
  let rank: HunterRankNum = 12;
  for (let r = 12; r >= 1; r--) {
    if (xp >= HUNTER_RANK_XP[r]) { rank = r as HunterRankNum; break; }
  }
  return rank;
}

export function getNextRankNumInfo(xp: number) {
  const current = getHunterRankNum(xp);
  const next = current > 1 ? (current - 1) as HunterRankNum : null;
  const floor = HUNTER_RANK_XP[current];
  const ceiling = next ? HUNTER_RANK_XP[next] : HUNTER_RANK_XP[1] + 1;
  const pct = next ? Math.min(100, Math.round(((xp - floor) / (ceiling - floor)) * 100)) : 100;
  return { current, next, floor, ceiling, pct };
}
