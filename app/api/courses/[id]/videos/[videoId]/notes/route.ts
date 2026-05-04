import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const { id: courseId, videoId } = await params;

    const { content } = await req.json();

    const notesRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("courses")
      .doc(courseId)
      .collection("videos")
      .doc(videoId)
      .collection("notes")
      .doc("intel");

    await notesRef.set(
      { manualContent: content, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("notes patch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
