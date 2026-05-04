import { NextRequest, NextResponse } from "next/server";
import { model } from "@/lib/ai/gemini";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    // Guard: check API key
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your-gemini-api-key") {
      return NextResponse.json(
        { error: "The System's AI core is not yet activated. Add GEMINI_API_KEY to .env.local." },
        { status: 503 }
      );
    }

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const {
      courseId,
      difficulty = "mixed",
      count = 10,
      videoIds,          // optional: string[] of specific video doc IDs to scope the quiz
    } = await req.json();
    if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });

    // Fetch course doc
    const courseRef = adminDb.collection("users").doc(uid).collection("courses").doc(courseId);
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const course = courseSnap.data()!;

    // Fetch video titles — either a specific subset or the full list (capped at 60)
    let videoTitles: string[] = [];
    if (Array.isArray(videoIds) && videoIds.length > 0) {
      // Fetch each selected video by ID (Firestore max 30 per getAll, so batch)
      const chunks: string[][] = [];
      for (let i = 0; i < videoIds.length; i += 30) chunks.push(videoIds.slice(i, i + 30));
      for (const chunk of chunks) {
        const refs = chunk.map((vid) => courseRef.collection("videos").doc(vid));
        const snaps = await adminDb.getAll(...refs);
        snaps.forEach((s) => {
          if (s.exists) {
            const t = s.data()!.title;
            if (t) videoTitles.push(t);
          }
        });
      }
    } else {
      const videosSnap = await courseRef.collection("videos").orderBy("position").limit(60).get();
      videoTitles = videosSnap.docs.map((d) => d.data().title).filter(Boolean);
    }

    const lectureScopeNote = Array.isArray(videoIds) && videoIds.length > 0
      ? `\nNote: Questions must ONLY cover the following ${videoTitles.length} selected lecture(s).`
      : "";

    const topicContext = `
Course: "${course.title}"
${course.description ? `Description: ${course.description}` : ""}${lectureScopeNote}
Topics covered (from video titles):
${videoTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}
    `.trim();

    const difficultyInstructions = {
      easy:   "Create straightforward recall questions.",
      medium: "Mix recall and comprehension questions.",
      hard:   "Focus on application, analysis, and synthesis questions.",
      mixed:  "Include a mix of easy, medium, and hard questions.",
    }[difficulty as string] ?? "Mix recall and comprehension questions.";

    const prompt = `
You are the System, an AI from Solo Leveling. Generate a quiz for a Hunter studying the following course.

${topicContext}

${difficultyInstructions}
Generate exactly ${count} multiple choice questions, each with 4 options and 1 correct answer.

RULES:
- Questions must be directly relevant to the course topics listed above
- Each question must have exactly 4 options labeled A/B/C/D
- One and only one option is correct
- Make distractors plausible but clearly wrong
- Keep questions concise (max 2 sentences)

Return EXACTLY this JSON (no markdown, no explanation):
{
  "questions": [
    {
      "question": "...",
      "options": ["option A text", "option B text", "option C text", "option D text"],
      "answer": "option A text",
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}
    `;

    let data: any;
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response");
      data = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("No questions generated");
      }
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      if (err?.message?.includes("429") || err?.message?.includes("quota")) {
        return NextResponse.json(
          { error: "The System is overloaded. Try again in a moment." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "The System failed to generate the quiz." }, { status: 500 });
    }

    return NextResponse.json({
      courseId,
      courseTitle: course.title,
      difficulty,
      questions: data.questions,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("generate-quiz error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
