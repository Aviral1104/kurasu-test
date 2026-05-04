"use client";

import Link from "next/link";
import { Play, Clock, BookOpen } from "lucide-react";
import { CourseDoc } from "@/lib/firebase/schema";
import { formatDuration } from "@/lib/youtube/api";

interface Props {
  course: CourseDoc & { id: string };
  completedCount: number;
}

export default function CourseCard({ course, completedCount }: Props) {
  const percent =
    course.totalVideos > 0
      ? Math.round((completedCount / course.totalVideos) * 100)
      : 0;

  const remainingVideos = course.totalVideos - completedCount;
  const isComplete = percent === 100;

  return (
    <Link href={`/course/${course.id}`}>
      <div
        className="glass glass-hover"
        style={{
          overflow: "hidden",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1a1a30 0%, #0a0a1a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BookOpen size={40} color="var(--text-muted)" />
            </div>
          )}

          {/* Overlay gradient */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(10,10,15,0.8) 0%, transparent 50%)",
            }}
          />

          {/* Complete badge */}
          {isComplete && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "var(--success)",
                color: "white",
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
            >
              COMPLETE
            </div>
          )}

          {/* Video count */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <Play size={12} fill="currentColor" />
            {course.totalVideos} videos
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "14px 16px 16px" }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.4,
              marginBottom: 10,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {course.title}
          </h3>

          {/* Progress bar */}
          <div style={{ marginBottom: 10 }}>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Progress stats */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: isComplete ? "var(--success)" : "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              {isComplete
                ? "✓ All done!"
                : `${completedCount} / ${course.totalVideos} done`}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isComplete ? "var(--success)" : "var(--accent)",
              }}
            >
              {percent}%
            </span>
          </div>

          {/* Resume CTA if in progress */}
          {!isComplete && completedCount > 0 && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--accent)",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Play size={12} />
              {remainingVideos} video{remainingVideos !== 1 ? "s" : ""} left
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
