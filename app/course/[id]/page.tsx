"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import {
  doc, getDoc, collection, getDocs, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { CourseDoc, VideoDoc, ProgressDoc } from "@/lib/firebase/schema";
import AppShell from "@/components/AppShell";
import VideoList from "@/components/course/VideoList";
import VideoPlayer from "@/components/course/VideoPlayer";
import VideoIntel from "@/components/course/VideoIntel";
import RankUpCeremony from "@/components/RankUpCeremony";
import { getDungeonRank, getHunterRank, RANK_COLORS, XP_PER_VIDEO } from "@/lib/utils/ranks";
import { ArrowLeft, Play, ExternalLink, Loader2, Zap, Clock } from "lucide-react";
import Link from "next/link";
import { formatDuration } from "@/lib/youtube/api";

interface VideoWithProgress extends VideoDoc {
  id: string;
  progress?: ProgressDoc;
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [course, setCourse] = useState<(CourseDoc & { id: string }) | null>(null);
  const [videos, setVideos] = useState<VideoWithProgress[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoWithProgress | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [ceremony, setCeremony] = useState<{ oldRank: string; newRank: string } | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [totalWatched, setTotalWatched] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/");
  }, [user, authLoading, router]);

  const loadCourse = useCallback(async () => {
    if (!user || !id) return;

    const courseRef = doc(db, "users", user.uid, "courses", id as string);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) { router.replace("/dashboard"); return; }
    setCourse({ id: courseSnap.id, ...(courseSnap.data() as CourseDoc) });

    // Get user XP
    const userSnap = await getDoc(doc(db, "users", user.uid));
    setUserXp(userSnap.data()?.xp || 0);

    // Fetch videos
    const videosRef = collection(db, "users", user.uid, "courses", id as string, "videos");
    const videosQ = query(videosRef, orderBy("position", "asc"));
    const videosSnap = await getDocs(videosQ);

    // Fetch progress
    const progressRef = collection(db, "users", user.uid, "progress");
    const progressSnap = await getDocs(progressRef);
    const progressMap: Record<string, ProgressDoc> = {};
    progressSnap.docs.forEach((d) => { progressMap[d.id] = d.data() as ProgressDoc; });

    const vids: VideoWithProgress[] = videosSnap.docs.map((d) => ({
      id: d.id, ...(d.data() as VideoDoc), progress: progressMap[d.id],
    }));

    setVideos(vids);

    // Calculate total watched time
    const tw = vids.reduce((sum, v) => sum + (v.progress?.watchedSeconds || 0), 0);
    setTotalWatched(tw);

    setPageLoading(false);
  }, [user, id, router]);

  useEffect(() => { if (user) loadCourse(); }, [user, loadCourse]);

  // Select first incomplete video on load
  useEffect(() => {
    if (videos.length > 0 && !activeVideo) {
      const first = videos.find((v) => !v.progress?.completed) || videos[0];
      setActiveVideo(first);
    }
  }, [videos, activeVideo]);

  const handleSelectVideo = useCallback((video: VideoWithProgress) => {
    setActiveVideo(video);
    // Scroll to top for the player
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleWatchTimeUpdate = useCallback((videoId: string, seconds: number) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, progress: { ...v.progress, courseId: id as string, completed: v.progress?.completed || false, watchedSeconds: seconds } as ProgressDoc }
          : v
      )
    );
    // Persist watch time to server every 15 seconds
    if (seconds % 15 === 0 && seconds > 0) {
      persistWatchTime(videoId, seconds);
    }
  }, [id]);

  const persistWatchTime = async (videoId: string, seconds: number) => {
    if (!user) return;
    try {
      const token = await getIdToken(auth.currentUser!);
      await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ videoId, courseId: id, completed: false, watchedSeconds: seconds }),
      });
    } catch {}
  };

  const handleProgressUpdate = useCallback(
    (videoId: string, completed: boolean) => {
      setVideos((prev) => {
        const next = prev.map((v) =>
          v.id === videoId
            ? { ...v, progress: { ...v.progress, courseId: id as string, completed, watchedSeconds: v.progress?.watchedSeconds || 0 } as ProgressDoc }
            : v
        );

        // Auto-advance to next video on completion
        if (completed) {
          const idx = next.findIndex((v) => v.id === videoId);
          const nextVid = next[idx + 1];
          if (nextVid) setTimeout(() => setActiveVideo(nextVid), 500);
        }

        // Check for course completion → ceremony
        if (completed && course) {
          const newCount = next.filter((v) => v.progress?.completed).length;
          if (newCount === course.totalVideos) {
            const dungeonRank = getDungeonRank(course.totalVideos);
            const xpGain = XP_PER_VIDEO[dungeonRank];
            const oldRank = getHunterRank(userXp);
            const newRank = getHunterRank(userXp + xpGain);
            setCeremony({ oldRank, newRank });
          }
        }
        return next;
      });
    },
    [id, course, userXp]
  );

  const handleUpdateDeadline = async (date: string | null) => {
    if (!user || !id) return;
    try {
      const courseRef = doc(db, "users", user.uid, "courses", id as string);
      await getDoc(courseRef); // Just to verify
      setCourse((prev) => prev ? { ...prev, deadlineDate: date } : null);
      
      const token = await getIdToken(auth.currentUser!);
      await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deadlineDate: date }),
      });
    } catch (err) {
      console.error("Failed to update deadline:", err);
    }
  };

  if (authLoading || pageLoading || !user) {
    return (
      <AppShell>
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader2 size={32} color="var(--accent-bright)" className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!course) return null;

  const completedCount = videos.filter((v) => v.progress?.completed).length;
  const percent = course.totalVideos > 0 ? Math.round((completedCount / course.totalVideos) * 100) : 0;
  const dungeonRank = getDungeonRank(course.totalVideos);
  const rankColor = RANK_COLORS[dungeonRank];
  const xpPerVideo = XP_PER_VIDEO[dungeonRank];
  const totalDuration = videos.reduce((s, v) => s + v.durationSeconds, 0);

  return (
    <AppShell>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px 80px" }}>

        {/* Back */}
        <Link
          href="/dungeons"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "monospace", fontSize: 11, letterSpacing: "1px",
            color: "#6b6880", marginBottom: 16, transition: "color 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a78bfa")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#6b6880")}
        >
          <ArrowLeft size={13} />
          BACK TO DUNGEONS
        </Link>

        {/* Two-column layout: Player + Quest Log */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* Left column — Player + Video list */}
          <div>
            {/* Embedded player */}
            {activeVideo && (
              <>
                <VideoPlayer
                  key={activeVideo.id}
                  ytVideoId={activeVideo.ytVideoId}
                  title={activeVideo.title}
                  durationSeconds={activeVideo.durationSeconds}
                  initialWatchedSeconds={activeVideo.progress?.watchedSeconds || 0}
                  onWatchTimeUpdate={(s) => handleWatchTimeUpdate(activeVideo.id, s)}
                  onEligibleForCompletion={() => {}}
                />
                
                {/* System Intelligence Panel */}
                <VideoIntel 
                  videoId={activeVideo.id} 
                  courseId={id as string} 
                  ytVideoId={activeVideo.ytVideoId} 
                />
              </>
            )}

            {/* Video list header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px",
              background: "#13131f",
              border: "2px solid #2d2d44",
              borderBottom: "none",
              boxShadow: "4px 0 0 rgba(0,0,0,0.3)",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "2px", color: "#6b6880" }}>
                QUEST LOG · {course.totalVideos} TARGETS
              </span>
              {completedCount > 0 && (
                <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "1px", color: "#34d399" }}>
                  {completedCount} ELIMINATED
                </span>
              )}
            </div>

            {/* Video list */}
            <div style={{
              border: "2px solid #2d2d44",
              borderTop: "none",
              boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
              maxHeight: "calc(100vh - 200px)",
              overflowY: "auto",
            }}>
              <VideoList
                videos={videos}
                courseId={id as string}
                activeVideoId={activeVideo?.id}
                onSelectVideo={handleSelectVideo}
                onProgressUpdate={handleProgressUpdate}
              />
            </div>
          </div>

          {/* Right column — Dungeon Info Panel */}
          <div style={{ position: "sticky", top: 20 }}>
            {/* Dungeon card */}
            <div style={{
              background: "#13131f",
              border: `2px solid ${rankColor}`,
              boxShadow: `4px 4px 0 ${rankColor}44`,
              padding: 18,
              marginBottom: 12,
            }}>
              {/* Rank + stripe */}
              <div style={{
                height: 4, marginBottom: 14,
                background: `repeating-linear-gradient(90deg, ${rankColor} 0, ${rankColor} 4px, transparent 4px, transparent 8px)`,
              }} />

              <div style={{
                fontFamily: "monospace", fontSize: 9, fontWeight: 700,
                letterSpacing: "2px", color: rankColor,
                border: `2px solid ${rankColor}`,
                boxShadow: `2px 2px 0 ${rankColor}44`,
                padding: "3px 8px", display: "inline-block", marginBottom: 10,
              }}>
                RANK {dungeonRank} DUNGEON
              </div>

              <h2 style={{
                fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700,
                color: "#e8e6f0", lineHeight: 1.3, marginBottom: 12,
              }}>
                {course.title}
              </h2>

              {/* Deadline */}
              <div style={{ marginBottom: 16, padding: "10px", background: "#0d0d18", border: "1px solid #2d2d44" }}>
                <p style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "2px", color: "#6b6880", marginBottom: 6 }}>SYSTEM GOAL</p>
                {course.deadlineDate ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#e8e6f0" }}>
                        CLEAR BY: {course.deadlineDate}
                      </span>
                      <button 
                        onClick={() => handleUpdateDeadline(null)}
                        style={{ background: "transparent", border: "none", color: "#dc2626", fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}
                      >
                        [ABANDON]
                      </button>
                    </div>
                    {/* Daily target calculation */}
                    {(() => {
                      const remaining = videos.filter(v => !v.progress?.completed).length;
                      const today = new Date();
                      const goal = new Date(course.deadlineDate);
                      const diffTime = goal.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      const target = diffDays > 0 ? Math.ceil(remaining / diffDays) : remaining;
                      return (
                        <div style={{ 
                          borderTop: "1px dashed #2d2d44", paddingTop: 8, marginTop: 4,
                          display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#34d399", letterSpacing: "1px" }}>
                            DAILY TARGET: {target} VIDEOS
                          </span>
                          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6b6880" }}>
                            {diffDays} DAYS LEFT
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input 
                      type="date" 
                      onChange={(e) => handleUpdateDeadline(e.target.value)}
                      style={{ 
                        flex: 1, background: "transparent", border: "1px solid #2d2d44", 
                        color: "#6b6880", fontSize: 11, fontFamily: "monospace", padding: "4px" 
                      }}
                    />
                    <span style={{ fontSize: 10, color: "#7c3aed", display: "flex", alignItems: "center" }}>SET GOAL</span>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6b6880", letterSpacing: "1px" }}>
                    {percent === 100 ? "■ CLEARED" : `${completedCount}/${course.totalVideos} VIDEOS`}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: rankColor, letterSpacing: "1px" }}>
                    {percent}%
                  </span>
                </div>
                <div style={{ background: "#1a1a2e", border: "2px solid #2d2d44", height: 8, overflow: "hidden" }}>
                  <div style={{
                    width: `${percent}%`,
                    height: "100%",
                    background: percent === 100
                      ? "repeating-linear-gradient(90deg,#34d399 0,#34d399 4px,#059669 4px,#059669 8px)"
                      : `repeating-linear-gradient(90deg,${rankColor} 0,${rankColor} 4px,${rankColor}88 4px,${rankColor}88 8px)`,
                    transition: "width 0.4s steps(8,end)",
                  }} />
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "XP/VIDEO", val: `+${xpPerVideo}`, color: "#a78bfa" },
                  { label: "TOTAL TIME", val: formatDuration(totalDuration), color: "#6b6880" },
                  { label: "WATCHED", val: formatDuration(totalWatched), color: "#34d399" },
                  { label: "REMAINING", val: formatDuration(Math.max(0, totalDuration - totalWatched)), color: "#f59e0b" },
                ].map((s) => (
                  <div key={s.label} style={{
                    background: "#0d0d18",
                    border: "1px solid #2d2d44",
                    padding: "8px 10px",
                  }}>
                    <p style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "2px", color: "#4a4760", marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Playlist link */}
              {course.playlistId && (
                <a
                  href={`https://youtube.com/playlist?list=${course.playlistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    marginTop: 12, padding: "8px",
                    fontFamily: "monospace", fontSize: 10, letterSpacing: "1px",
                    color: "#6b6880",
                    border: "1px solid #2d2d44",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#a78bfa";
                    (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#6b6880";
                    (e.currentTarget as HTMLElement).style.borderColor = "#2d2d44";
                  }}
                >
                  <ExternalLink size={11} /> VIEW ON YOUTUBE
                </a>
              )}
            </div>

            {/* System tip */}
            <div style={{
              background: "rgba(124,58,237,0.05)",
              borderLeft: "3px solid #7c3aed",
              padding: "10px 14px",
              position: "relative", overflow: "hidden",
            }}>
              <p style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "2px", color: "#7c3aed", marginBottom: 6 }}>SYSTEM NOTICE</p>
              <p style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6880", lineHeight: 1.7 }}>
                Videos must be watched to 80% before the System allows completion. XP is awarded per video based on dungeon rank.
              </p>
            </div>
          </div>
        </div>
      </div>

      {ceremony && course && (
        <RankUpCeremony
          oldRank={ceremony.oldRank as any}
          newRank={ceremony.newRank as any}
          courseName={course.title}
          onDismiss={() => setCeremony(null)}
        />
      )}
    </AppShell>
  );
}
