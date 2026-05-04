"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { getIdToken } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

interface Props {
  ytVideoId: string;
  /** If true, will call the API to generate a summary if not cached. Default: false */
  autoGenerate?: boolean;
}

export default function VideoSummaryLabel({ ytVideoId, autoGenerate = false }: Props) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !ytVideoId) return;

    const fetchSummary = async () => {
      // 1. Always check Firestore cache first (free, instant)
      const cacheRef = doc(db, "summaries", ytVideoId);
      const cacheSnap = await getDoc(cacheRef);
      if (cacheSnap.exists()) {
        setSummary(cacheSnap.data().summary || null);
        return;
      }

      // 2. Only call the AI API if explicitly asked (avoids rate-limit hammering)
      if (!autoGenerate) return;

      setLoading(true);
      try {
        const token = await getIdToken(auth.currentUser!);
        const res = await fetch(`/api/summarize-video?ytVideoId=${ytVideoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
      } catch (err) {
        // Silent fail — not critical
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user, ytVideoId, autoGenerate]);

  if (loading) {
    return (
      <span style={{ fontSize: 9, color: "#4a4760", fontFamily: "var(--font-system)", fontStyle: "italic" }}>
        Scanning target...
      </span>
    );
  }

  if (!summary) return null;

  return (
    <p style={{
      fontSize: 10,
      color: "#7c3aed",
      fontFamily: "var(--font-system)",
      marginTop: 4,
      fontStyle: "italic",
      lineHeight: 1.4,
      opacity: 0.8,
    }}>
      ✨ {summary}
    </p>
  );
}
