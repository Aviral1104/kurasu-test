"use client";

import { Calendar, Target, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CourseDoc } from "@/lib/firebase/schema";

interface CourseWithDeadline extends CourseDoc {
  id: string;
  completedCount: number;
}

interface Props {
  courses: CourseWithDeadline[];
}

export default function ScheduleWidget({ courses }: Props) {
  const activeSchedules = courses.filter((c) => c.deadlineDate && c.completedCount < c.totalVideos);

  if (activeSchedules.length === 0) {
    return (
      <div style={{ background: "#13131f", border: "2px solid #2d2d44", boxShadow: "4px 4px 0 rgba(0,0,0,0.4)", padding: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 4px, transparent 4px, transparent 8px)" }} />
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "2px", color: "#6b6880", marginBottom: 14 }}>HUNTER SCHEDULE</p>
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <p style={{ fontFamily: "monospace", fontSize: 10, color: "#4a4760", letterSpacing: "1px" }}>NO ACTIVE DEADLINES SET.</p>
          <p style={{ fontFamily: "monospace", fontSize: 9, color: "#3b0764", marginTop: 4 }}>SET A GOAL DATE ON A DUNGEON TO SEE TARGETS.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#13131f", border: "2px solid #2d2d44", boxShadow: "4px 4px 0 rgba(0,0,0,0.4)", padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "repeating-linear-gradient(90deg, #7c3aed 0, #7c3aed 4px, transparent 4px, transparent 8px)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "2px", color: "#6b6880" }}>HUNTER SCHEDULE</p>
        <Calendar size={12} color="#6b6880" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {activeSchedules.map((course) => {
          const remaining = course.totalVideos - course.completedCount;
          const today = new Date();
          const goal = new Date(course.deadlineDate!);
          const diffTime = goal.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          const target = diffDays > 0 ? Math.ceil(remaining / diffDays) : remaining;

          return (
            <Link 
              key={course.id} 
              href={`/course/${course.id}`}
              style={{
                display: "block", textDecoration: "none",
                background: "#0d0d18", border: "1px solid #2d2d44",
                padding: "10px 12px", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed";
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#2d2d44";
                (e.currentTarget as HTMLElement).style.background = "#0d0d18";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#e8e6f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "60%" }}>
                  {course.title.toUpperCase()}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 9, color: "#34d399", letterSpacing: "1px" }}>
                  {diffDays}d LEFT
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Target size={10} color="#7c3aed" />
                  <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#a78bfa" }}>
                    {target} TARGETS TODAY
                  </span>
                </div>
                <ChevronRight size={12} color="#4a4760" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
