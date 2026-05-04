"use client";
import { useState } from "react";
import { CheckSquare, Square, List, Sliders, LayoutList } from "lucide-react";
import { VideoDoc } from "@/lib/firebase/schema";

type Mode = "all" | "range" | "manual";

interface Props {
  videos: (VideoDoc & { id: string })[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}

export default function VideoSelector({ videos, selectedIds, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("all");
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo]     = useState(Math.min(10, videos.length));

  const total = videos.length;

  function applyAll() {
    onChange(new Set(videos.map((v) => v.id)));
  }
  function applyRange(from: number, to: number) {
    const f = Math.max(1, from) - 1;
    const t = Math.min(total, to);
    onChange(new Set(videos.slice(f, t).map((v) => v.id)));
  }
  function toggleVideo(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(next);
  }

  function switchMode(m: Mode) {
    setMode(m);
    if (m === "all") applyAll();
    if (m === "range") applyRange(rangeFrom, rangeTo);
    if (m === "manual") onChange(new Set());
  }

  const MODES = [
    { id: "all"    as Mode, label: "SELECT ALL",    Icon: LayoutList },
    { id: "range"  as Mode, label: "RANGE",         Icon: Sliders    },
    { id: "manual" as Mode, label: "MANUAL PICK",   Icon: List       },
  ];

  return (
    <div style={{ background: "#13131f", border: "2px solid #2d2d44", padding: 20, marginBottom: 16 }}>
      <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "3px", color: "#6b6880", marginBottom: 14 }}>
        ■ SELECT LECTURES — {selectedIds.size} / {total} SELECTED
      </p>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {MODES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => switchMode(id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 4px", cursor: "pointer",
              background: mode === id ? "rgba(124,58,237,0.15)" : "#0d0d18",
              border: `2px solid ${mode === id ? "#7c3aed" : "#2d2d44"}`,
              color: mode === id ? "#a78bfa" : "#6b6880",
              fontFamily: "monospace", fontSize: 9, letterSpacing: "1px", fontWeight: 700,
              transition: "all 0.1s",
            }}
          >
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>

      {/* Range controls */}
      {mode === "range" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6880" }}>FROM</span>
          <input
            type="number" min={1} max={total}
            value={rangeFrom}
            onChange={(e) => { const v = Number(e.target.value); setRangeFrom(v); applyRange(v, rangeTo); }}
            style={{
              width: 64, padding: "5px 8px", textAlign: "center",
              background: "#0d0d18", border: "2px solid #7c3aed", color: "#e8e6f0",
              fontFamily: "monospace", fontSize: 12, fontWeight: 700,
            }}
          />
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6b6880" }}>TO</span>
          <input
            type="number" min={1} max={total}
            value={rangeTo}
            onChange={(e) => { const v = Number(e.target.value); setRangeTo(v); applyRange(rangeFrom, v); }}
            style={{
              width: 64, padding: "5px 8px", textAlign: "center",
              background: "#0d0d18", border: "2px solid #7c3aed", color: "#e8e6f0",
              fontFamily: "monospace", fontSize: 12, fontWeight: 700,
            }}
          />
          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#4a4760" }}>
            (lectures {rangeFrom}–{Math.min(rangeTo, total)} of {total})
          </span>
        </div>
      )}

      {/* Manual list */}
      {mode === "manual" && (
        <div style={{ maxHeight: 260, overflowY: "auto", display: "grid", gap: 4 }}>
          {/* Select all / none row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            <button
              onClick={applyAll}
              style={{ padding: "4px 12px", background: "transparent", border: "1px solid #7c3aed", color: "#a78bfa", fontFamily: "monospace", fontSize: 9, cursor: "pointer" }}
            >
              SELECT ALL
            </button>
            <button
              onClick={() => onChange(new Set())}
              style={{ padding: "4px 12px", background: "transparent", border: "1px solid #2d2d44", color: "#6b6880", fontFamily: "monospace", fontSize: 9, cursor: "pointer" }}
            >
              CLEAR
            </button>
          </div>

          {videos.map((v, idx) => {
            const on = selectedIds.has(v.id);
            return (
              <button
                key={v.id}
                onClick={() => toggleVideo(v.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 10px", textAlign: "left", cursor: "pointer",
                  background: on ? "rgba(124,58,237,0.12)" : "transparent",
                  border: `1px solid ${on ? "#7c3aed" : "#2d2d44"}`,
                  transition: "all 0.08s",
                }}
              >
                {on
                  ? <CheckSquare size={13} color="#a78bfa" />
                  : <Square size={13} color="#4a4760" />
                }
                <span style={{ fontFamily: "monospace", fontSize: 9, color: "#4a4760", minWidth: 28 }}>
                  #{String(idx + 1).padStart(2, "0")}
                </span>
                <span style={{
                  fontFamily: "var(--font-body)", fontSize: 11,
                  color: on ? "#e8e6f0" : "#8b8aa0",
                  flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {v.title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* All mode — just show summary */}
      {mode === "all" && (
        <div style={{ padding: "10px 14px", background: "#0d0d18", border: "1px solid #2d2d44", borderLeft: "3px solid #7c3aed" }}>
          <p style={{ fontFamily: "monospace", fontSize: 10, color: "#8b8aa0" }}>
            All <span style={{ color: "#a78bfa", fontWeight: 700 }}>{total}</span> lectures will be used as context for quiz generation.
          </p>
        </div>
      )}
    </div>
  );
}
