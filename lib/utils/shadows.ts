/**
 * Shadow Army — SRS Flashcard Schema
 * =====================================
 *
 * /users/{userId}/shadows/{shadowId}
 *   - question: string            (the quiz question that was missed)
 *   - options: string[]           (original answer options)
 *   - answer: string              (correct answer text)
 *   - sourceTitle: string         (video title it came from)
 *   - courseId: string
 *   - videoId: string
 *   - ease: number                (SRS ease factor, starts at 2.5)
 *   - interval: number            (days until next review)
 *   - nextReview: string          (YYYY-MM-DD)
 *   - attempts: number            (total attempts)
 *   - correct: number             (correct attempts)
 *   - extractedAt: Timestamp
 */

import { Timestamp } from "firebase/firestore";

export interface ShadowDoc {
  id?: string;
  question: string;
  options: string[];
  answer: string;
  sourceTitle: string;
  courseId: string;
  videoId: string;
  ease: number;
  interval: number;
  nextReview: string; // YYYY-MM-DD
  attempts: number;
  correct: number;
  extractedAt: Timestamp;
}

/**
 * SM-2 Algorithm — calculates next review interval based on answer quality
 * quality: 0 = failed, 1 = hard, 2 = easy
 */
export function calcNextReview(
  ease: number,
  interval: number,
  quality: 0 | 1 | 2
): { ease: number; interval: number; nextReview: string } {
  let newEase = ease;
  let newInterval = interval;

  if (quality === 0) {
    // Failed — reset
    newInterval = 1;
    newEase = Math.max(1.3, ease - 0.2);
  } else if (quality === 1) {
    // Hard — slow increase
    newInterval = Math.max(1, Math.round(interval * ease * 0.8));
    newEase = Math.max(1.3, ease - 0.15);
  } else {
    // Easy — normal increase
    newInterval = Math.max(1, Math.round(interval * ease));
    newEase = ease + 0.1;
  }

  const next = new Date();
  next.setDate(next.getDate() + newInterval);
  const nextReview = next.toISOString().split("T")[0];

  return { ease: newEase, interval: newInterval, nextReview };
}

/** Returns shadows due today or earlier */
export function isDue(shadow: ShadowDoc): boolean {
  const today = new Date().toISOString().split("T")[0];
  return shadow.nextReview <= today;
}
