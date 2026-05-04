import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const { id: courseId } = await params;

    const { deadlineDate } = await req.json();

    const courseRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("courses")
      .doc(courseId);

    await courseRef.update({ deadlineDate });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("course patch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
