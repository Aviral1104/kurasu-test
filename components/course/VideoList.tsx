"use client";

import { useState } from "react";
import { Clock, Lock, Play } from "lucide-react";
import { VideoDoc, ProgressDoc } from "@/lib/firebase/schema";
import { formatDuration } from "@/lib/youtube/api";
import { useAuth } from "@/lib/context/AuthContext";
import { getIdToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

interface VideoWithProgress extends VideoDoc {
  id: string;
  progress?: ProgressDoc;
}

interface Props {
  videos: VideoWithProgress[];
  courseId: string;
  activeVideoId?: string | null;
  onSelectVideo: (video: VideoWithProgress) => void;
  onProgressUpdate?: (videoId: string, completed: boolean) => void;
}

const COMPLETION_THRESHOLD = 0.8;

export default function VideoList({
  videos,
  courseId,
  activeVideoId,
  onSelectVideo,
  onProgressUpdate,
}: Props) {
  const { user } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleComplete = async (video: VideoWithProgress) => {
    if (!user || loadingId) return;

    // Check watch time requirement
    const watched = video.progress?.watchedSeconds || 0;
    const required = video.durationSeconds * COMPLETION_THRESHOLD;
    if (watched < required && !video.progress?.completed) {
      return; // Not eligible
    }

    const newCompleted = !video.progress?.completed;
    setLoadingId(video.id);

    try {
      const token = await getIdToken(auth.currentUser!);
      const res = await fetch("/api/progress", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId: video.id,
          courseId,
          completed: newCompleted,
          watchedSeconds: video.progress?.watchedSeconds || 0,
        }),
      });

      if (res.ok) {
        onProgressUpdate?.(video.id, newCompleted);
      }
    } catch (err) {
      console.error("Failed to update progress:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {videos.map((video, index) => {
        const isCompleted = video.progress?.completed || false;
        const isActive = activeVideoId === video.id;
        const isLoading = loadingId === video.id;
        const watched = video.progress?.watchedSeconds || 0;
        const canComplete = video.durationSeconds > 0
          ? watched >= video.durationSeconds * COMPLETION_THRESHOLD
          : true;
        const watchPercent = video.durationSeconds > 0
          ? Math.min(100, Math.round((watched / video.durationSeconds) * 100))
          : 0;

        return (
          <div
            key={video.id}
            id={`video-${video.id}`}
            onClick={() => onSelectVideo(video)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              background: isActive ? "rgba(124,58,237,0.12)" : isCompleted ? "rgba(52,211,153,0.04)" : "#0d0d18",
              borderLeft: `3px solid ${isActive ? "#7c3aed" : isCompleted ? "#34d399" : "#2d2d44"}`,
              borderBottom: "1px solid #2d2d44",
              cursor: "pointer",
              transition: "background 0.12s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.06)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = isCompleted ? "rgba(52,211,153,0.04)" : "#0d0d18";
            }}
          >
            {/* Completion button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleComplete(video);
              }}
              disabled={isLoading || (!canComplete && !isCompleted)}
              title={
                isCompleted ? "Mark incomplete"
                : canComplete ? "Mark complete"
                : `Watch ${Math.round(COMPLETION_THRESHOLD * 100)}% first`
              }
              style={{
                width: 20, height: 20,
                flexShrink: 0,
                background: isCompleted ? "#34d399" : "transparent",
                border: `2px solid ${isCompleted ? "#34d399" : canComplete ? "#7c3aed" : "#2d2d44"}`,
                cursor: isLoading ? "wait" : (!canComplete && !isCompleted) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: isLoading ? 0.5 : (!canComplete && !isCompleted) ? 0.4 : 1,
                transition: "all 0.15s",
                padding: 0,
              }}
            >
              {isCompleted && <span style={{ fontSize: 10, color: "#000", fontWeight: 900 }}>✓</span>}
              {!isCompleted && !canComplete && <Lock size={8} color="#6b6880" />}
            </button>

            {/* Number */}
            <span style={{
              fontFamily: "monospace", fontSize: 10, color: "#6b6880",
              width: 22, textAlign: "right", flexShrink: 0, letterSpacing: "1px",
            }}>
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* Thumbnail */}
            {video.thumbnailUrl && (
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  style={{
                    width: 64, height: 36,
                    objectFit: "cover",
                    border: "1px solid #2d2d44",
                    opacity: isCompleted ? 0.4 : 1,
                    transition: "opacity 0.2s",
                    imageRendering: "auto",
                  }}
                />
                {isActive && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(124,58,237,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Play size={14} color="#fff" fill="#fff" />
                  </div>
                )}
              </div>
            )}

            {/* Title + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12,
                fontWeight: isActive ? 600 : 500,
                color: isCompleted ? "#6b6880" : isActive ? "#e8e6f0" : "#b0adc0",
                textDecoration: isCompleted ? "line-through" : "none",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}>
                {video.title}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                {video.durationSeconds > 0 && (
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "#6b6880", display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={9} />
                    {formatDuration(video.durationSeconds)}
                  </span>
                )}
                {/* Mini watch progress */}
                {watched > 0 && !isCompleted && (
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: canComplete ? "#34d399" : "#a78bfa", letterSpacing: "1px" }}>
                    {watchPercent}% WATCHED
                  </span>
                )}
              </div>
            </div>

            {/* XP indicator for completed */}
            {isCompleted && (
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#34d399", letterSpacing: "1px", flexShrink: 0 }}>
                ✓ DONE
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
