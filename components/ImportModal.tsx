"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { getDungeonRank, RANK_COLORS } from "@/lib/utils/ranks";
import { X, Link2, Loader2, Zap, AlertTriangle } from "lucide-react";

interface Props {
  onClose: () => void;
}

type ScanPhase = "idle" | "scanning" | "identified" | "importing" | "error";

function extractPlaylistId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    return (
      u.searchParams.get("list") ||
      u.pathname.match(/playlist\/([^/?]+)/)?.[1] ||
      null
    );
  } catch {
    return null;
  }
}

export default function ImportModal({ onClose }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [error, setError] = useState("");
  const [detectedRank, setDetectedRank] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    setError("");
    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      setError("Invalid YouTube playlist URL. Paste a link containing ?list=...");
      return;
    }

    // Phase 1 — scanning animation
    setPhase("scanning");

    // Simulate scanning duration
    await new Promise((r) => setTimeout(r, 1400));

    // Phase 2 — identified (we don't know the rank yet, use placeholder)
    setDetectedRank("?");
    setPhase("identified");
    await new Promise((r) => setTimeout(r, 900));

    // Phase 3 — actually import
    setPhase("importing");

    try {
      const token = await user!.getIdToken();
      const res = await fetch("/api/import-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      router.push(`/course/${data.courseId}`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
      setPhase("error");
    }
  }

  const isLoading = phase === "scanning" || phase === "importing";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "min(480px, calc(100vw - 32px))",
          background: "#13131f",
          border: "3px solid #7c3aed",
          boxShadow: "8px 8px 0 rgba(0,0,0,0.6), inset 0 0 30px rgba(124,58,237,0.1)",
          borderRadius: 0,
          padding: 28,
          animation: "pxSlideUp 0.3s ease-out forwards",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 800,
                color: "#e8e6f0",
                letterSpacing: "1px",
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              ▸ OPEN A GATE
            </h2>
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "#6b6880", letterSpacing: "1px" }}>
              THE SYSTEM WILL ANALYZE THE DUNGEON.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#1a1a2e",
              border: "2px solid #2d2d44",
              cursor: "pointer",
              color: "#6b6880",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#dc2626";
              (e.currentTarget as HTMLElement).style.borderColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#6b6880";
              (e.currentTarget as HTMLElement).style.borderColor = "#2d2d44";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* URL input with scanner */}
        <div
          style={{
            position: "relative",
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "#0d0d18",
              border: `2px solid ${phase === "identified" ? "#7c3aed" : "#2d2d44"}`,
              padding: "0 14px",
              transition: "border-color 0.3s",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)",
            }}
          >
            <Link2 size={16} color={phase === "identified" ? "#a78bfa" : "#4a4760"} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="url"
              placeholder="PASTE GATE COORDINATES (PLAYLIST URL)..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPhase("idle");
                setError("");
              }}
              disabled={isLoading}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#e8e6f0",
                fontSize: 13,
                padding: "14px 0",
                fontFamily: "monospace",
                letterSpacing: "0.5px",
              }}
            />
          </div>

          {/* Scanner sweep line */}
          {phase === "scanning" && (
            <div className="gate-scanner-line" style={{ height: 2, background: "#7c3aed", boxShadow: "0 0 15px #7c3aed" }} />
          )}
        </div>

        {/* Status Phases */}
        <div style={{ minHeight: 45 }}>
          {phase === "identified" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "rgba(124,58,237,0.1)",
                borderLeft: "4px solid #7c3aed",
                marginBottom: 14,
                animation: "pxSlideUp 0.3s ease both",
              }}
            >
              <span style={{ fontSize: 16 }}>⚡</span>
              <p style={{ fontFamily: "monospace", fontSize: 11, color: "#a78bfa", letterSpacing: "1px" }}>
                GATE IDENTIFIED. ANALYZING RANK...
              </p>
            </div>
          )}

          {phase === "scanning" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14 }}>
              <Loader2 size={14} color="#7c3aed" className="animate-spin" />
              <p style={{ fontFamily: "monospace", fontSize: 11, color: "#6b6880", letterSpacing: "1px" }}>
                SCANNING GATE...
              </p>
            </div>
          )}

          {phase === "importing" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 14 }}>
              <Loader2 size={14} color="#34d399" className="animate-spin" />
              <p style={{ fontFamily: "monospace", fontSize: 11, color: "#34d399", letterSpacing: "1px" }}>
                MATERIALIZING DUNGEON...
              </p>
            </div>
          )}

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                background: "rgba(220,38,38,0.1)",
                borderLeft: "4px solid #dc2626",
                marginBottom: 14,
                animation: "pxSlideUp 0.3s ease both",
              }}
            >
              <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontFamily: "monospace", fontSize: 11, color: "#dc2626", letterSpacing: "0.5px" }}>{error.toUpperCase()}</p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleImport}
          disabled={!url.trim() || isLoading}
          style={{
            width: "100%",
            background: !url.trim() || isLoading ? "#1a1a2e" : "#7c3aed",
            border: `3px solid ${!url.trim() || isLoading ? "#2d2d44" : "#a78bfa"}`,
            boxShadow: !url.trim() || isLoading ? "none" : "4px 4px 0 #3b0764",
            color: !url.trim() || isLoading ? "#4a4760" : "white",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontFamily: "monospace",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "2px",
            cursor: !url.trim() || isLoading ? "not-allowed" : "pointer",
            transition: "all 0.1s",
            marginTop: 8,
          }}
          onMouseEnter={(e) => {
            if (!url.trim() || isLoading) return;
            (e.currentTarget as HTMLElement).style.transform = "translate(-1px, -1px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0 #3b0764";
          }}
          onMouseLeave={(e) => {
            if (!url.trim() || isLoading) return;
            (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 #3b0764";
          }}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          {phase === "scanning"
            ? "SCANNING..."
            : phase === "identified"
            ? "ENTERING..."
            : phase === "importing"
            ? "MATERIALIZING..."
            : "ENTER THE GATE →"}
        </button>

        {/* Supported sources */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "2px dashed #2d2d44" }}>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              color: "#4a4760",
              letterSpacing: "2px",
              marginBottom: 10,
            }}
          >
            SUPPORTED GATES
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["YOUTUBE PLAYLIST", "PDF (PHASE II)", "DOCS (PHASE II)"].map((src) => (
              <span
                key={src}
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  padding: "4px 10px",
                  background: "#0d0d18",
                  border: "1px solid #2d2d44",
                  color: "#6b6880",
                  letterSpacing: "1px",
                }}
              >
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
