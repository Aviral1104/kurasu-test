import { Rank, RANK_ORDER, RANK_COLORS } from "./ranks";

export interface Avatar {
  id: string;
  rankNum: number;
  name: string;
  title: string;
  bg: string;
  border: string;
  unlockRank: Rank;
}

export const AVATARS: Avatar[] = [
  { id: "rank-12", rankNum: 12, name: "Novice Hunter",     title: "E-Rank Beginner",        bg: "#1c1917", border: "#78716c", unlockRank: "XII" },
  { id: "rank-11", rankNum: 11, name: "Scout Hunter",      title: "D-Rank Explorer",        bg: "#374151", border: "#9ca3af", unlockRank: "XI"  },
  { id: "rank-10", rankNum: 10, name: "Veteran Scout",     title: "C-Rank Specialist",      bg: "#451a03", border: "#d97706", unlockRank: "X"   },
  { id: "rank-9",  rankNum: 9,  name: "Green Hunter",       title: "B-Rank Nature Seeker",   bg: "#14532d", border: "#84cc16", unlockRank: "IX"  },
  { id: "rank-8",  rankNum: 8,  name: "Guardian Hunter",    title: "A-Rank Protector",       bg: "#1e3a8a", border: "#3b82f6", unlockRank: "VIII" },
  { id: "rank-7",  rankNum: 7,  name: "Night Hunter",       title: "S-Rank Shadow Stalker",  bg: "#4c1d95", border: "#9333ea", unlockRank: "VII" },
  { id: "rank-6",  rankNum: 6,  name: "Flame Hunter",       title: "National Level Berserker", bg: "#7f1d1d", border: "#ef4444", unlockRank: "VI"  },
  { id: "rank-5",  rankNum: 5,  name: "Teal Sovereign",     title: "Mist Monarch",           bg: "#134e4a", border: "#2dd4bf", unlockRank: "V"   },
  { id: "rank-4",  rankNum: 4,  name: "Amber Monarch",      title: "Gold Gate Conqueror",    bg: "#78350f", border: "#f59e0b", unlockRank: "IV"  },
  { id: "rank-3",  rankNum: 3,  name: "Ice Monarch",        title: "Sovereign of Frost",     bg: "#0c4a6e", border: "#38bdf8", unlockRank: "III" },
  { id: "rank-2",  rankNum: 2,  name: "Shadow Monarch",     title: "Commander of the Dead",  bg: "#3b0764", border: "#a855f7", unlockRank: "II"  },
  { id: "rank-1",  rankNum: 1,  name: "Grand Sovereign",    title: "The Ultimate Hunter",    bg: "#422006", border: "#fbbf24", unlockRank: "I"   },
];

export function isAvatarUnlocked(avatar: Avatar, hunterRank: Rank): boolean {
  const hunterIdx  = RANK_ORDER.indexOf(hunterRank);
  const unlockIdx  = RANK_ORDER.indexOf(avatar.unlockRank);
  // In RANK_ORDER ["XII", ..., "I"], higher index means higher rank
  return hunterIdx >= unlockIdx;
}
