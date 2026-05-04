"use client";

import Image from "next/image";

// ── Category definition ────────────────────────────────────────────────────
export interface Category {
  id: string;
  title: string;            // e.g. "PROGRAMMING / COMPUTER SCIENCE"
  description: string;
  thumbnail: string;        // /public path
  accentColor: string;      // border + glow
  glowColor: string;        // rgba for outer glow
  traits: { icon: string; label: string }[];
  examples: string;         // comma-separated example sources
  progressDots?: number;    // filled dots out of 5
}

// ── Built-in category data ─────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  {
    id: "programming",
    title: "PROGRAMMING / COMPUTER SCIENCE",
    description:
      "Coding tutorials, algorithms, system design, data structures. Usually long courses with heavy theory.",
    thumbnail: "/cat-programming.png",
    accentColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.50)",
    traits: [
      { icon: "⚡", label: "High difficulty variance" },
      { icon: "📘", label: "Theory-heavy" },
      { icon: "📈", label: "Progress linear" },
    ],
    examples: "LeetCode, NeetCode, CS50, MIT OpenCourseWare",
    progressDots: 3,
  },
  {
    id: "data",
    title: "DATA / ANALYTICS / BUSINESS",
    description:
      "SQL, Power BI, data science, analytics, business intelligence. Focuses on real-world applications.",
    thumbnail: "/cat-data.png",
    accentColor: "#22c55e",
    glowColor: "rgba(34,197,94,0.50)",
    traits: [
      { icon: "🔧", label: "Practical projects" },
      { icon: "📁", label: "Portfolio-building" },
      { icon: "🗄️", label: "Real datasets" },
    ],
    examples: "DataCamp, Kaggle tutorials, Mode Analytics SQL",
    progressDots: 4,
  },
  {
    id: "design",
    title: "DESIGN / CREATIVE / UI-UX",
    description:
      "Figma design, graphic design, web design, animation, branding. Visual-focused, project-based.",
    thumbnail: "/cat-design.png",
    accentColor: "#38bdf8",
    glowColor: "rgba(56,189,248,0.50)",
    traits: [
      { icon: "👁️", label: "Visual-focused" },
      { icon: "🖼️", label: "Portfolio-heavy" },
      { icon: "✅", label: "Completion = deliverables" },
    ],
    examples: "Interaction Design Foundation, Figma tutorials, Adobe courses",
    progressDots: 2,
  },
  {
    id: "writing",
    title: "WRITING / COMMUNICATION / SOFT SKILLS",
    description:
      "Writing courses, public speaking, storytelling, copywriting, interpersonal skills.",
    thumbnail: "/cat-writing.png",
    accentColor: "#f59e0b",
    glowColor: "rgba(245,158,11,0.50)",
    traits: [
      { icon: "🪞", label: "Reflection-based" },
      { icon: "📝", label: "Heavy note-taking" },
      { icon: "⭐", label: "Subjective progress" },
    ],
    examples: "MasterClass, Impact Theory, writing workshops",
    progressDots: 2,
  },
  {
    id: "language",
    title: "LANGUAGE LEARNING",
    description:
      "Languages, grammar, pronunciation, cultural context. Spaced repetition, vocabulary building.",
    thumbnail: "/cat-language.png",
    accentColor: "#34d399",
    glowColor: "rgba(52,211,153,0.50)",
    traits: [
      { icon: "🔁", label: "Repetition-based" },
      { icon: "📅", label: "Daily habits" },
      { icon: "📖", label: "Vocab tracking" },
    ],
    examples: "Duolingo, Coursera language courses, YouTube polyglot channels",
    progressDots: 3,
  },
  {
    id: "fitness",
    title: "FITNESS / WELLNESS / PERSONAL DEVELOPMENT",
    description:
      "Fitness, meditation, mental health, productivity, self-improvement, life skills.",
    thumbnail: "/cat-fitness.png",
    accentColor: "#4ade80",
    glowColor: "rgba(74,222,128,0.50)",
    traits: [
      { icon: "⚡", label: "Action-based" },
      { icon: "✅", label: "Habit building" },
      { icon: "🛡️", label: "Discipline-focused" },
    ],
    examples: "Fitness YouTube channels, meditation apps, Tim Ferriss courses",
    progressDots: 4,
  },
];

