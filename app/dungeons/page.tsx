"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  collection, query, orderBy, onSnapshot, getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { CourseDoc, ProgressDoc } from "@/lib/firebase/schema";
import AppShell from "@/components/AppShell";
import QuestCard from "@/components/course/QuestCard";
import ImportModal from "@/components/ImportModal";
import { getDungeonRank, RANK_COLORS, type Rank } from "@/lib/utils/ranks";
import { Plus, Loader2, Search, X } from "lucide-react";

interface CourseWithProgress extends CourseDoc {
  id: string;
  completedCount: number;
}

const RANK_OPTIONS: (Rank | "ALL")[] = ["ALL", "S", "A", "B", "C", "D", "E"];
const SORT_OPTIONS = ["newest", "oldest", "az", "progress"] as const;
type SortOption = typeof SORT_OPTIONS[number];

export default function DungeonsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState<Rank | "ALL">("ALL");
  const [sort, setSort] = useState<SortOption>("newest");

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "courses"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, async (snap) => {
      const progressSnap = await getDocs(collection(db, "users", user.uid, "progress"));
      const countMap: Record<string, number> = {};
      progressSnap.docs.forEach((d) => {
        const data = d.data() as ProgressDoc;
        if (data.completed) countMap[data.courseId] = (countMap[data.courseId] || 0) + 1;
      });
      const data: CourseWithProgress[] = snap.docs.map((d) => ({
        id: d.id, ...(d.data() as CourseDoc), completedCount: countMap[d.id] || 0,
      }));
      setCourses(data);
      setPageLoading(false);
    });
    return unsub;
  }, [user]);

  const filtered = courses
    .filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
      const matchRank = rankFilter === "ALL" || getDungeonRank(c.totalVideos) === rankFilter;
      return matchSearch && matchRank;
    })
    .sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "progress") {
        const pA = a.totalVideos > 0 ? a.completedCount / a.totalVideos : 0;
        const pB = b.totalVideos > 0 ? b.completedCount / b.totalVideos : 0;
        return pB - pA;
      }
      if (sort === "oldest") return 0; // already ordered desc, oldest = reverse
      return 0; // newest = default
    });

  const cleared = courses.filter((c) => c.completedCount === c.totalVideos && c.totalVideos > 0).length;
  const inProgress = courses.filter((c) => c.completedCount > 0 && c.completedCount < c.totalVideos).length;
  const notStarted = courses.filter((c) => c.completedCount === 0).length;

  if (loading || !user) {
    return <AppShell><div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader2 size={32} color="var(--accent-bright)" className="animate-spin" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div style={{ padding: "28px 32px 80px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-heading)",
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: 6,
              color: "#e8e6f0",
            }}>All Dungeons</h1>
            <p style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", letterSpacing: "0.5px" }}>
              {courses.length} gates registered by the System.
            </p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            id="dungeons-import-btn"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#06b6d4",
              color: "#0a0a0f",
              border: "2px solid #22d3ee",
              boxShadow: "3px 3px 0 #0e7490, 0 0 16px rgba(6,182,212,0.4)",
              padding: "10px 20px",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "transform 0.08s, box-shadow 0.08s",
              borderRadius: 2,
            }}
            onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = "translate(-1px,-1px)"; el.style.boxShadow = "4px 4px 0 #0e7490, 0 0 22px rgba(6,182,212,0.5)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = "translate(0,0)"; el.style.boxShadow = "3px 3px 0 #0e7490, 0 0 16px rgba(6,182,212,0.4)"; }}
          >
            <Plus size={15} /> New Gate
          </button>
        </div>

        {/* Summary pills — match theme.png dark pill style */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "TOTAL",       value: courses.length, color: "#22d3ee" },
            { label: "IN PROGRESS", value: inProgress,     color: "#a78bfa" },
            { label: "CLEARED",     value: cleared,        color: "#34d399" },
            { label: "NOT STARTED", value: notStarted,     color: "#6b7280" },
          ].map((s) => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 16px",
              background: "rgba(13,13,24,0.9)",
              border: "1px solid #2d2d44",
              borderRadius: 2,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 17, fontWeight: 900, color: s.color, letterSpacing: "1px" }}>{s.value}</span>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6880", letterSpacing: "1.5px" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "0 12px" }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dungeons..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 13, padding: "10px 0", fontFamily: "var(--font-body)" }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={14} /></button>}
          </div>

          {/* Rank filter */}
          <div style={{ display: "flex", gap: 6 }}>
            {RANK_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRankFilter(r)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-rank)",
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderColor: rankFilter === r ? (r === "ALL" ? "var(--accent-bright)" : RANK_COLORS[r as Rank]) : "var(--border)",
                  color: rankFilter === r ? (r === "ALL" ? "var(--accent-bright)" : RANK_COLORS[r as Rank]) : "var(--text-muted)",
                  background: rankFilter === r ? (r === "ALL" ? "var(--accent-subtle)" : `${RANK_COLORS[r as Rank]}15`) : "transparent",
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", outline: "none", fontFamily: "var(--font-body)" }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A → Z</option>
            <option value="progress">By progress</option>
          </select>
        </div>

        {/* Grid */}
        {pageLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {[1,2,3,4,5,6].map((n) => <div key={n} className="skeleton" style={{ height: 240 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", border: "1px dashed rgba(124,58,237,0.2)", borderRadius: 16 }}>
            <p style={{ fontSize: 28, marginBottom: 10 }}>🔍</p>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No dungeons found</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {search || rankFilter !== "ALL" ? "Try adjusting your filters." : "Open your first Gate to begin."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filtered.map((course) => (
              <QuestCard key={course.id} course={course} completedCount={course.completedCount} />
            ))}
          </div>
        )}
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
    </AppShell>
  );
}
