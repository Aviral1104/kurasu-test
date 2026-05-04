import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { model } from "@/lib/ai/gemini";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    // Guard: ensure AI key is configured before doing any work
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your-gemini-api-key") {
      return NextResponse.json(
        { error: "The System's AI core is not yet activated. Add GEMINI_API_KEY to .env.local." },
        { status: 503 }
      );
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const { videoId, courseId, ytVideoId } = await req.json();

    if (!ytVideoId || !videoId || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch transcript
    let transcriptText = "";
    try {
      const transcriptParts = await YoutubeTranscript.fetchTranscript(ytVideoId);
      transcriptText = transcriptParts.map((p) => p.text).join(" ");
    } catch (err) {
      console.error("Transcript fetch error:", err);
      return NextResponse.json(
        { error: "Transcript unavailable. The System cannot analyze this target." },
        { status: 404 }
      );
    }

    // 2. Call the AI core
    const prompt = `
      Given this YouTube video transcript, create:
      1. A 200-word summary
      2. 5 key takeaways as bullet points
      3. 3 review questions to test understanding

      Transcript: ${transcriptText.substring(0, 15000)}

      Return EXACTLY as JSON in this format:
      {
        "summary": "...",
        "keyPoints": ["...", "...", ...],
        "quiz": [
          { "question": "...", "options": ["...", "...", "...", "..."], "answer": "..." },
          ...
        ]
      }
    `;

    let data: any;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean JSON (AI sometimes wraps in ```json ... ```)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response");
      data = JSON.parse(jsonMatch[0]);
    } catch (err: any) {
      console.error("AI generation error:", err);
      // Detect invalid API key specifically
      if (err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("API key not valid")) {
        return NextResponse.json(
          { error: "The System's AI key is invalid. Please check GEMINI_API_KEY in .env.local." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "The System failed to analyze this target. Try again." },
        { status: 500 }
      );
    }

    // 3. Save to Firestore
    const notesRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("courses")
      .doc(courseId)
      .collection("videos")
      .doc(videoId)
      .collection("notes")
      .doc("intel");

    const notesData = {
      ...data,
      aiGenerated: true,
      updatedAt: new Date().toISOString(),
    };

    await notesRef.set(notesData, { merge: true });
    return NextResponse.json(notesData);
  } catch (err: any) {
    console.error("generate-notes error:", err);
    return NextResponse.json({ error: err.message || "The System encountered an unknown error." }, { status: 500 });
  }
}
