"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { CourseDoc, ProgressDoc } from "@/lib/firebase/schema";
import AppShell from "@/components/AppShell";
import QuestCard from "@/components/course/QuestCard";
import ImportModal from "@/components/ImportModal";
import SystemAwakening from "@/components/SystemAwakening";
import ScheduleWidget from "@/components/dashboard/ScheduleWidget";
import {
  getHunterRank,
  getNextRankInfo,
  RANK_COLORS,
  getRankNumber,
} from "@/lib/utils/ranks";
import {
  Plus, Loader2, ChevronRight,
} from "lucide-react";
import SystemNotice, { Notice } from "@/components/SystemNotice";
import HunterRankIcon from "@/components/HunterRankIcon";

interface CourseWithProgress extends CourseDoc {
  id: string;
  completedCount: number;
}

// Build a 28-day heatmap: day index 0 = 27 days ago, 27 = today
function buildHeatmap(activityDates: string[]): number[] {
  const dateSet = new Set(activityDates);
  const cells: number[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    cells.push(dateSet.has(key) ? Math.floor(Math.random() * 3) + 2 : 0);
  }
  return cells;
}

// 7-column heatmap grid (4 weeks × 7 days)
function HeatmapGrid({ cells }: { cells: number[] }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 280 }}>
      {cells.map((level, i) => (
        <div
          key={i}
          className={`heat-cell${level > 0 ? ` heat-cell-${Math.min(level, 4)}` : ""}`}
          title={`Activity level: ${level}`}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [xp, setXp] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showAwakening, setShowAwakening] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [lastRank, setLastRank] = useState<string | null>(null);
  const [totalShadows, setTotalShadows] = useState(0);
  const [intAccuracy, setIntAccuracy] = useState<number | null>(null);

  // Show System Awakening once on first ever login
  useEffect(() => {
    if (!user) return;
    const key = `kurasu_awakened_${user.uid}`;
    if (!localStorage.getItem(key)) {
      setShowAwakening(true);
    }
  }, [user]);

  function handleAwakeningComplete() {
    if (user) localStorage.setItem(`kurasu_awakened_${user.uid}`, "1");
    setShowAwakening(false);
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  // Real-time user doc listener (XP + streak)
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data();
      const newXp = data?.xp || 0;
      setXp(newXp);
      setStreakCount(data?.streakCount || 0);
      setActivityDates(data?.activityDates || []);

      // Rank-up detection
      const newRank = getHunterRank(newXp);
      if (lastRank && lastRank !== newRank) {
        setNotice({ 
          type: "rank-up", 
          title: `Rank Up!`, 
          message: `The System acknowledges your growth. You are now Rank ${newRank}.`,
          rank: newRank 
        });
      }
      setLastRank(newRank);
    });
    return unsub;
  }, [user, lastRank]);

  // Real-time courses listener
  useEffect(() => {
    if (!user) return;
    const coursesRef = collection(db, "users", user.uid, "courses");
    const q = query(coursesRef, orderBy("createdAt", "desc"));

    const unsubCourses = onSnapshot(q, async (snap) => {
      const progressRef = collection(db, "users", user.uid, "progress");
      const progressSnap = await getDocs(progressRef);

      const completedByCourse: Record<string, number> = {};
      progressSnap.docs.forEach((d) => {
        const data = d.data() as ProgressDoc;
        if (data.completed) {
          completedByCourse[data.courseId] =
            (completedByCourse[data.courseId] || 0) + 1;
        }
      });

      const coursesData: CourseWithProgress[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as CourseDoc),
        completedCount: completedByCourse[d.id] || 0,
      }));

      setCourses(coursesData);
      setLoadingCourses(false);

      // Deadline warning — check if any course deadline is within 3 days
      const today = new Date();
      for (const c of coursesData) {
        if (!c.deadlineDate) continue;
        const deadline = new Date(c.deadlineDate);
        const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft >= 0) {
          const remaining = c.totalVideos - c.completedCount;
          setNotice({
            type: daysLeft <= 1 ? "warning" : "deadline",
            title: daysLeft === 0 ? "Deadline Today!" : `${daysLeft} Day${daysLeft > 1 ? "s" : ""} Remaining`,
            message: `${c.title} — ${remaining} target${remaining !== 1 ? "s" : ""} left to clear.`,
          });
          break;
        }
      }
    });

    return unsubCourses;
  }, [user]);

  // Shadow Army listener — drives INT stat
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "shadows");
    const unsub = onSnapshot(ref, (snap) => {
      const all = snap.docs.map((d) => d.data());
      setTotalShadows(all.length);
      const totalAttempts = all.reduce((a: number, s: any) => a + (s.attempts || 0), 0);
      const totalCorrect = all.reduce((a: number, s: any) => a + (s.correct || 0), 0);
      if (totalAttempts > 0) setIntAccuracy(Math.round((totalCorrect / totalAttempts) * 100));
    });
    return unsub;
  }, [user]);

  if (loading || !user) {
    return (
      <AppShell>
        <SystemNotice notice={notice} onDismiss={() => setNotice(null)} />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={32} color="var(--accent-bright)" className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  // Computed stats
  const { currentRank, nextRank, percentToNext, xpInCurrentRank, xpNeededForNext } = getNextRankInfo(xp);
  const rankColor = RANK_COLORS[currentRank];
  const completedCourses = courses.filter((c) => c.completedCount === c.totalVideos && c.totalVideos > 0);
  const inProgressCourses = courses.filter(
    (c) => c.completedCount > 0 && c.completedCount < c.totalVideos
  );
  const activeQuests = [...inProgressCourses, ...courses.filter((c) => c.completedCount === 0)].slice(0, 3);
  const heatmapCells = buildHeatmap(activityDates);


  const displayName = user.displayName?.split(" ")[0] || "Hunter";
  const initials = (user.displayName || user.email || "HN")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell>
      <SystemNotice notice={notice} onDismiss={() => setNotice(null)} />
      <div style={{ padding: "28px 32px 80px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>

        {/* ── Ambient dungeon atmosphere ── */}
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          {/* Large ambient glow orbs — like dungeon torches */}
          <div style={{
            position: "absolute", top: "5%", left: "15%", width: 300, height: 300,
            background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
            filter: "blur(40px)", animation: "pxPulse 8s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", bottom: "10%", right: "10%", width: 250, height: 250,
            background: "radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)",
            filter: "blur(40px)", animation: "pxPulse 10s ease-in-out infinite 2s",
          }} />
          <div style={{
            position: "absolute", top: "50%", left: "60%", width: 200, height: 200,
            background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)",
            filter: "blur(30px)", animation: "pxPulse 12s ease-in-out infinite 4s",
          }} />
        </div>

        {/* ── Floating pixel particles ── */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {[
            { left: "5%",  top: "8%",  dur: "8s",  del: "0s",   bg: "#a78bfa", sz: 4 },
            { left: "12%", top: "55%", dur: "12s", del: "1s",   bg: "#34d399", sz: 3 },
            { left: "22%", top: "25%", dur: "10s", del: "0.5s", bg: "#7c3aed", sz: 5 },
            { left: "30%", top: "70%", dur: "14s", del: "2.5s", bg: "#38bdf8", sz: 3 },
            { left: "40%", top: "12%", dur: "9s",  del: "1.8s", bg: "#a78bfa", sz: 4 },
            { left: "48%", top: "60%", dur: "11s", del: "0.3s", bg: "#34d399", sz: 6 },
            { left: "55%", top: "30%", dur: "13s", del: "3s",   bg: "#c084fc", sz: 3 },
            { left: "62%", top: "80%", dur: "8s",  del: "1.5s", bg: "#f59e0b", sz: 4 },
            { left: "70%", top: "15%", dur: "10s", del: "2s",   bg: "#7c3aed", sz: 5 },
            { left: "78%", top: "45%", dur: "12s", del: "0.8s", bg: "#34d399", sz: 3 },
            { left: "85%", top: "70%", dur: "9s",  del: "3.5s", bg: "#a78bfa", sz: 4 },
            { left: "92%", top: "20%", dur: "11s", del: "1.2s", bg: "#38bdf8", sz: 3 },
            { left: "18%", top: "40%", dur: "15s", del: "4s",   bg: "#c084fc", sz: 5 },
            { left: "35%", top: "90%", dur: "7s",  del: "0.7s", bg: "#34d399", sz: 3 },
            { left: "75%", top: "55%", dur: "10s", del: "2.8s", bg: "#7c3aed", sz: 4 },
            { left: "50%", top: "5%",  dur: "13s", del: "1.6s", bg: "#f59e0b", sz: 3 },
          ].map((p, i) => (
            <div key={i} className="dash-particle" style={{
              left: p.left, top: p.top, background: p.bg,
              width: p.sz, height: p.sz,
              boxShadow: `0 0 ${p.sz * 2}px ${p.bg}60`,
              animationDuration: p.dur, animationDelay: p.del,
            }} />
          ))}
        </div>

        {/* ── Header with system greeting ── */}
        <div className="dash-enter" style={{ marginBottom: 24 }}>
          {/* Decorative top bar */}
          <div style={{
            height: 3, marginBottom: 20,
            background: `repeating-linear-gradient(90deg, ${rankColor} 0, ${rankColor} 8px, transparent 8px, transparent 16px)`,
            opacity: 0.4,
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "3px", color: "#4a4760", marginBottom: 6 }}>
                SYSTEM INTERFACE v1.0 · {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
              </p>
              <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 26, fontWeight: 800 }}>
                Welcome back, <span style={{ color: rankColor }}>{displayName}</span>
              </h1>
              <p style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6880", letterSpacing: "1px", marginTop: 4 }}>
                {xp === 0 ? "THE SYSTEM AWAITS YOUR FIRST QUEST" : `${xp.toLocaleString()} XP ACCUMULATED · ${courses.length} DUNGEONS ACTIVE`}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* XP progress to next rank */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "1px", color: "#6b6880" }}>
                  {xpInCurrentRank.toLocaleString()} / {xpNeededForNext.toLocaleString()} XP → {nextRank}
                </span>
                <div style={{ width: 150, height: 10, background: "#1a1a2e", border: "2px solid #2d2d44", overflow: "hidden" }}>
                  <div style={{
                    width: `${percentToNext}%`, height: "100%",
                    background: `repeating-linear-gradient(90deg, ${rankColor} 0, ${rankColor} 4px, ${rankColor}88 4px, ${rankColor}88 8px)`,
                    transition: "width 0.5s steps(7,end)",
                  }} />
                </div>
              </div>

              {/* Rank badge */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(13,13,24,0.6)",
                border: `2px solid ${rankColor}`,
                boxShadow: `0 0 10px ${rankColor}30, 2px 2px 0 ${rankColor}44`,
                padding: "4px 8px",
                position: "relative",
              }}>
                <HunterRankIcon rank={getRankNumber(currentRank)} size={32} />
                <div style={{
                  marginLeft: 8,
                  fontFamily: "monospace",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "2px",
                  color: rankColor,
                }}>
                  RANK {currentRank}
                </div>
              </div>

              {/* Avatar with corner brackets */}
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: -3, left: -3, width: 8, height: 8, borderTop: `2px solid ${rankColor}`, borderLeft: `2px solid ${rankColor}` }} />
                <div style={{ position: "absolute", bottom: -3, right: -3, width: 8, height: 8, borderBottom: `2px solid ${rankColor}`, borderRight: `2px solid ${rankColor}` }} />
                <div style={{
                  width: 40, height: 40, border: `2px solid ${rankColor}`,
                  boxShadow: `3px 3px 0 ${rankColor}44`,
                  background: "#1a0a2e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: rankColor,
                }}>
                  {user.photoURL
                    ? <img src={user.photoURL} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} />
                    : initials
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat cards — animated, glowing pixel RPG style ── */}
        <div className="dash-enter" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28, animationDelay: "0.1s" }}>
          {[
            { cls: "stat-card-xp",     label: "TOTAL XP",   val: xp.toLocaleString(), sub: "XP EARNED",    color: "#a78bfa", shadow: "#3b0764", icon: "⚡" },
            { cls: "stat-card-streak", label: "DAY STREAK", val: `${streakCount}`,     sub: streakCount >= 7 ? "🔥 ON FIRE" : streakCount > 0 ? "ACTIVE" : "INACTIVE", color: "#f59e0b", shadow: "#78350f", icon: "🔥" },
            { cls: "stat-card-done",   label: "CLEARED",    val: `${completedCourses.length}`, sub: "DUNGEONS DONE", color: "#34d399", shadow: "#064e3b", icon: "⚔️" },
            { cls: "stat-card-quiz",   label: "HOURS",      val: "—",                   sub: "WATCH TIME",    color: "#38bdf8", shadow: "#075985", icon: "⏱" },
          ].map((s, i) => (
            <div key={s.label} className={`stat-card ${s.cls} stat-glow`}
              style={{
                padding: "16px 18px",
                position: "relative", overflow: "hidden",
                "--glow-color": s.color, "--glow-shadow": s.shadow,
                animationDelay: `${i * 0.6}s`,
              } as React.CSSProperties}
            >
              {/* Accent stripe top */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `repeating-linear-gradient(90deg, ${s.color} 0, ${s.color} 4px, transparent 4px, transparent 8px)` }} />
              {/* Inner glow */}
              <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "40%", background: `radial-gradient(ellipse at right, ${s.color}10, transparent)`, pointerEvents: "none" }} />
              {/* Icon watermark */}
              <div style={{ position: "absolute", bottom: -4, right: 6, fontSize: 36, opacity: 0.06, pointerEvents: "none" }}>{s.icon}</div>

              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "2px", color: "#6b6880", marginBottom: 8, position: "relative" }}>{s.label}</p>
              <p style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: "1px", marginBottom: 4, textShadow: `0 0 12px ${s.color}40`, position: "relative" }}>{s.val}</p>
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "1px", color: "#4a4760", position: "relative" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Active Quests ── */}
        <div className="dash-enter" style={{ marginBottom: 24, animationDelay: "0.2s" }}>
          {/* Section divider */}
          <div style={{ height: 2, marginBottom: 16, background: "repeating-linear-gradient(90deg, #2d2d44 0, #2d2d44 8px, transparent 8px, transparent 16px)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: "#b0adc0" }}>
              ▸ ACTIVE QUESTS
            </h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => setShowImport(true)}
                className="btn-primary"
                id="import-playlist-btn"
                style={{ fontSize: 11, padding: "8px 16px", letterSpacing: "1px" }}
              >
                <Plus size={13} />
                NEW GATE
              </button>
              {courses.length > 3 && (
                <button
                  onClick={() => router.push("/dungeons")}
                  className="btn-ghost"
                  style={{ color: "#a78bfa", fontSize: 11, letterSpacing: "1px" }}
                >
                  VIEW ALL <ChevronRight size={12} />
                </button>
              )}
            </div>
          </div>

          {loadingCourses ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[1, 2, 3].map((n) => (
                <div key={n} style={{ height: 220, background: "#13131f", border: "2px solid #2d2d44", boxShadow: "4px 4px 0 rgba(0,0,0,0.4)" }} />
              ))}
            </div>
          ) : activeQuests.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "48px 20px",
              border: "2px dashed #7c3aed", background: "rgba(124,58,237,0.03)",
              position: "relative", overflow: "hidden",
            }}>
              {/* Gate aura */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
              <p style={{ fontSize: 36, marginBottom: 14, position: "relative" }}>⚔️</p>
              <h3 style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: "2px", color: "#e8e6f0", marginBottom: 8, position: "relative" }}>
                NO ACTIVE DUNGEONS
              </h3>
              <p style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6880", letterSpacing: "1px", marginBottom: 20, position: "relative" }}>
                THE SYSTEM AWAITS YOUR FIRST QUEST
              </p>
              <button onClick={() => setShowImport(true)} className="btn-primary" style={{ position: "relative" }}>
                <Plus size={14} /> ENTER A GATE
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {activeQuests.map((course) => (
                <QuestCard key={course.id} course={course} completedCount={course.completedCount} />
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom row: Daily Quests + Streak ── */}
        <div className="dash-enter" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14, animationDelay: "0.3s" }}>

          {/* Hunter Schedule — pixel style */}
          <ScheduleWidget courses={courses} />

          {/* Streak — pixel style */}
          <div style={{ background: "#13131f", border: "2px solid #2d2d44", boxShadow: "4px 4px 0 rgba(0,0,0,0.4)", padding: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontFamily: "monospace", fontSize: 32, fontWeight: 700, color: "#f59e0b", textShadow: "0 0 12px rgba(245,158,11,0.4)" }}>{streakCount}</span>
              <div>
                <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "2px", color: "#6b6880" }}>DAY STREAK</p>
                <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "1px", color: streakCount >= 7 ? "#f59e0b" : "#4a4760" }}>
                  {streakCount >= 7 ? "🔥 ON FIRE" : `LONGEST: ${Math.max(streakCount, 1)}`}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 280 }}>
              {heatmapCells.map((level, i) => (
                <div key={i} style={{
                  width: 8, height: 8, border: "1px solid #2d2d44", imageRendering: "pixelated",
                  background: level === 0 ? "#1a1a2e" : level <= 1 ? "#3b0764" : level <= 2 ? "#7c3aed" : level <= 3 ? "#a78bfa" : "#c4b5fd",
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Hunter Status ── */}
        <div className="dash-enter" style={{
          background: "#13131f", border: "2px solid #2d2d44", boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
          padding: 22, position: "relative", overflow: "hidden", animationDelay: "0.4s",
        }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,58,237,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.025) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: "rgba(167,139,250,0.15)", animation: "pxScanline 4s linear infinite" }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "2px", color: "#6b6880", marginBottom: 4 }}>HUNTER STATUS</p>
                <p style={{ fontFamily: "monospace", fontSize: 10, color: "#4a4760", fontStyle: "italic" }}>The System has evaluated your attributes.</p>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(13,13,24,0.6)",
                border: `2px solid ${rankColor}`,
                boxShadow: `2px 2px 0 ${rankColor}44`,
                padding: "4px 12px",
              }}>
                <HunterRankIcon rank={getRankNumber(currentRank)} size={24} />
                <div style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "2px",
                  color: rankColor,
                }}>
                  RANK {currentRank} HUNTER
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { attr: "INT", value: intAccuracy !== null ? `${intAccuracy}%` : "—", sub: intAccuracy !== null ? `QUIZ ACCURACY` : "COMPLETE SKILL CHECKS", color: "#38bdf8", max: 0 },
                { attr: "PER", value: streakCount, sub: `${streakCount > 0 ? "ACTIVE" : "INACTIVE"} STREAK`, color: "#f59e0b", max: 30 },
                { attr: "STR", value: courses.reduce((a, c) => a + c.completedCount, 0), sub: "TARGETS ELIMINATED", color: "#34d399", max: 100 },
                { attr: "AGI", value: completedCourses.length, sub: "DUNGEONS CLEARED", color: "#a78bfa", max: 10 },
              ].map((stat) => (
                <div key={stat.attr} style={{ background: "#0d0d18", border: "1px solid #2d2d44", padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: stat.color, opacity: 0.7 }} />
                  <p style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "2px", color: stat.color, marginBottom: 6 }}>{stat.attr}</p>
                  <p style={{ fontFamily: "monospace", fontSize: 26, fontWeight: 700, color: "#e8e6f0", marginBottom: 6, textShadow: `0 0 8px ${stat.color}30` }}>{stat.value}</p>
                  {stat.max > 0 && (
                    <div style={{ background: "#1a1a2e", border: "1px solid #2d2d44", height: 6, marginBottom: 6, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, ((Number(stat.value) || 0) / stat.max) * 100)}%`, height: "100%", background: `repeating-linear-gradient(90deg, ${stat.color} 0, ${stat.color} 4px, ${stat.color}88 4px, ${stat.color}88 8px)` }} />
                    </div>
                  )}
                  <p style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "1px", color: "#4a4760" }}>{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showAwakening && <SystemAwakening onComplete={handleAwakeningComplete} />}
    </AppShell>
  );
}
