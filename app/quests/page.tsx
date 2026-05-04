"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, increment, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import AppShell from "@/components/AppShell";
import { CourseDoc, VideoDoc } from "@/lib/firebase/schema";
import { ShadowDoc } from "@/lib/utils/shadows";
import { Loader2, Zap, CheckCircle2, XCircle, RotateCcw, Skull } from "lucide-react";
import CategoryPicker, { type CategoryId } from "@/components/quiz/CategoryPicker";
import VideoSelector from "@/components/quiz/VideoSelector";

interface Question { question: string; options: string[]; answer: string; explanation: string; }
interface QuizResult { courseId: string; courseTitle: string; questions: Question[]; difficulty: string; }
type Screen = "lobby" | "generating" | "quiz" | "results";

const DIFFICULTY_OPTIONS = [
  { id: "easy",   label: "E-RANK",  color: "#6b7280", desc: "Basic recall" },
  { id: "mixed",  label: "B-RANK",  color: "#10b981", desc: "Mixed levels" },
  { id: "hard",   label: "S-RANK",  color: "#9d4edd", desc: "Deep mastery" },
];

export default function QuestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>("lobby");
  const [courses, setCourses] = useState<(CourseDoc & { id: string })[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [videos, setVideos] = useState<(VideoDoc & { id: string })[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [chosen, setChosen] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedCount, setExtractedCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [user, loading, router]);

  // Load courses
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "courses"), (snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CourseDoc & { id: string })));
    });
    return unsub;
  }, [user]);

  // Load videos when a course is selected
  useEffect(() => {
    if (!user || !selectedCourse) { setVideos([]); setSelectedVideoIds(new Set()); return; }
    setVideosLoading(true);
    const q = query(collection(db, "users", user.uid, "courses", selectedCourse, "videos"), orderBy("position"));
    getDocs(q).then((snap) => {
      const vids = snap.docs.map((d) => ({ id: d.id, ...d.data() } as VideoDoc & { id: string }));
      setVideos(vids);
      setSelectedVideoIds(new Set(vids.map((v) => v.id))); // default: all selected
      setVideosLoading(false);
    });
  }, [user, selectedCourse]);

  // Timer per question
  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) { handleReveal(); return; }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, timerActive]);

  async function generateQuiz() {
    if (!selectedCourse || !user) return;
    setScreen("generating");
    setError(null);
    try {
      const token = await getIdToken(auth.currentUser!);
      const videoIds = selectedVideoIds.size > 0 && selectedVideoIds.size < videos.length
        ? Array.from(selectedVideoIds)
        : undefined; // undefined = use all
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: selectedCourse, difficulty, count: questionCount, videoIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      setQuiz(data);
      setCurrentQ(0);
      setChosen({});
      setRevealed(false);
      setTimeLeft(30);
      setTimerActive(true);
      setScreen("quiz");
    } catch (err: any) {
      setError(err.message);
      setScreen("lobby");
    }
  }

  function selectAnswer(opt: string) {
    if (revealed || !quiz) return;
    setChosen((p) => ({ ...p, [currentQ]: opt }));
    handleReveal();
  }

  function handleReveal() {
    setTimerActive(false);
    setRevealed(true);
  }

  async function nextQuestion() {
    if (!quiz) return;
    if (currentQ + 1 >= quiz.questions.length) {
      await finishQuiz();
    } else {
      setCurrentQ((p) => p + 1);
      setRevealed(false);
      setTimeLeft(30);
      setTimerActive(true);
    }
  }

  async function finishQuiz() {
    if (!quiz || !user) return;
    setTimerActive(false);
    setScreen("results");

    // Calculate score
    const correct = quiz.questions.filter((q, i) => chosen[i] === q.answer).length;
    const pct = Math.round((correct / quiz.questions.length) * 100);
    const baseXp = Math.round(correct * (difficulty === "hard" ? 25 : difficulty === "easy" ? 10 : 15));
    setXpEarned(baseXp);

    // Award XP
    if (baseXp > 0) {
      await updateDoc(doc(db, "users", user.uid), { xp: increment(baseXp) });
    }

    // Extract wrong answers to Shadow Army
    let shadows = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (chosen[i] !== q.answer) {
        await addDoc(collection(db, "users", user.uid, "shadows"), {
          question: q.question,
          options: q.options,
          answer: q.answer,
          sourceTitle: quiz.courseTitle,
          courseId: quiz.courseId,
          videoId: "quiz",
          ease: 2.5, interval: 1,
          nextReview: new Date().toISOString().split("T")[0],
          attempts: 0, correct: 0,
          extractedAt: serverTimestamp(),
        } as Omit<ShadowDoc, "id">);
        shadows++;
      }
    }
    setExtractedCount(shadows);
  }

  function resetQuiz() {
    setQuiz(null);
    setCurrentQ(0);
    setChosen({});
    setRevealed(false);
    setTimerActive(false);
    setError(null);
    setScreen("lobby");
  }

  if (loading || !user) {
    return <AppShell><div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={32} color="#7c3aed" className="animate-spin" /></div></AppShell>;
  }

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  return (
    <AppShell>
      <div style={{ padding: "28px 32px 80px", maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div className="dash-enter" style={{ marginBottom: 24 }}>
          <div style={{ height: 3, marginBottom: 16, background: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 8px, transparent 8px, transparent 16px)", opacity: 0.4 }} />
          <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#4a4760", marginBottom: 6 }}>SYSTEM INTERFACE · SKILL ASSESSMENT</p>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 800, color: "#e8e6f0" }}>
            {screen === "lobby" ? "Quiz Arena" : screen === "generating" ? "Generating Quiz..." : screen === "results" ? "Assessment Complete" : quiz?.courseTitle || "Quiz"}
          </h1>
        </div>

        {/* ── LOBBY ── */}
        {screen === "lobby" && (
          <div className="dash-enter">
            {error && (
              <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(220,38,38,0.08)", border: "1px solid #dc262644", borderLeft: "3px solid #dc2626" }}>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "2px", color: "#dc2626", marginBottom: 4 }}>SYSTEM ERROR</p>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 11, color: "#9d9ab0" }}>{error}</p>
              </div>
            )}

            {/* ── Step 1: Category ── */}
            <CategoryPicker selected={selectedCategory} onChange={setSelectedCategory} />

            {/* ── Step 2: Course ── */}
            <div style={{ background: "#13131f", border: "2px solid #2d2d44", padding: 20, marginBottom: 16 }}>
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 14 }}>■ SELECT DUNGEON TO ASSESS</p>
              {courses.length === 0 ? (
                <p style={{ fontFamily: "monospace", fontSize: 11, color: "#4a4760" }}>No dungeons found. Import a course first.</p>
              ) : (
                <div style={{ display: "grid", gap: 6 }}>
                  {courses.map((c) => {
                    const active = selectedCourse === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCourse(c.id!)}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 14px", textAlign: "left",
                          background: active ? "rgba(124,58,237,0.15)" : "#0d0d18",
                          border: `2px solid ${active ? "var(--accent,#7c3aed)" : "#2d2d44"}`,
                          boxShadow: active ? "3px 3px 0 rgba(0,0,0,0.5)" : "none",
                          cursor: "pointer", transition: "all 0.1s",
                        }}
                      >
                        {c.thumbnailUrl && <img src={c.thumbnailUrl} alt="" style={{ width: 40, height: 28, objectFit: "cover", flexShrink: 0, border: "1px solid #2d2d44" }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, color: "#e8e6f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                          <p style={{ fontFamily: "monospace", fontSize: 9, color: "#6b6880", letterSpacing: "1px", marginTop: 2 }}>{c.totalVideos} TARGETS</p>
                        </div>
                        {active && <div style={{ width: 8, height: 8, background: "var(--accent,#7c3aed)", flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Step 3: Lecture selection (shown only after course picked) ── */}
            {selectedCourse && (
              videosLoading
                ? <div style={{ background: "#13131f", border: "2px solid #2d2d44", padding: 20, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <Loader2 size={14} color="#7c3aed" className="animate-spin" />
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6880", letterSpacing: "1px" }}>LOADING LECTURES...</span>
                  </div>
                : <VideoSelector videos={videos} selectedIds={selectedVideoIds} onChange={setSelectedVideoIds} />
            )}

            {/* Settings */}
            <div style={{ background: "#13131f", border: "2px solid #2d2d44", padding: 24, marginBottom: 16 }}>
              <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 14 }}>■ DIFFICULTY</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    style={{
                      flex: 1, padding: "12px 8px", textAlign: "center",
                      background: difficulty === d.id ? `${d.color}18` : "#0d0d18",
                      border: `2px solid ${difficulty === d.id ? d.color : "#2d2d44"}`,
                      boxShadow: difficulty === d.id ? `3px 3px 0 ${d.color}44` : "none",
                      cursor: "pointer", transition: "all 0.1s",
                    }}
                  >
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 11, fontWeight: 700, color: difficulty === d.id ? d.color : "#6b6880", letterSpacing: "2px", marginBottom: 4 }}>{d.label}</p>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#4a4760" }}>{d.desc}</p>
                  </button>
                ))}
              </div>

              <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 10 }}>■ QUESTIONS: {questionCount}</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    style={{
                      flex: 1, padding: "8px 0",
                      background: questionCount === n ? "rgba(124,58,237,0.15)" : "#0d0d18",
                      border: `2px solid ${questionCount === n ? "#7c3aed" : "#2d2d44"}`,
                      color: questionCount === n ? "#a78bfa" : "#6b6880",
                      fontFamily: "var(--font-system)", fontSize: 11, fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>

            <button
              onClick={generateQuiz}
              disabled={!selectedCourse}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: 12, letterSpacing: "2px", padding: "14px 0", opacity: !selectedCourse ? 0.4 : 1 }}
            >
              <Zap size={16} /> GENERATE QUIZ
            </button>

            <p style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#4a4760", textAlign: "center", marginTop: 10, letterSpacing: "1px" }}>
              Each correct answer earns XP. Wrong answers become Shadows.
            </p>
          </div>
        )}

        {/* ── GENERATING ── */}
        {screen === "generating" && (
          <div className="dash-enter" style={{ background: "#13131f", border: "2px solid #2d2d44", padding: 48, textAlign: "center" }}>
            <Loader2 size={36} color="#7c3aed" className="animate-spin" style={{ margin: "0 auto 20px" }} />
            <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#7c3aed", marginBottom: 8 }}>THE SYSTEM IS SCANNING YOUR DUNGEON</p>
            <p style={{ fontFamily: "var(--font-system)", fontSize: 11, color: "#6b6880" }}>Generating {questionCount} questions from {selectedCourseData?.title}...</p>
          </div>
        )}

        {/* ── QUIZ ── */}
        {screen === "quiz" && quiz && (
          <div className="dash-enter">
            {/* Progress + timer */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "2px", color: "#6b6880" }}>
                  QUESTION {currentQ + 1} / {quiz.questions.length}
                </span>
                <div style={{
                  fontFamily: "var(--font-system)", fontSize: 11, fontWeight: 700,
                  color: timeLeft <= 10 ? "#dc2626" : "#a78bfa",
                  padding: "4px 10px", border: `2px solid ${timeLeft <= 10 ? "#dc2626" : "#7c3aed"}`,
                  boxShadow: timeLeft <= 10 ? "2px 2px 0 #7f1d1d44" : "2px 2px 0 #3b076444",
                }}>
                  {timeLeft}s
                </div>
              </div>
              <div style={{ background: "#1a1a2e", border: "2px solid #2d2d44", height: 8 }}>
                <div style={{
                  width: `${((currentQ) / quiz.questions.length) * 100}%`, height: "100%",
                  background: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 4px, #a78bfa 4px, #a78bfa 8px)",
                  transition: "width 0.3s",
                }} />
              </div>
            </div>

            {/* Question card */}
            <div style={{ background: "#13131f", border: "2px solid #2d2d44", boxShadow: "6px 6px 0 rgba(0,0,0,0.5)", padding: 28, marginBottom: 12 }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 6px, transparent 6px, transparent 12px)" }} />
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700, color: "#e8e6f0", marginBottom: 20, lineHeight: 1.6 }}>
                {quiz.questions[currentQ].question}
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {quiz.questions[currentQ].options.map((opt) => {
                  const isChosen = chosen[currentQ] === opt;
                  const isCorrect = opt === quiz.questions[currentQ].answer;
                  let bg = "#0d0d18", border = "2px solid #2d2d44", color = "#9d9ab0";
                  if (revealed) {
                    if (isCorrect) { bg = "rgba(52,211,153,0.12)"; border = "2px solid #34d399"; color = "#34d399"; }
                    else if (isChosen) { bg = "rgba(220,38,38,0.1)"; border = "2px solid #dc2626"; color = "#dc2626"; }
                  } else if (isChosen) {
                    bg = "rgba(124,58,237,0.12)"; border = "2px solid #7c3aed"; color = "#a78bfa";
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => selectAnswer(opt)}
                      style={{
                        textAlign: "left", padding: "12px 16px", background: bg, border, color,
                        fontSize: 14, cursor: revealed ? "default" : "pointer",
                        display: "flex", alignItems: "center", gap: 12, transition: "all 0.12s",
                      }}
                    >
                      <div style={{ width: 8, height: 8, border: `2px solid ${isChosen && !revealed ? "#7c3aed" : border.replace("2px solid ", "")}`, background: isChosen && !revealed ? "#7c3aed" : "transparent", flexShrink: 0 }} />
                      {opt}
                      {revealed && isCorrect && <CheckCircle2 size={16} style={{ marginLeft: "auto" }} />}
                      {revealed && isChosen && !isCorrect && <XCircle size={16} style={{ marginLeft: "auto" }} />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation after reveal */}
              {revealed && quiz.questions[currentQ].explanation && (
                <div style={{ marginTop: 16, padding: "10px 14px", background: "#0d0d18", border: "1px solid #2d2d44", borderLeft: "3px solid #7c3aed" }}>
                  <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "2px", color: "#7c3aed", marginBottom: 4 }}>SYSTEM ANALYSIS</p>
                  <p style={{ fontFamily: "var(--font-system)", fontSize: 11, color: "#9d9ab0", lineHeight: 1.6 }}>{quiz.questions[currentQ].explanation}</p>
                </div>
              )}
            </div>

            {revealed && (
              <button onClick={nextQuestion} className="btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 11, letterSpacing: "2px" }}>
                {currentQ + 1 >= quiz.questions.length ? "FINISH ASSESSMENT" : "NEXT QUESTION"} →
              </button>
            )}
          </div>
        )}

        {/* ── RESULTS ── */}
        {screen === "results" && quiz && (() => {
          const correct = quiz.questions.filter((q, i) => chosen[i] === q.answer).length;
          const pct = Math.round((correct / quiz.questions.length) * 100);
          const grade = pct >= 90 ? { label: "S-RANK", color: "#9d4edd" } : pct >= 75 ? { label: "A-RANK", color: "#06b6d4" } : pct >= 60 ? { label: "B-RANK", color: "#10b981" } : pct >= 40 ? { label: "C-RANK", color: "#3b82f6" } : { label: "E-RANK", color: "#6b7280" };
          return (
            <div className="dash-enter">
              {/* Grade card */}
              <div style={{
                background: "#13131f", border: `2px solid ${grade.color}`,
                boxShadow: `6px 6px 0 ${grade.color}44`,
                padding: 32, textAlign: "center", marginBottom: 16, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `repeating-linear-gradient(90deg, ${grade.color} 0, ${grade.color} 8px, transparent 8px, transparent 16px)` }} />
                <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: grade.color, marginBottom: 8 }}>ASSESSMENT COMPLETE</p>
                <div style={{ fontFamily: "var(--font-system)", fontSize: 13, fontWeight: 700, letterSpacing: "3px", color: grade.color, border: `2px solid ${grade.color}`, boxShadow: `3px 3px 0 ${grade.color}44`, padding: "6px 16px", display: "inline-block", marginBottom: 16 }}>
                  {grade.label}
                </div>
                <p style={{ fontFamily: "var(--font-heading)", fontSize: 40, fontWeight: 800, color: "#e8e6f0", marginBottom: 4 }}>{pct}%</p>
                <p style={{ fontFamily: "var(--font-system)", fontSize: 11, color: "#6b6880" }}>{correct} / {quiz.questions.length} correct</p>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "XP EARNED", value: `+${xpEarned}`, color: "#a78bfa" },
                  { label: "CORRECT", value: correct, color: "#34d399" },
                  { label: "SHADOWS", value: extractedCount, color: extractedCount > 0 ? "#f59e0b" : "#4a4760" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "#13131f", border: "2px solid #2d2d44", padding: "14px 16px", borderLeft: `3px solid ${s.color}` }}>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</p>
                    <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "1px", color: "#4a4760" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Review wrong answers */}
              {quiz.questions.some((q, i) => chosen[i] !== q.answer) && (
                <div style={{ background: "#13131f", border: "2px solid #2d2d44", padding: 20, marginBottom: 16 }}>
                  <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 12 }}>■ MISSED TARGETS — EXTRACTED TO SHADOW ARMY</p>
                  <div style={{ display: "grid", gap: 8 }}>
                    {quiz.questions.map((q, i) => {
                      if (chosen[i] === q.answer) return null;
                      return (
                        <div key={i} style={{ padding: "10px 14px", background: "#0d0d18", border: "1px solid #dc262644", borderLeft: "3px solid #dc2626" }}>
                          <p style={{ fontFamily: "var(--font-heading)", fontSize: 12, fontWeight: 600, color: "#e8e6f0", marginBottom: 4 }}>{q.question}</p>
                          <p style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#34d399" }}>✓ {q.answer}</p>
                          {chosen[i] && <p style={{ fontFamily: "var(--font-system)", fontSize: 9, color: "#dc2626" }}>✗ {chosen[i]}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={resetQuiz} className="btn-ghost" style={{ flex: 1, justifyContent: "center", color: "#6b6880", fontSize: 11, letterSpacing: "1px" }}>
                  <RotateCcw size={13} /> NEW QUIZ
                </button>
                {extractedCount > 0 && (
                  <a href="/shadows" style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px", background: "rgba(124,58,237,0.1)", border: "2px solid #7c3aed44",
                    color: "#a78bfa", fontFamily: "var(--font-system)", fontSize: 10, letterSpacing: "1px", textDecoration: "none",
                  }}>
                    <Skull size={13} /> REVIEW {extractedCount} SHADOWS
                  </a>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </AppShell>
  );
}
