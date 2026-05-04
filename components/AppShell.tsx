"use client";

import Sidebar from "@/components/Sidebar";
import { ReactNode } from "react";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 64,
          flex: 1,
          minHeight: "100vh",
          background: "transparent",
          overflowX: "hidden",
          position: "relative",
          zIndex: 2,
        }}
      >
        {children}
      </main>
    </div>
  );
}
