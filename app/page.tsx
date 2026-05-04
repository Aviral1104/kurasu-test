"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  Brain,
  Flame,
  CheckCircle2,
  Play,
  ArrowRight,
  Loader2,
  Sparkles,
  Trophy,
  Target,
} from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Structured Courses",
    desc: "Paste any YouTube playlist URL and instantly get a clean, ordered course view with all videos listed.",
    color: "var(--accent)",
  },
  {
    icon: CheckCircle2,
    title: "Progress Tracking",
    desc: "Check off videos as you finish them. Your progress is saved automatically — resume anytime.",
    color: "var(--success)",
  },
  {
    icon: Flame,
    title: "Daily Streaks",
    desc: "Build a learning habit with a streak counter. Watch at least one video a day to keep your streak alive.",
    color: "var(--streak)",
  },
  {
    icon: Brain,
    title: "AI Notes & Quizzes",
    desc: "Coming soon — AI-generated summaries, key takeaways, MCQ quizzes and flashcards for every video.",
    color: "#a78bfa",
  },
];

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 size={32} color="var(--accent)" className="animate-spin" />
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10, 10, 15, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 5vw",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "linear-gradient(135deg, var(--accent), var(--success))",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Kurasu</span>
        </div>
        <button
          onClick={signInWithGoogle}
          className="btn-primary"
          style={{ fontSize: 13 }}
        >
          Sign in free
        </button>
      </nav>

      {/* Hero */}
      <section
        style={{
          padding: "100px 5vw 80px",
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(124, 107, 255, 0.1)",
            border: "1px solid rgba(124, 107, 255, 0.3)",
            borderRadius: 999,
            padding: "6px 14px",
            marginBottom: 28,
            fontSize: 13,
            color: "var(--accent)",
            fontWeight: 600,
          }}
        >
          <Sparkles size={14} />
          Your Personal Learning OS
        </div>

        <h1
          className="gradient-text"
          style={{
            fontSize: "clamp(40px, 7vw, 68px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            marginBottom: 20,
          }}
        >
          Turn YouTube into
          <br />a real course
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 20px)",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: 560,
            margin: "0 auto 40px",
          }}
        >
          Paste any YouTube playlist and get a structured course with progress
          tracking, streaks, and (soon) AI-generated notes and quizzes. Free forever.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={signInWithGoogle}
            className="btn-primary glow-accent"
            style={{ fontSize: 16, padding: "14px 28px", borderRadius: 12 }}
          >
            Start learning free
            <ArrowRight size={18} />
          </button>
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          No credit card. Google login. Ready in 10 seconds.
        </p>
      </section>

      {/* Features */}
      <section style={{ padding: "60px 5vw 100px", maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {FEATURES.map((feat) => (
            <div key={feat.title} className="glass" style={{ padding: 24 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${feat.color}20`,
                  border: `1px solid ${feat.color}40`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <feat.icon size={20} color={feat.color} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer */}
      <section
        style={{
          padding: "60px 5vw",
          textAlign: "center",
          borderTop: "1px solid var(--border)",
        }}
      >
        <Target size={32} color="var(--accent)" style={{ marginBottom: 16 }} />
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          Ready to actually finish a course?
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 15 }}>
          Takes 30 seconds to set up. No manual effort required.
        </p>
        <button
          onClick={signInWithGoogle}
          className="btn-primary"
          style={{ fontSize: 15, padding: "13px 26px", borderRadius: 12 }}
        >
          Get started — it's free
        </button>
      </section>
    </main>
  );
}
