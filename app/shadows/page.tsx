"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ShadowDoc, calcNextReview, isDue } from "@/lib/utils/shadows";
import { Loader2, Skull, Brain, Swords, CheckCircle2, XCircle, RotateCcw, Trash2 } from "lucide-react";
import { getNextRankInfo, RANK_COLORS } from "@/lib/utils/ranks";

type ReviewMode = "gallery" | "session";

export default function ShadowArmyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shadows, setShadows] = useState<ShadowDoc[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [mode, setMode] = useState<ReviewMode>("gallery");
  const [xp, setXp] = useState(0);

  // Session state
  const [sessionQueue, setSessionQueue] = useState<ShadowDoc[]>([]);
  const [sessionIdx, setSessionIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<{ correct: number; total: number }>({ correct: 0, total: 0 });
  const [sessionDone, setSessionDone] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const ref = collection(db, "users", user.uid, "shadows");
    const q = query(ref, orderBy("nextReview", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setShadows(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShadowDoc)));
      setPageLoading(false);
    });
    return unsub;
  }, [user]);

  const dueShadows = shadows.filter(isDue);
  const futureShadows = shadows.filter((s) => !isDue(s));

  function startSession() {
    setSessionQueue([...dueShadows]);
    setSessionIdx(0);
    setRevealed(false);
    setSelectedAnswer(null);
    setSessionResults({ correct: 0, total: 0 });
    setSessionDone(false);
    setMode("session");
  }

  async function handleAnswer(quality: 0 | 1 | 2) {
    if (!user) return;
    const shadow = sessionQueue[sessionIdx];
    const isCorrect = quality > 0;

    const { ease, interval, nextReview } = calcNextReview(shadow.ease, shadow.interval, quality);

    await updateDoc(doc(db, "users", user.uid, "shadows", shadow.id!), {
      ease,
      interval,
      nextReview,
      attempts: (shadow.attempts || 0) + 1,
      correct: (shadow.correct || 0) + (isCorrect ? 1 : 0),
    });

    setSessionResults((r) => ({
      correct: r.correct + (isCorrect ? 1 : 0),
      total: r.total + 1,
    }));

    const next = sessionIdx + 1;
    if (next >= sessionQueue.length) {
      setSessionDone(true);
    } else {
      setSessionIdx(next);
      setRevealed(false);
      setSelectedAnswer(null);
    }
  }

  async function deleteShadow(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "shadows", id));
  }

  if (loading || pageLoading) {
    return (
      <AppShell>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={32} color="#7c3aed" className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: "28px 32px 80px", maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div className="dash-enter" style={{ marginBottom: 24 }}>
          <div style={{ height: 3, marginBottom: 16, background: "repeating-linear-gradient(90deg, #a78bfa 0, #a78bfa 8px, transparent 8px, transparent 16px)", opacity: 0.4 }} />
          <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#4a4760", marginBottom: 6 }}>
            SYSTEM INTERFACE · SHADOW EXTRACTION
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 800, color: "#e8e6f0" }}>
              Shadow Army
            </h1>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setMode("gallery")}
                style={{
                  padding: "8px 16px", fontFamily: "var(--font-system)", fontSize: 10,
                  letterSpacing: "2px", border: `2px solid ${mode === "gallery" ? "#7c3aed" : "#2d2d44"}`,
                  background: mode === "gallery" ? "rgba(124,58,237,0.15)" : "transparent",
                  color: mode === "gallery" ? "#a78bfa" : "#6b6880", cursor: "pointer",
                  boxShadow: mode === "gallery" ? "3px 3px 0 #3b0764" : "none",
                }}
              >
                GALLERY
              </button>
              {dueShadows.length > 0 && (
                <button onClick={startSession} className="btn-primary" style={{ fontSize: 10, letterSpacing: "2px" }}>
                  <Swords size={14} />
                  REVIEW ({dueShadows.length} DUE)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Session Mode */}
        {mode === "session" && (
          <div className="dash-enter">
            {sessionDone ? (
              /* Session Complete */
              <div style={{
                background: "#13131f", border: "2px solid #7c3aed",
                boxShadow: "6px 6px 0 #3b0764", padding: 40,
                textAlign: "center", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 8px, transparent 8px, transparent 16px)" }} />
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#7c3aed", marginBottom: 8 }}>
                  SHADOW PURGE COMPLETE
                </p>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 28, fontWeight: 800, color: "#e8e6f0", marginBottom: 20 }}>
                  {sessionResults.correct}/{sessionResults.total} Shadows Dominated
                </p>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 24 }}>
                  <div style={{ background: "#0d0d18", border: "1px solid #2d2d44", padding: "12px 24px", borderLeft: "3px solid #34d399" }}>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 24, fontWeight: 700, color: "#34d399" }}>{sessionResults.correct}</p>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", color: "#4a4760" }}>DOMINATED</p>
                  </div>
                  <div style={{ background: "#0d0d18", border: "1px solid #2d2d44", padding: "12px 24px", borderLeft: "3px solid #dc2626" }}>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 24, fontWeight: 700, color: "#dc2626" }}>{sessionResults.total - sessionResults.correct}</p>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", color: "#4a4760" }}>RESISTED</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => setMode("gallery")} className="btn-ghost" style={{ color: "#6b6880", fontSize: 10, letterSpacing: "1px" }}>
                    RETURN TO ARMY
                  </button>
                  {dueShadows.length > 0 && (
                    <button onClick={startSession} className="btn-primary" style={{ fontSize: 10, letterSpacing: "1px" }}>
                      <RotateCcw size={13} /> REVIEW AGAIN
                    </button>
                  )}
                </div>
              </div>
            ) : sessionQueue.length > 0 ? (
              /* Active Card */
              <div>
                {/* Progress bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "2px", color: "#6b6880" }}>
                      SHADOW {sessionIdx + 1} OF {sessionQueue.length}
                    </span>
                    <span style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#7c3aed" }}>
                      {sessionResults.correct} DOMINATED
                    </span>
                  </div>
                  <div style={{ background: "#1a1a2e", border: "2px solid #2d2d44", height: 8 }}>
                    <div style={{
                      width: `${((sessionIdx) / sessionQueue.length) * 100}%`, height: "100%",
                      background: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 4px, #a78bfa 4px, #a78bfa 8px)",
                      transition: "width 0.3s",
                    }} />
                  </div>
                </div>

                {/* Card */}
                {(() => {
                  const shadow = sessionQueue[sessionIdx];
                  return (
                    <div style={{
                      background: "#13131f", border: "2px solid #2d2d44",
                      boxShadow: "6px 6px 0 rgba(0,0,0,0.5)", padding: 28,
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 6px, transparent 6px, transparent 12px)" }} />
                      
                      {/* Source */}
                      <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "2px", color: "#4a4760", marginBottom: 14 }}>
                        <Skull size={10} style={{ display: "inline", marginRight: 6 }} />
                        SHADOW FROM: {shadow.sourceTitle?.toUpperCase()}
                      </p>

                      {/* Question */}
                      <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "#e8e6f0", marginBottom: 20, lineHeight: 1.5 }}>
                        {shadow.question}
                      </p>

                      {/* Options */}
                      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
                        {shadow.options.map((opt) => {
                          const isSelected = selectedAnswer === opt;
                          const isCorrect = opt === shadow.answer;
                          let bg = "#0d0d18";
                          let borderC = "#2d2d44";
                          let color = "#9d9ab0";

                          if (revealed) {
                            if (isCorrect) { bg = "rgba(52,211,153,0.12)"; borderC = "#34d399"; color = "#34d399"; }
                            else if (isSelected) { bg = "rgba(220,38,38,0.1)"; borderC = "#dc2626"; color = "#dc2626"; }
                          } else if (isSelected) {
                            bg = "rgba(124,58,237,0.12)"; borderC = "#7c3aed"; color = "#a78bfa";
                          }

                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                if (!revealed) {
                                  setSelectedAnswer(opt);
                                  setRevealed(true);
                                }
                              }}
                              style={{
                                textAlign: "left", padding: "12px 16px",
                                background: bg, border: `2px solid ${borderC}`, color,
                                fontSize: 14, cursor: revealed ? "default" : "pointer",
                                display: "flex", alignItems: "center", gap: 12,
                                transition: "all 0.15s",
                                boxShadow: revealed && isCorrect ? "3px 3px 0 #05653344" : "none",
                              }}
                            >
                              <div style={{ width: 8, height: 8, border: `2px solid ${isSelected && !revealed ? "#7c3aed" : borderC}`, background: isSelected && !revealed ? "#7c3aed" : "transparent", flexShrink: 0 }} />
                              {opt}
                              {revealed && isCorrect && <CheckCircle2 size={16} style={{ marginLeft: "auto" }} />}
                              {revealed && isSelected && !isCorrect && <XCircle size={16} style={{ marginLeft: "auto" }} />}
                            </button>
                          );
                        })}
                      </div>

                      {/* SRS Buttons — only show after reveal */}
                      {revealed && (
                        <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: "1px solid #2d2d44" }}>
                          <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", color: "#4a4760", flex: 1, alignSelf: "center" }}>
                            HOW WELL DID YOU KNOW THIS?
                          </p>
                          <button onClick={() => handleAnswer(0)} style={{ padding: "8px 14px", background: "rgba(220,38,38,0.1)", border: "2px solid #dc2626", color: "#dc2626", fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", cursor: "pointer" }}>
                            AGAIN
                          </button>
                          <button onClick={() => handleAnswer(1)} style={{ padding: "8px 14px", background: "rgba(245,158,11,0.1)", border: "2px solid #f59e0b", color: "#f59e0b", fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", cursor: "pointer" }}>
                            HARD
                          </button>
                          <button onClick={() => handleAnswer(2)} style={{ padding: "8px 14px", background: "rgba(52,211,153,0.1)", border: "2px solid #34d399", color: "#34d399", fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", cursor: "pointer" }}>
                            EASY
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </div>
        )}

        {/* Gallery Mode */}
        {mode === "gallery" && (
          <div>
            {shadows.length === 0 ? (
              /* Empty state */
              <div style={{
                textAlign: "center", padding: "60px 20px",
                border: "2px dashed #7c3aed44", background: "rgba(124,58,237,0.02)",
              }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>💀</div>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#7c3aed", marginBottom: 8 }}>
                  NO SHADOWS EXTRACTED YET
                </p>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 11, color: "#6b6880", maxWidth: 320, margin: "0 auto", lineHeight: 1.7 }}>
                  Shadows are extracted from quiz questions you answer incorrectly. Complete skill checks in the System Intelligence panel to build your army.
                </p>
              </div>
            ) : (
              <div>
                {/* Stats bar */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                  {[
                    { label: "TOTAL SHADOWS", value: shadows.length, color: "#a78bfa" },
                    { label: "DUE TODAY", value: dueShadows.length, color: dueShadows.length > 0 ? "#f59e0b" : "#34d399" },
                    {
                      label: "ACCURACY",
                      value: shadows.reduce((a, s) => a + s.attempts, 0) > 0
                        ? `${Math.round((shadows.reduce((a, s) => a + s.correct, 0) / shadows.reduce((a, s) => a + s.attempts, 0)) * 100)}%`
                        : "—",
                      color: "#38bdf8",
                    },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#13131f", border: "2px solid #2d2d44", padding: "14px 18px", borderLeft: `3px solid ${s.color}` }}>
                      <p style={{ fontFamily: "var(--font-system)", fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</p>
                      <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", color: "#4a4760" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Due Now */}
                {dueShadows.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#f59e0b", marginBottom: 12 }}>
                      ▸ AWAITING DOMINATION — {dueShadows.length} SHADOWS DUE
                    </p>
                    <div style={{ display: "grid", gap: 8 }}>
                      {dueShadows.map((s) => (
                        <ShadowCard key={s.id} shadow={s} onDelete={() => deleteShadow(s.id!)} isDue />
                      ))}
                    </div>
                  </div>
                )}

                {/* Future */}
                {futureShadows.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 12 }}>
                      ▸ DORMANT SHADOWS — {futureShadows.length} RESTING
                    </p>
                    <div style={{ display: "grid", gap: 8 }}>
                      {futureShadows.map((s) => (
                        <ShadowCard key={s.id} shadow={s} onDelete={() => deleteShadow(s.id!)} isDue={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ShadowCard({ shadow, onDelete, isDue }: { shadow: ShadowDoc; onDelete: () => void; isDue: boolean }) {
  const accuracy = shadow.attempts > 0 ? Math.round((shadow.correct / shadow.attempts) * 100) : null;
  return (
    <div style={{
      background: "#13131f", border: `2px solid ${isDue ? "#f59e0b44" : "#2d2d44"}`,
      padding: "14px 18px", display: "flex", alignItems: "center", gap: 16,
      boxShadow: isDue ? "3px 3px 0 #78350f44" : "3px 3px 0 rgba(0,0,0,0.3)",
      position: "relative",
    }}>
      {isDue && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "#f59e0b" }} />}
      <div style={{ fontSize: 20, opacity: isDue ? 1 : 0.4 }}>💀</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600, color: "#e8e6f0", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {shadow.question}
        </p>
        <p style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#6b6880", letterSpacing: "1px" }}>
          ✓ {shadow.answer} · {shadow.sourceTitle}
        </p>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
        {accuracy !== null && (
          <span style={{ fontFamily: "var(--font-system)", fontSize: 11, color: accuracy >= 70 ? "#34d399" : "#dc2626" }}>{accuracy}%</span>
        )}
        <span style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", color: isDue ? "#f59e0b" : "#4a4760" }}>
          {isDue ? "DUE" : `IN ${shadow.interval}D`}
        </span>
        <button onClick={onDelete} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#4a4760", display: "flex", padding: 4 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#dc2626")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4a4760")}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
