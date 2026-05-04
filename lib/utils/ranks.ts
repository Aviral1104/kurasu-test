export type Rank = "I" | "II" | "III" | "IV" | "V" | "VI" | "VII" | "VIII" | "IX" | "X" | "XI" | "XII" | "S" | "A" | "B" | "C" | "D" | "E";

export const RANK_ORDER: Rank[] = ["XII", "XI", "X", "IX", "VIII", "VII", "VI", "V", "IV", "III", "II", "I"];

export const RANK_COLORS: Record<Rank, string> = {
  I:  "#fbbf24", // gold
  II:  "#a855f7", // purple
  III:  "#38bdf8", // ice blue
  IV:  "#f59e0b", // amber
  V:  "#2dd4bf", // teal
  VI:  "#ef4444", // red
  VII:  "#9333ea", // dark purple
  VIII:  "#3b82f6", // blue
  IX:  "#84cc16", // green
  X: "#d97706", // bronze
  XI: "#9ca3af", // silver
  XII: "#78716c", // stone/skull
  S:   "#fbbf24", // gold
  A:   "#a855f7", // purple
  B:   "#38bdf8", // ice blue
  C:   "#f59e0b", // amber
  D:   "#2dd4bf", // teal
  E:   "#ef4444", // red
};

// XP thresholds per Hunter Rank (XII to I)
export const RANK_THRESHOLDS: Record<Rank, number> = {
  XII: 0,
  XI: 500,
  X: 1_500,
  IX: 3_000,
  VIII: 6_000,
  VII: 12_000,
  VI: 22_000,
  V: 36_000,
  IV: 55_000,
  III: 80_000,
  II: 110_000,
  I: 150_000,
  S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, // Not used for Hunter Ranks
};

export function getHunterRank(xp: number): Rank {
  let rank: Rank = "XII";
  for (const r of RANK_ORDER) {
    if (xp >= RANK_THRESHOLDS[r]) rank = r;
  }
  return rank;
}

export function getRankNumber(rank: Rank): number {
  const map: Record<Rank, number> = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6,
    "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12,
    "S": 1, "A": 2, "B": 3, "C": 4, "D": 5, "E": 6
  };
  return map[rank];
}

export function getNextRankInfo(xp: number): {
  currentRank: Rank;
  nextRank: Rank | null;
  xpInCurrentRank: number;
  xpNeededForNext: number;
  percentToNext: number;
} {
  const currentRank = getHunterRank(xp);
  const currentIdx = RANK_ORDER.indexOf(currentRank);
  const nextRank: Rank | null =
    currentIdx < RANK_ORDER.length - 1 ? RANK_ORDER[currentIdx + 1] : null;

  const currentFloor = RANK_THRESHOLDS[currentRank];
  const nextFloor = nextRank ? RANK_THRESHOLDS[nextRank] : RANK_THRESHOLDS["I"] + 1;

  const xpInCurrentRank = xp - currentFloor;
  const xpNeededForNext = nextFloor - currentFloor;
  const percentToNext = nextRank
    ? Math.min(100, Math.round((xpInCurrentRank / xpNeededForNext) * 100))
    : 100;

  return { currentRank, nextRank, xpInCurrentRank, xpNeededForNext, percentToNext };
}

// Dungeon (course) rank based on video count - mapped to the top 6 hunter ranks for prestige
export function getDungeonRank(videoCount: number): Rank {
  if (videoCount >= 81) return "S";
  if (videoCount >= 61) return "A";
  if (videoCount >= 41) return "B";
  if (videoCount >= 26) return "C";
  if (videoCount >= 16) return "D";
  return "E";
}

// XP awarded per video completion based on dungeon rank
export const XP_PER_VIDEO: Record<Rank, number> = {
  I: 200,
  II: 150,
  III: 100,
  IV: 70,
  V: 50,
  VI: 30,
  VII: 20,
  VIII: 15,
  IX: 10,
  X: 8,
  XI: 5,
  XII: 3,
  S: 200,
  A: 150,
  B: 100,
  C: 70,
  D: 50,
  E: 30,
};
