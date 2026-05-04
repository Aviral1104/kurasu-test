"use client";

import { useState, useEffect } from "react";
import { Loader2, Zap, Brain, ListChecks, HelpCircle, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { getIdToken } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc, collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { ShadowDoc } from "@/lib/utils/shadows";

interface Intel {
  summary: string;
  keyPoints: string[];
  quiz: {
    question: string;
    options: string[];
    answer: string;
  }[];
}

interface Props {
  videoId: string;
  courseId: string;
  ytVideoId: string;
}

export default function VideoIntel({ videoId, courseId, ytVideoId }: Props) {
  const { user } = useAuth();
  const [intel, setIntel] = useState<Intel | null>(null);
  const [manualNotes, setManualNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "notes" | "quiz">("summary");
  const [quizState, setQuizState] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [extractedShadows, setExtractedShadows] = useState<number>(0);
  const [shadowToast, setShadowToast] = useState(false);

  // Load existing intel from Firestore
  useEffect(() => {
    if (!user || !courseId || !videoId) return;

    const intelRef = doc(db, "users", user.uid, "courses", courseId, "videos", videoId, "notes", "intel");
    
    // Use onSnapshot for real-time updates if user generates it
    const unsub = onSnapshot(intelRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIntel(data as Intel);
        if (data.manualContent) setManualNotes(data.manualContent);
      } else {
        setIntel(null);
      }
    });

    return () => unsub();
  }, [user, courseId, videoId]);

  const saveManualNotes = async () => {
    if (!user || !courseId || !videoId) return;
    setIsSaving(true);
    try {
      const token = await getIdToken(auth.currentUser!);
      await fetch(`/api/courses/${courseId}/videos/${videoId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: manualNotes }),
      });
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const generateIntel = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId, courseId, ytVideoId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate intel");
      setIntel(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Extract wrong answers as Shadows for SRS review
  async function extractShadows() {
    if (!user || !intel) return;
    let extracted = 0;
    for (const [idx, chosen] of Object.entries(quizState)) {
      const q = intel.quiz[Number(idx)];
      if (chosen !== q.answer) {
        await addDoc(collection(db, "users", user.uid, "shadows"), {
          question: q.question,
          options: q.options,
          answer: q.answer,
          sourceTitle: document.title.replace(" | Kurasu", ""),
          courseId,
          videoId,
          ease: 2.5,
          interval: 1,
          nextReview: new Date().toISOString().split("T")[0],
          attempts: 0,
          correct: 0,
          extractedAt: serverTimestamp(),
        } as Omit<ShadowDoc, "id">);
        extracted++;
      }
    }
    setExtractedShadows(extracted);
    if (extracted > 0) {
      setShadowToast(true);
      setTimeout(() => setShadowToast(false), 3000);
    }
  }

  if (loading) {
    return (
      <div style={{
        background: "#13131f",
        border: "2px solid #2d2d44",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        marginTop: 16,
      }}>
        <Loader2 size={32} color="#7c3aed" className="animate-spin" />
        <p style={{ fontFamily: "var(--font-system)", fontSize: 11, color: "#6b6880", letterSpacing: "1px" }}>
          THE SYSTEM IS ANALYZING TARGET...
        </p>
      </div>
    );
  }

  if (!intel) {
    return (
      <div style={{
        background: "#13131f",
        border: "2px solid #2d2d44",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 14,
        marginTop: 16,
      }}>
        <div style={{ width: 48, height: 48, background: "rgba(124,58,237,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={24} color="#7c3aed" />
        </div>
        <div>
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, color: "#e8e6f0", marginBottom: 6 }}>
            SYSTEM INTELLIGENCE
          </h3>
          <p style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6880", maxWidth: 300, lineHeight: 1.6 }}>
            THE SYSTEM CAN ANALYZE THE TRANSCRIPT TO GENERATE SUMMARIES AND SKILL CHECKS.
          </p>
        </div>
        <button
          onClick={generateIntel}
          className="btn-primary"
          style={{ padding: "10px 20px", fontSize: 12, letterSpacing: "1px" }}
        >
          <Zap size={14} /> GENERATE INTEL
        </button>
        {error && (
          <div style={{
            marginTop: 10, padding: "10px 14px",
            background: "rgba(220,38,38,0.08)", border: "1px solid #dc262644",
            borderLeft: "3px solid #dc2626", maxWidth: 340,
          }}>
            <p style={{ fontFamily: "var(--font-system)", fontSize: 9, letterSpacing: "2px", color: "#dc2626", marginBottom: 4 }}>SYSTEM ERROR</p>
            <p style={{ fontFamily: "var(--font-system)", fontSize: 11, color: "#9d9ab0", lineHeight: 1.5 }}>{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: "#13131f",
      border: "2px solid #2d2d44",
      marginTop: 16,
      boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #2d2d44" }}>
        <button
          onClick={() => setActiveTab("summary")}
          style={{
            flex: 1, padding: "12px", background: activeTab === "summary" ? "rgba(124,58,237,0.1)" : "transparent",
            border: "none", borderBottom: activeTab === "summary" ? "2px solid #7c3aed" : "2px solid transparent",
            color: activeTab === "summary" ? "#a78bfa" : "#6b6880", fontFamily: "monospace", fontSize: 10, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Brain size={14} /> SUMMARY
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          style={{
            flex: 1, padding: "12px", background: activeTab === "notes" ? "rgba(124,58,237,0.1)" : "transparent",
            border: "none", borderBottom: activeTab === "notes" ? "2px solid #7c3aed" : "2px solid transparent",
            color: activeTab === "notes" ? "#a78bfa" : "#6b6880", fontFamily: "monospace", fontSize: 10, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Zap size={14} /> QUEST NOTES
        </button>
        <button
          onClick={() => setActiveTab("quiz")}
          style={{
            flex: 1, padding: "12px", background: activeTab === "quiz" ? "rgba(124,58,237,0.1)" : "transparent",
            border: "none", borderBottom: activeTab === "quiz" ? "2px solid #7c3aed" : "2px solid transparent",
            color: activeTab === "quiz" ? "#a78bfa" : "#6b6880", fontFamily: "monospace", fontSize: 10, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <HelpCircle size={14} /> SKILL CHECK
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        {activeTab === "summary" ? (
          <div className="dash-enter">
            <p style={{ color: "#e8e6f0", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              {intel.summary}
            </p>
            
            <div style={{ background: "#0d0d18", border: "1px solid #2d2d44", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <ListChecks size={14} color="#7c3aed" />
                <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#7c3aed", letterSpacing: "2px" }}>KEY TAKEAWAYS</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {intel.keyPoints.map((p, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "#9d9ab0", marginBottom: 8 }}>
                    <span style={{ color: "#7c3aed", fontWeight: 700 }}>•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : activeTab === "notes" ? (
          <div className="dash-enter">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#4a4760", letterSpacing: "1px" }}>QUEST INTELLIGENCE LOG</span>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: isSaving ? "#7c3aed" : "#34d399" }}>
                {isSaving ? "SYNCING..." : "SYNCED TO CLOUD"}
              </span>
            </div>
            <textarea
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              onBlur={saveManualNotes}
              placeholder="RECORD YOUR INSIGHTS HERE..."
              style={{
                width: "100%", minHeight: 200, background: "#0d0d18", border: "1px solid #2d2d44",
                padding: "16px", color: "#e8e6f0", fontFamily: "monospace", fontSize: 13,
                outline: "none", resize: "vertical", lineHeight: 1.6,
              }}
            />
          </div>
        ) : (
          <div className="dash-enter">
            {intel.quiz.map((q, i) => (
              <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < intel.quiz.length - 1 ? "1px dashed #2d2d44" : "none" }}>
                <p style={{ color: "#e8e6f0", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  {i + 1}. {q.question}
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {q.options.map((opt) => {
                    const isSelected = quizState[i] === opt;
                    const isCorrect = opt === q.answer;
                    const showResult = showResults;

                    let bg = "#0d0d18";
                    let border = "1px solid #2d2d44";
                    let color = "#9d9ab0";

                    if (showResult) {
                      if (isCorrect) { bg = "rgba(52,211,153,0.1)"; border = "1px solid #34d399"; color = "#34d399"; }
                      else if (isSelected) { bg = "rgba(220,38,38,0.1)"; border = "1px solid #dc2626"; color = "#dc2626"; }
                    } else if (isSelected) {
                      bg = "rgba(124,58,237,0.1)"; border = "1px solid #7c3aed"; color = "#a78bfa";
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => !showResults && setQuizState({ ...quizState, [i]: opt })}
                        style={{
                          textAlign: "left", padding: "10px 14px", background: bg, border: border, color: color,
                          fontSize: 13, cursor: showResults ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10,
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: isSelected ? "currentColor" : "transparent", border: isSelected ? "none" : "1px solid #2d2d44" }} />
                        {opt}
                        {showResult && isCorrect && <CheckCircle2 size={14} style={{ marginLeft: "auto" }} />}
                        {showResult && isSelected && !isCorrect && <XCircle size={14} style={{ marginLeft: "auto" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {!showResults ? (
              <button
                onClick={() => { setShowResults(true); extractShadows(); }}
                disabled={Object.keys(quizState).length < intel.quiz.length}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              >
                FINISH SKILL CHECK
              </button>
            ) : (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setShowResults(false); setQuizState({}); setExtractedShadows(0); }}
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: "center", color: "#6b6880" }}
                >
                  RETRY
                </button>
                {extractedShadows > 0 && (
                  <a
                    href="/shadows"
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px", background: "rgba(124,58,237,0.1)", border: "2px solid #7c3aed44",
                      color: "#a78bfa", fontFamily: "var(--font-system)", fontSize: 10, letterSpacing: "1px",
                      textDecoration: "none",
                    }}
                  >
                    💀 VIEW {extractedShadows} SHADOWS
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
