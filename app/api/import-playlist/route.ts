import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  fetchPlaylistInfo,
  fetchPlaylistVideos,
  extractPlaylistId,
} from "@/lib/youtube/api";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    // Verify Firebase ID token from Authorization header
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "Missing playlist URL" },
        { status: 400 }
      );
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      return NextResponse.json(
        { error: "Invalid YouTube playlist URL" },
        { status: 400 }
      );
    }

    // Fetch playlist info + all videos from YouTube API
    const [playlistInfo, videos] = await Promise.all([
      fetchPlaylistInfo(playlistId),
      fetchPlaylistVideos(playlistId),
    ]);

    // Save course document
    const courseRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("courses")
      .doc();

    const courseData = {
      title: playlistInfo.title,
      description: playlistInfo.description,
      playlistId: playlistInfo.playlistId,
      sourceUrl: url,
      thumbnailUrl: playlistInfo.thumbnailUrl,
      totalVideos: videos.length,
      sourceType: "youtube",
      deadlineDate: null,
      createdAt: FieldValue.serverTimestamp(),
    };

    await courseRef.set(courseData);

    // Save all videos in a batch (Firestore limit: 500 ops per batch)
    const batchSize = 400;
    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = adminDb.batch();
      const chunk = videos.slice(i, i + batchSize);

      for (const video of chunk) {
        const videoRef = courseRef.collection("videos").doc();
        batch.set(videoRef, video);
      }

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      courseId: courseRef.id,
      title: playlistInfo.title,
      totalVideos: videos.length,
    });
  } catch (err: any) {
    console.error("import-playlist error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
