"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import CategoryCard, { CATEGORIES, type Category } from "@/components/course/CategoryCard";

export default function CategoriesPage() {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(cat: Category) {
    setSelected((prev) => (prev === cat.id ? null : cat.id));
  }

  return (
    <AppShell>
      <div style={{ padding: "28px 32px 80px", maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: 6,
            color: "#e8e6f0",
          }}>
            Course Categories
          </h1>
          <p style={{ fontFamily: "monospace", fontSize: 12, color: "#6b6880", fontStyle: "italic" }}>
            Select a dungeon type to specialize your learning path.
          </p>
        </div>

        {/* Category grid — 3 columns matching the reference image */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}>
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              selected={selected === cat.id}
              onClick={handleSelect}
            />
          ))}
        </div>

        {/* Selection confirmation */}
        {selected && (
          <div style={{
            marginTop: 28,
            padding: "14px 20px",
            background: "rgba(13,13,24,0.95)",
            border: "2px solid #2d2d44",
            boxShadow: "4px 4px 0 rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#8b8aa0", letterSpacing: "1px" }}>
              SELECTED: <span style={{ color: "#e8e6f0", fontWeight: 700 }}>
                {CATEGORIES.find(c => c.id === selected)?.title}
              </span>
            </span>
            <button
              style={{
                background: "#06b6d4", color: "#0a0a0f",
                border: "2px solid #22d3ee",
                boxShadow: "3px 3px 0 #0e7490",
                padding: "8px 18px",
                fontFamily: "var(--font-heading)", fontWeight: 800,
                fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase",
                cursor: "pointer", borderRadius: 2,
              }}
            >
              Confirm Selection
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
