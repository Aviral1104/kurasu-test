import { NextRequest, NextResponse } from "next/server";
import { getOneSentenceSummary } from "@/lib/ai/summarizer";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminAuth.verifyIdToken(token);

    const ytVideoId = req.nextUrl.searchParams.get("ytVideoId");
    if (!ytVideoId) {
      return NextResponse.json({ error: "Missing ytVideoId" }, { status: 400 });
    }

    const summary = await getOneSentenceSummary(ytVideoId);
    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error("summarize-video error:", err);
    return NextResponse.json({ error: "Failed to summarize" }, { status: 500 });
  }
}
