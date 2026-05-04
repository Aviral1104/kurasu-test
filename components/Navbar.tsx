"use client";

import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { LogOut, BookOpen, Flame, User } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setStreakCount(snap.data()?.streakCount || 0);
    });
    return unsub;
  }, [user]);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Logo */}
      <Link
        href={user ? "/dashboard" : "/"}
        style={{ display: "flex", alignItems: "center", gap: "10px" }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, var(--accent), var(--success))",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BookOpen size={18} color="white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.3px" }}>
          Kurasu
        </span>
      </Link>

      {/* Right side */}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Streak badge */}
          {streakCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255, 107, 53, 0.12)",
                border: "1px solid rgba(255, 107, 53, 0.3)",
                borderRadius: 999,
                padding: "5px 12px",
                color: "var(--streak)",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              <Flame size={15} />
              {streakCount}
            </div>
          )}

          {/* Avatar */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "2px solid var(--border)",
                cursor: "pointer",
              }}
            />
          ) : (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={16} color="white" />
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={signOut}
            className="btn-ghost"
            title="Sign out"
            style={{ padding: "6px 8px" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}
