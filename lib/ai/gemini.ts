import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

export const genAI = new GoogleGenerativeAI(apiKey || "");

// gemini-2.5-flash-lite: fast, high free-tier quota, good for summaries & quizzes
export const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
