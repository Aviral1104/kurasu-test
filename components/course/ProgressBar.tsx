"use client";

interface Props {
  percent: number;
  completedCount: number;
  totalVideos: number;
  showLabel?: boolean;
}

export default function ProgressBar({
  percent,
  completedCount,
  totalVideos,
  showLabel = true,
}: Props) {
  const isComplete = percent === 100;

  return (
    <div>
      {/* Labels */}
      {showLabel && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {isComplete ? "🎉 Course complete!" : `${completedCount} of ${totalVideos} videos`}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: isComplete ? "var(--success)" : "var(--accent)",
            }}
          >
            {percent}%
          </span>
        </div>
      )}

      {/* Track */}
      <div className="progress-track" style={{ height: 8 }}>
        <div
          className="progress-fill"
          style={{
            width: `${percent}%`,
            background: isComplete
              ? "var(--success)"
              : "linear-gradient(90deg, var(--accent), var(--success))",
            boxShadow: isComplete
              ? "0 0 12px var(--success-glow)"
              : percent > 10
              ? "0 0 10px var(--accent-glow)"
              : "none",
          }}
        />
      </div>
    </div>
  );
}
