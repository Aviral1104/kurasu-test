"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatDuration } from "@/lib/youtube/api";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface Props {
  ytVideoId: string;
  title: string;
  durationSeconds: number;
  initialWatchedSeconds?: number;
  onWatchTimeUpdate: (seconds: number) => void;
  onEligibleForCompletion: () => void;
}

const COMPLETION_THRESHOLD = 0.8;

function loadYTScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(); return; }
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const existing = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { existing?.(); resolve(); };
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(tag);
  });
}

export default function VideoPlayer({
  ytVideoId, title, durationSeconds, initialWatchedSeconds = 0,
  onWatchTimeUpdate, onEligibleForCompletion,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchedRef = useRef(initialWatchedSeconds);
  const hasNotifiedRef = useRef(false);
  const playbackRateRef = useRef(1);

  const onUpdateRef = useRef(onWatchTimeUpdate);
  onUpdateRef.current = onWatchTimeUpdate;
  const onEligibleRef = useRef(onEligibleForCompletion);
  onEligibleRef.current = onEligibleForCompletion;

  const [watched, setWatched] = useState(initialWatchedSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const eligible = durationSeconds > 0 && watched >= durationSeconds * COMPLETION_THRESHOLD;
  const watchPercent = durationSeconds > 0 ? Math.min(100, Math.round((watched / durationSeconds) * 100)) : 0;

  // Tick using the current playback rate — ticks faster at 2x
  const startTicking = useCallback(() => {
    if (tickIntervalRef.current) return;
    // Tick every 500ms, add playbackRate * 0.5 seconds each tick
    tickIntervalRef.current = setInterval(() => {
      const rate = playbackRateRef.current;
      watchedRef.current += rate * 0.5;
      setWatched(watchedRef.current);
      onUpdateRef.current(watchedRef.current);
    }, 500);
  }, []);

  const stopTicking = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (eligible && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onEligibleRef.current();
    }
  }, [eligible]);

  // Initialize player
  useEffect(() => {
    let destroyed = false;

    (async () => {
      await loadYTScript();
      if (destroyed || !containerRef.current) return;

      const playerId = `yt-player-${ytVideoId}-${Date.now()}`;
      const playerDiv = document.createElement("div");
      playerDiv.id = playerId;
      containerRef.current.appendChild(playerDiv);

      try {
        playerRef.current = new window.YT.Player(playerId, {
          videoId: ytVideoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
            fs: 1,
            cc_load_policy: 1,
          },
          events: {
            onReady: () => { if (!destroyed) setIsReady(true); },
            onStateChange: (e: any) => {
              if (destroyed) return;
              if (e.data === window.YT.PlayerState.PLAYING) {
                // Read playback rate when play starts
                try {
                  const rate = playerRef.current?.getPlaybackRate?.() || 1;
                  playbackRateRef.current = rate;
                  setPlaybackRate(rate);
                } catch {}
                setIsPlaying(true);
                startTicking();
              } else {
                setIsPlaying(false);
                stopTicking();
              }
            },
            onPlaybackRateChange: (e: any) => {
              if (destroyed) return;
              const newRate = e.data || 1;
              playbackRateRef.current = newRate;
              setPlaybackRate(newRate);
            },
          },
        });
      } catch (err) {
        console.warn("YT player init error:", err);
      }
    })();

    return () => {
      destroyed = true;
      stopTicking();
      try {
        const iframe = playerRef.current?.getIframe?.();
        if (iframe && iframe.parentNode) playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytVideoId]);

  const rateLabel = playbackRate === 1 ? "1×" : `${playbackRate}×`;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Player container */}
      <div
        ref={containerRef}
        style={{
          width: "100%", aspectRatio: "16/9",
          background: "#0a0a0f",
          border: "2px solid #2d2d44",
          boxShadow: "4px 4px 0 rgba(0,0,0,0.6)",
          overflow: "hidden", position: "relative",
        }}
      >
        {!isReady && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace", fontSize: 11, color: "#6b6880", letterSpacing: "2px",
          }}>
            LOADING PLAYER...
          </div>
        )}
      </div>

      {/* Watch-time HUD */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px",
        background: "#0d0d18",
        borderLeft: eligible ? "3px solid #34d399" : "3px solid #7c3aed",
        borderBottom: "2px solid #2d2d44",
        borderRight: "2px solid #2d2d44",
        boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
      }}>
        {/* Status dot */}
        <div style={{
          width: 8, height: 8,
          background: isPlaying ? "#34d399" : "#6b6880",
          boxShadow: isPlaying ? "0 0 6px #34d399" : "none",
          flexShrink: 0,
        }} />

        {/* Watch time info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "1px", color: "#6b6880" }}>
                {isPlaying ? "▶ PLAYING" : "⏸ PAUSED"}
              </span>
              {/* Playback rate badge */}
              {playbackRate !== 1 && (
                <span style={{
                  fontFamily: "monospace", fontSize: 8, fontWeight: 700,
                  color: playbackRate >= 2 ? "#f59e0b" : "#a78bfa",
                  border: `1px solid ${playbackRate >= 2 ? "#f59e0b" : "#a78bfa"}`,
                  padding: "1px 5px", letterSpacing: "1px",
                }}>
                  {rateLabel} SPEED
                </span>
              )}
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "1px", color: eligible ? "#34d399" : "#a78bfa" }}>
              {formatDuration(Math.floor(watched))} / {formatDuration(durationSeconds)}
            </span>
          </div>

          {/* Pixel progress bar */}
          <div style={{ background: "#1a1a2e", border: "2px solid #2d2d44", height: 8, overflow: "hidden" }}>
            <div style={{
              width: `${watchPercent}%`,
              height: "100%",
              background: eligible
                ? "repeating-linear-gradient(90deg,#34d399 0,#34d399 4px,#059669 4px,#059669 8px)"
                : "repeating-linear-gradient(90deg,#7c3aed 0,#7c3aed 4px,#6d28d9 4px,#6d28d9 8px)",
              transition: "width 0.5s linear",
            }} />
          </div>
        </div>

        {/* Completion badge */}
        {eligible && (
          <div style={{
            fontFamily: "monospace", fontSize: 9, fontWeight: 700,
            color: "#34d399", letterSpacing: "2px",
            border: "2px solid #34d399",
            boxShadow: "2px 2px 0 #064e3b",
            padding: "3px 8px",
            animation: "pixelIn 0.25s ease",
          }}>
            ✓ READY
          </div>
        )}
      </div>

      {/* Title bar */}
      <div style={{
        padding: "8px 14px", background: "#13131f",
        borderBottom: "1px solid #2d2d44",
        borderLeft: "1px solid #2d2d44",
        borderRight: "1px solid #2d2d44",
      }}>
        <p style={{
          fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 600,
          color: "#e8e6f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </p>
        <p style={{ fontFamily: "monospace", fontSize: 9, color: "#6b6880", letterSpacing: "1px", marginTop: 2 }}>
          REQUIRES {Math.round(COMPLETION_THRESHOLD * 100)}% WATCHED · USE YT CONTROLS FOR SPEED
        </p>
      </div>
    </div>
  );
}
