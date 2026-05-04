"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ProgressDoc, CourseDoc } from "@/lib/firebase/schema";
import AppShell from "@/components/AppShell";
import { getHunterRank, getNextRankInfo, RANK_COLORS, getRankNumber } from "@/lib/utils/ranks";
import { AVATARS, isAvatarUnlocked } from "@/lib/utils/avatars";
import { Loader2, Edit3, Check, X, Lock } from "lucide-react";
import HunterRankIcon from "@/components/HunterRankIcon";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [xp, setXp] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("rank-12");
  const [pageLoading, setPageLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [clearedCourses, setClearedCourses] = useState(0);
  const [intAccuracy, setIntAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const data = userSnap.data() || {};
      setXp(data.xp || 0);
      setStreakCount(data.streakCount || 0);
      setSelectedAvatar(data.avatarId || "rank-12");
      const name = data.displayName || user.displayName || user.email?.split("@")[0] || "Hunter";
      setDisplayName(name);
      setNameInput(name);

      const coursesSnap = await getDocs(collection(db, "users", user.uid, "courses"));
      setTotalCourses(coursesSnap.size);
      const progressSnap = await getDocs(collection(db, "users", user.uid, "progress"));
      const completed = progressSnap.docs.filter((d) => (d.data() as ProgressDoc).completed).length;
      setTotalVideos(completed);

      const cMap: Record<string, number> = {};
      progressSnap.docs.forEach((d) => {
        const p = d.data() as ProgressDoc;
        if (p.completed) cMap[p.courseId] = (cMap[p.courseId] || 0) + 1;
      });
      let cleared = 0;
      coursesSnap.docs.forEach((d) => {
        const c = d.data() as CourseDoc;
        if ((cMap[d.id] || 0) >= c.totalVideos && c.totalVideos > 0) cleared++;
      });
      setClearedCourses(cleared);

      // INT stat — quiz accuracy from shadow army
      const shadowsSnap = await getDocs(collection(db, "users", user.uid, "shadows"));
      const totalAttempts = shadowsSnap.docs.reduce((a, d) => a + (d.data().attempts || 0), 0);
      const totalCorrect = shadowsSnap.docs.reduce((a, d) => a + (d.data().correct || 0), 0);
      if (totalAttempts > 0) setIntAccuracy(Math.round((totalCorrect / totalAttempts) * 100));

      setPageLoading(false);
    })();
  }, [user]);

  async function saveAvatar(avatarId: string) {
    if (!user) return;
    setSelectedAvatar(avatarId);
    await updateDoc(doc(db, "users", user.uid), { avatarId });
  }

  async function saveName() {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    await updateDoc(doc(db, "users", user.uid), { displayName: nameInput.trim() });
    setDisplayName(nameInput.trim());
    setEditingName(false);
    setSavingName(false);
  }

  if (loading || pageLoading || !user) {
    return (
      <AppShell>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={32} color="#7c3aed" className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  const { currentRank, nextRank, percentToNext, xpInCurrentRank, xpNeededForNext } = getNextRankInfo(xp);
  const rankColor = RANK_COLORS[currentRank];
  const activeAvatar = AVATARS.find((a) => a.id === selectedAvatar) || AVATARS[0];

  // RPG stat attributes
  const stats = [
    {
      attr: "INT",
      label: "Intelligence",
      value: intAccuracy !== null ? `${intAccuracy}%` : "—",
      sub: intAccuracy !== null ? `QUIZ ACCURACY · ${intAccuracy >= 80 ? "EXCELLENT" : intAccuracy >= 60 ? "GOOD" : "IMPROVING"}` : "COMPLETE SKILL CHECKS",
      color: "#38bdf8",
      max: 0,
      desc: "Measures mastery through quiz performance",
    },
    {
      attr: "PER",
      label: "Persistence",
      value: streakCount,
      sub: `${streakCount > 0 ? "ACTIVE STREAK" : "INACTIVE"} · ${streakCount} DAYS`,
      color: "#f59e0b",
      max: 30,
      desc: "Streak consistency across all dungeons",
    },
    {
      attr: "STR",
      label: "Strength",
      value: totalVideos,
      sub: "TARGETS ELIMINATED",
      color: "#34d399",
      max: 500,
      desc: "Total videos watched to completion",
    },
    {
      attr: "AGI",
      label: "Agility",
      value: clearedCourses,
      sub: `DUNGEONS CLEARED`,
      color: "#a78bfa",
      max: 20,
      desc: "Full courses completed end-to-end",
    },
  ];

  return (
    <AppShell>
      <div style={{ padding: "28px 32px 80px", maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div className="dash-enter" style={{ marginBottom: 24 }}>
          <div style={{
            height: 3, marginBottom: 16,
            background: `repeating-linear-gradient(90deg, ${rankColor} 0, ${rankColor} 8px, transparent 8px, transparent 16px)`,
            opacity: 0.4,
          }} />
          <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#4a4760", marginBottom: 6 }}>
            SYSTEM INTERFACE · HUNTER RECORD
          </p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 800, color: "#e8e6f0" }}>
            Hunter Profile
          </h1>
        </div>

        {/* Profile hero card */}
        <div className="dash-enter" style={{
          background: "#13131f", border: `2px solid ${rankColor}`,
          boxShadow: `6px 6px 0 ${rankColor}33`,
          padding: 24, marginBottom: 16,
          display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap",
          position: "relative", overflow: "visible",
        }}>
          {/* Rank stripe */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 4,
            background: `repeating-linear-gradient(90deg, ${rankColor} 0, ${rankColor} 8px, transparent 8px, transparent 16px)`,
          }} />

          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0, marginTop: 8 }}>
            {/* Corner accents */}
            <div style={{ position: "absolute", top: -4, left: -4, width: 12, height: 12, borderTop: `3px solid ${rankColor}`, borderLeft: `3px solid ${rankColor}` }} />
            <div style={{ position: "absolute", bottom: -4, right: -4, width: 12, height: 12, borderBottom: `3px solid ${rankColor}`, borderRight: `3px solid ${rankColor}` }} />
            <div style={{
              width: 96, height: 96,
              background: "#0a0a14",
              border: `3px solid ${rankColor}`,
              boxShadow: `4px 4px 0 ${rankColor}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              <HunterRankIcon rank={activeAvatar.rankNum} size={80} />
            </div>
            {/* Rank badge */}
            <div style={{
              position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(13,13,24,0.9)", border: `2px solid ${rankColor}`,
              display: "flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 2,
              boxShadow: `0 0 10px ${rankColor}30`,
              zIndex: 10,
            }}>
              <HunterRankIcon rank={getRankNumber(currentRank)} size={22} />
              <span style={{
                fontFamily: "monospace", fontSize: 10, fontWeight: 900,
                color: rankColor, letterSpacing: "2px", whiteSpace: "nowrap",
              }}>
                {currentRank}
              </span>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200, marginTop: 8 }}>
            {/* Name row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              {editingName ? (
                <>
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    autoFocus
                    style={{
                      background: "#0d0d18", border: "2px solid #7c3aed",
                      padding: "6px 10px", color: "#e8e6f0",
                      fontSize: 20, fontWeight: 700, outline: "none",
                      fontFamily: "var(--font-heading)", borderRadius: 0,
                    }}
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#34d399", display: "flex" }}
                  >
                    {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameInput(displayName); }}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#dc2626", display: "flex" }}
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 700, color: "#e8e6f0" }}>
                    {displayName}
                  </h2>
                  <button
                    onClick={() => setEditingName(true)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#4a4760", display: "flex", padding: 4 }}
                  >
                    <Edit3 size={13} />
                  </button>
                </>
              )}
            </div>

            <p style={{ fontFamily: "var(--font-system)", fontSize: 11, color: "#6b6880", letterSpacing: "1px", marginBottom: 16 }}>
              {activeAvatar.name.toUpperCase()} · {activeAvatar.title.toUpperCase()}
            </p>

            {/* XP bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-system)", fontSize: 9, color: rankColor, letterSpacing: "2px" }}>
                  RANK {currentRank} HUNTER
                </span>
                <span style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#6b6880" }}>
                  {xpInCurrentRank.toLocaleString()} / {xpNeededForNext.toLocaleString()} XP → {nextRank}
                </span>
              </div>
              <div style={{ background: "#1a1a2e", border: "2px solid #2d2d44", height: 10, overflow: "hidden" }}>
                <div style={{
                  width: `${percentToNext}%`, height: "100%",
                  background: `repeating-linear-gradient(90deg, ${rankColor} 0, ${rankColor} 6px, ${rankColor}88 6px, ${rankColor}88 12px)`,
                  transition: "width 0.6s steps(10,end)",
                }} />
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "TOTAL XP", value: xp.toLocaleString(), color: "#a78bfa" },
                { label: "DAY STREAK", value: streakCount, color: "#f59e0b" },
                { label: "CLEARED", value: clearedCourses, color: "#34d399" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#0d0d18", border: "1px solid #2d2d44", padding: "8px 12px" }}>
                  <p style={{ fontFamily: "var(--font-system)", fontSize: 18, fontWeight: 700, color: s.color as string, marginBottom: 2 }}>
                    {s.value}
                  </p>
                  <p style={{ fontFamily: "var(--font-system)", fontSize: 8, letterSpacing: "1px", color: "#4a4760" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stat Screen — RPG Attributes */}
        <div className="dash-enter" style={{
          background: "#13131f", border: "2px solid #2d2d44",
          boxShadow: "6px 6px 0 rgba(0,0,0,0.5)",
          padding: 24, marginBottom: 16, position: "relative", overflow: "hidden",
        }}>
          {/* Scanline effect */}
          <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: "rgba(167,139,250,0.15)", animation: "pxScanline 4s linear infinite" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 4 }}>
                  ■ HUNTER STAT SCREEN
                </p>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 10, color: "#4a4760", fontStyle: "italic" }}>
                  The System has evaluated your attributes.
                </p>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(13,13,24,0.6)", border: `2px solid ${rankColor}`,
                boxShadow: `2px 2px 0 ${rankColor}44`,
                padding: "4px 12px",
              }}>
                <HunterRankIcon rank={getRankNumber(currentRank)} size={20} />
                <div style={{
                  fontFamily: "monospace", fontSize: 10, fontWeight: 900,
                  letterSpacing: "2px", color: rankColor,
                }}>
                  RANK {currentRank}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {stats.map((stat) => (
                <div key={stat.attr} style={{
                  background: "#0d0d18", border: "1px solid #2d2d44",
                  padding: "16px 18px", position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: stat.color, opacity: 0.8 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <span style={{
                        fontFamily: "var(--font-system)", fontSize: 10, fontWeight: 700,
                        letterSpacing: "3px", color: stat.color,
                      }}>
                        {stat.attr}
                      </span>
                      <span style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#4a4760", marginLeft: 8 }}>
                        [{stat.label.toUpperCase()}]
                      </span>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-system)", fontSize: 20, fontWeight: 700,
                      color: "#e8e6f0", textShadow: `0 0 8px ${stat.color}30`,
                    }}>
                      {stat.value}
                    </span>
                  </div>
                  {stat.max > 0 && (
                    <div style={{ background: "#1a1a2e", border: "1px solid #2d2d44", height: 6, marginBottom: 8, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(100, ((Number(stat.value) || 0) / stat.max) * 100)}%`,
                        height: "100%",
                        background: `repeating-linear-gradient(90deg, ${stat.color} 0, ${stat.color} 4px, ${stat.color}88 4px, ${stat.color}88 8px)`,
                        transition: "width 0.6s steps(10,end)",
                      }} />
                    </div>
                  )}
                  <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", color: "#4a4760" }}>
                    {stat.sub}
                  </p>
                  <p style={{ fontFamily: "var(--font-system)", fontSize: 10, color: "#6b6880", marginTop: 4 }}>
                    {stat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Avatar selector */}
        <div className="dash-enter" style={{
          background: "#13131f", border: "2px solid #2d2d44",
          boxShadow: "6px 6px 0 rgba(0,0,0,0.5)",
          padding: 24, marginBottom: 16,
        }}>
          <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 16 }}>
            ■ HUNTER EMBLEM — SELECT YOUR FORM
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {AVATARS.map((av) => {
              const unlocked = isAvatarUnlocked(av, currentRank);
              const isSelected = selectedAvatar === av.id;
              const RANK_LABELS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
              const label = RANK_LABELS[av.rankNum - 1] || `${av.rankNum}`;
              return (
                <button
                  key={av.id}
                  onClick={() => unlocked && saveAvatar(av.id)}
                  title={unlocked ? `${av.name} · ${av.title}` : `Locked — requires Rank ${av.unlockRank}`}
                  style={{
                    position: "relative",
                    background: "#0d0d18",
                    border: `2px solid ${isSelected ? av.border : "#2d2d44"}`,
                    boxShadow: isSelected ? `0 0 12px ${av.border}44, 3px 3px 0 ${av.border}44` : "3px 3px 0 rgba(0,0,0,0.4)",
                    cursor: unlocked ? "pointer" : "not-allowed",
                    opacity: unlocked ? 1 : 0.35,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    padding: "10px 4px 6px",
                    transition: "all 0.1s",
                    borderRadius: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (unlocked && !isSelected) {
                      (e.currentTarget as HTMLElement).style.transform = "translate(-1px,-1px)";
                      (e.currentTarget as HTMLElement).style.borderColor = av.border;
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translate(0,0)";
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "#2d2d44";
                  }}
                >
                  <HunterRankIcon rank={av.rankNum} size={56} />
                  <span style={{
                    fontFamily: "monospace", fontSize: 9, fontWeight: 700,
                    color: isSelected ? av.border : "#6b6880",
                    letterSpacing: "2px", marginTop: 4,
                  }}>
                    {label}
                  </span>
                  {!unlocked && (
                    <div style={{ position: "absolute", bottom: 4, right: 4 }}>
                      <Lock size={10} color="rgba(255,255,255,0.5)" />
                    </div>
                  )}
                  {isSelected && (
                    <div style={{
                      position: "absolute", top: 4, right: 4,
                      background: av.border, width: 14, height: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={8} color="#000" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#4a4760", marginTop: 12, letterSpacing: "1px" }}>
            🔒 HIGHER RANK EMBLEMS UNLOCK AS YOU RISE. KEEP HUNTING.
          </p>
        </div>

        {/* Hunter Record */}
        <div className="dash-enter" style={{
          background: "#13131f", border: "2px solid #2d2d44",
          boxShadow: "6px 6px 0 rgba(0,0,0,0.5)",
          padding: 24,
        }}>
          <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 16 }}>
            ■ HUNTER RECORD
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "TOTAL XP EARNED", value: xp.toLocaleString(), sub: "across all dungeons", color: "#a78bfa" },
              { label: "TARGETS ELIMINATED", value: totalVideos, sub: "videos completed", color: "#34d399" },
              { label: "DUNGEONS CLEARED", value: clearedCourses, sub: `of ${totalCourses} registered`, color: rankColor },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#0d0d18", border: "1px solid #2d2d44",
                padding: "16px 18px", borderLeft: `3px solid ${s.color}`,
              }}>
                <p style={{
                  fontFamily: "var(--font-system)", fontSize: 26, fontWeight: 700,
                  color: s.color, marginBottom: 6, textShadow: `0 0 10px ${s.color}30`,
                }}>
                  {s.value}
                </p>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 10, fontWeight: 700, letterSpacing: "1px", color: "#b0adc0", marginBottom: 2 }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#4a4760" }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
