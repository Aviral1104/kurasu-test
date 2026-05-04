import { YoutubeTranscript } from "youtube-transcript";
import { model } from "./gemini";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Gets or generates a 1-sentence summary for a YouTube video.
 * Caches in global 'summaries' collection to save API calls.
 */
export async function getOneSentenceSummary(ytVideoId: string): Promise<string> {
  // 1. Check cache
  const cacheRef = adminDb.collection("summaries").doc(ytVideoId);
  const cacheSnap = await cacheRef.get();
  
  if (cacheSnap.exists) {
    return cacheSnap.data()?.summary || "";
  }

  // 2. Fetch transcript (briefly)
  try {
    const transcriptParts = await YoutubeTranscript.fetchTranscript(ytVideoId);
    // Just take the first 500 words to save tokens and time
    const briefText = transcriptParts
      .slice(0, 50)
      .map((p) => p.text)
      .join(" ");

    // 3. Generate with Gemini
    const prompt = `Summarize in EXACTLY one sentence what this video is about: "${briefText}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    // 4. Cache and return
    await cacheRef.set({
      summary,
      ytVideoId,
      updatedAt: new Date().toISOString(),
    });

    return summary;
  } catch (err) {
    console.error(`Failed to summarize video ${ytVideoId}:`, err);
    return "Intelligence unavailable for this target.";
  }
}
