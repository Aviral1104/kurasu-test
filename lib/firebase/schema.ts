/**
 * Firestore Collection/Document Design
 * =====================================
 *
 * /users/{userId}
 *   - email: string
 *   - name: string
 *   - username: string | null
 *   - avatarUrl: string | null
 *   - streakCount: number
 *   - streakFreezeUsed: boolean
 *   - lastActiveDate: string (YYYY-MM-DD)
 *   - createdAt: Timestamp
 *
 * /users/{userId}/courses/{courseId}
 *   - title: string
 *   - description: string
 *   - playlistId: string              (YouTube playlist ID)
 *   - sourceUrl: string               (for non-YouTube sources)
 *   - thumbnailUrl: string
 *   - totalVideos: number
 *   - sourceType: 'youtube' | 'pdf' | 'blog' | 'github' | 'notion'
 *   - deadlineDate: string | null     (YYYY-MM-DD, Phase 3)
 *   - createdAt: Timestamp
 *
 * /users/{userId}/courses/{courseId}/videos/{videoId}
 *   - ytVideoId: string
 *   - title: string
 *   - durationSeconds: number
 *   - position: number
 *   - thumbnailUrl: string
 *
 * /users/{userId}/progress/{videoId}
 *   - courseId: string
 *   - completed: boolean
 *   - watchedSeconds: number
 *   - updatedAt: Timestamp
 *
 * /videos/{videoId}/notes/{noteId}          (global — cached per video)
 *   - userId: string
 *   - content: string
 *   - aiGenerated: boolean
 *   - createdAt: Timestamp
 *
 * /videos/{videoId}/quizzes/{quizId}        (global — AI-generated, shared)
 *   - question: string
 *   - options: string[]
 *   - correctIndex: number
 *   - createdAt: Timestamp
 *
 * /videos/{videoId}/flashcards/{flashcardId}
 *   - term: string
 *   - definition: string
 *   - createdAt: Timestamp
 *
 * /users/{userId}/certificates/{courseId}
 *   - courseId: string
 *   - courseTitle: string
 *   - imageUrl: string
 *   - issuedAt: Timestamp
 *
 * Security Rules: see firestore.rules
 */

// TypeScript types matching the schema above

import { Timestamp } from "firebase/firestore";

export type SourceType = "youtube" | "pdf" | "blog" | "github" | "notion";

export interface UserDoc {
  email: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  streakCount: number;
  streakFreezeUsed: boolean;
  lastActiveDate: string | null; // YYYY-MM-DD
  createdAt: Timestamp;
}

export interface CourseDoc {
  id?: string;
  title: string;
  description: string;
  playlistId: string;
  sourceUrl: string;
  thumbnailUrl: string;
  totalVideos: number;
  sourceType: SourceType;
  deadlineDate: string | null;
  createdAt: Timestamp;
}

export interface VideoDoc {
  id?: string;
  ytVideoId: string;
  title: string;
  durationSeconds: number;
  position: number;
  thumbnailUrl: string;
}

export interface ProgressDoc {
  courseId: string;
  completed: boolean;
  watchedSeconds: number;
  updatedAt: Timestamp;
}

export interface NoteDoc {
  id?: string;
  userId: string;
  content: string;
  aiGenerated: boolean;
  createdAt: Timestamp;
}

export interface QuizDoc {
  id?: string;
  question: string;
  options: string[];
  correctIndex: number;
  createdAt: Timestamp;
}

export interface FlashcardDoc {
  id?: string;
  term: string;
  definition: string;
  createdAt: Timestamp;
}

export interface CertificateDoc {
  courseId: string;
  courseTitle: string;
  imageUrl: string;
  issuedAt: Timestamp;
}
