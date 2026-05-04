import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { getDungeonRank, XP_PER_VIDEO } from "@/lib/utils/ranks";

const COMPLETION_THRESHOLD = 0.8; // Must watch 80% of video duration

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { videoId, courseId, completed, watchedSeconds = 0 } = await req.json();

    if (!videoId || !courseId) {
      return NextResponse.json(
        { error: "Missing videoId or courseId" },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(uid);
    const progressRef = userRef.collection("progress").doc(videoId);

    // ── Anti-cheat: validate watch time before allowing completion ──
    if (completed) {
      // Get video duration from the course's video sub-collection
      const videoSnap = await userRef
        .collection("courses")
        .doc(courseId)
        .collection("videos")
        .doc(videoId)
        .get();
      const videoDuration: number = videoSnap.data()?.durationSeconds ?? 0;

      // Get existing progress to check for already-completed videos
      const existingProgress = await progressRef.get();
      const alreadyCompleted = existingProgress.data()?.completed === true;

      if (!alreadyCompleted && videoDuration > 0) {
        // Validate: watchedSeconds must be >= 80% of video duration
        const required = Math.floor(videoDuration * COMPLETION_THRESHOLD);
        
        // Also check existing watched time in case client sends partial
        const existingWatched: number = existingProgress.data()?.watchedSeconds || 0;
        const effectiveWatched = Math.max(watchedSeconds, existingWatched);

        if (effectiveWatched < required) {
          return NextResponse.json(
            {
              error: "Watch time insufficient",
              required,
              watched: effectiveWatched,
              threshold: COMPLETION_THRESHOLD,
            },
            { status: 400 }
          );
        }
      }

      // Prevent re-awarding XP for already completed videos
      if (alreadyCompleted) {
        return NextResponse.json({
          success: true,
          message: "Already completed",
          xpAwarded: 0,
        });
      }
    }

    // ── Anti-cheat: watchedSeconds can only increase ──
    const currentProgress = await progressRef.get();
    const currentWatched: number = currentProgress.data()?.watchedSeconds || 0;
    const safeWatched = Math.max(currentWatched, watchedSeconds);

    // Update video progress
    await progressRef.set(
      {
        courseId,
        completed,
        watchedSeconds: safeWatched,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    let xpAwarded = 0;
    let streakResult = null;

    if (completed) {
      // Award XP based on dungeon rank (derived from total videos in the course)
      const courseSnap = await userRef.collection("courses").doc(courseId).get();
      const totalVideos: number = courseSnap.data()?.totalVideos ?? 20;
      const dungeonRank = getDungeonRank(totalVideos);
      xpAwarded = XP_PER_VIDEO[dungeonRank];

      await userRef.update({
        xp: FieldValue.increment(xpAwarded),
        totalWatchedSeconds: FieldValue.increment(safeWatched),
      });
      streakResult = await updateStreak(userRef);
    }

    return NextResponse.json({ success: true, streak: streakResult, xpAwarded });
  } catch (err: any) {
    console.error("progress error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

async function updateStreak(
  userRef: FirebaseFirestore.DocumentReference
): Promise<{ streakCount: number; isNewDay: boolean }> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const snap = await userRef.get();
  const data = snap.data();

  const lastActiveDate: string | null = data?.lastActiveDate || null;
  const currentStreak: number = data?.streakCount || 0;

  if (lastActiveDate === today) {
    // Already counted today
    return { streakCount: currentStreak, isNewDay: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak =
    lastActiveDate === yesterdayStr
      ? currentStreak + 1 // Continued streak
      : 1; // Broken streak — reset to 1

  await userRef.update({
    streakCount: newStreak,
    lastActiveDate: today,
  });

  return { streakCount: newStreak, isNewDay: true };
}