// ── Component ──────────────────────────────────────────────────────────────
interface Props {
  category: Category;
  onClick?: (category: Category) => void;
  selected?: boolean;
}

export default function CategoryCard({ category, onClick, selected }: Props) {
  const { accentColor, glowColor } = category;

  return (
    <div
      onClick={() => onClick?.(category)}
      style={{
        background: "#0d0d18",
        border: `3px solid ${accentColor}`,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}60, 0 0 32px 6px ${glowColor}, 4px 4px 0 rgba(0,0,0,0.6)`
          : `0 0 0 1px ${accentColor}20, 0 0 16px 2px ${glowColor}, 4px 4px 0 rgba(0,0,0,0.6)`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.1s ease, box-shadow 0.1s ease",
        position: "relative",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translate(-2px, -2px)";
        el.style.boxShadow = `0 0 0 1px ${accentColor}50, 0 0 26px 5px ${glowColor}, 6px 6px 0 rgba(0,0,0,0.6)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "translate(0, 0)";
        el.style.boxShadow = selected
          ? `0 0 0 2px ${accentColor}60, 0 0 32px 6px ${glowColor}, 4px 4px 0 rgba(0,0,0,0.6)`
          : `0 0 0 1px ${accentColor}20, 0 0 16px 2px ${glowColor}, 4px 4px 0 rgba(0,0,0,0.6)`;
      }}
    >
      {/* ── Thumbnail ── */}
      <div style={{ position: "relative", height: 140, flexShrink: 0 }}>
        <Image
          src={category.thumbnail}
          alt={category.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          style={{ objectFit: "cover", objectPosition: "center top" }}
        />
        {/* Bottom fade into card body */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(to bottom, transparent 35%, #0d0d18 100%)`,
          pointerEvents: "none",
        }} />
        {/* Scanlines */}
        <div style={{
          position: "absolute", inset: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)",
          pointerEvents: "none",
        }} />
        {/* Corner accents */}
        <div style={{ position: "absolute", top: 6, left: 6, width: 12, height: 12, borderTop: `2px solid ${accentColor}80`, borderLeft: `2px solid ${accentColor}80` }} />
        <div style={{ position: "absolute", top: 6, right: 6, width: 12, height: 12, borderTop: `2px solid ${accentColor}80`, borderRight: `2px solid ${accentColor}80` }} />
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "10px 14px 14px", display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Title */}
        <h3 style={{
          fontFamily: "var(--font-heading)",
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: "0.5px",
          color: "#e8e6f0",
          marginBottom: 6,
          lineHeight: 1.25,
          textTransform: "uppercase",
        }}>
          {category.title}
        </h3>

        {/* Two-column: description left, traits right */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flex: 1 }}>

          {/* Description */}
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            color: "#8b8aa0",
            lineHeight: 1.5,
            flex: 1,
          }}>
            {category.description}
          </p>

          {/* Trait badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 140, flexShrink: 0 }}>
            {category.traits.map((trait) => (
              <div
                key={trait.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 8px",
                  background: `${accentColor}12`,
                  border: `1px solid ${accentColor}30`,
                  borderRadius: 1,
                }}
              >
                <span style={{ fontSize: 10 }}>{trait.icon}</span>
                <span style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  color: "#9ca3af",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                }}>
                  {trait.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: `repeating-linear-gradient(90deg, ${accentColor}30 0, ${accentColor}30 4px, transparent 4px, transparent 8px)`,
          marginBottom: 8,
        }} />

        {/* Examples row */}
        <p style={{
          fontFamily: "monospace",
          fontSize: 9,
          color: accentColor,
          letterSpacing: "0.5px",
          marginBottom: 10,
          opacity: 0.85,
        }}>
          Examples: {category.examples}
        </p>

        {/* Progress dots bar — like the reference image */}
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                background: i < (category.progressDots ?? 0)
                  ? accentColor
                  : `${accentColor}20`,
                border: `1px solid ${accentColor}40`,
                borderRadius: 1,
                boxShadow: i < (category.progressDots ?? 0) ? `0 0 6px ${accentColor}60` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Selected indicator glow overlay */}
      {selected && (
        <div style={{
          position: "absolute", inset: 0,
          background: `${accentColor}08`,
          pointerEvents: "none",
        }} />
      )}
    </div>
  );
}
