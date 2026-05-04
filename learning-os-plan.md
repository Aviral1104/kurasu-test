# Learning OS — Full Build Plan
### AI-powered learning system for chaotic online learners

---

## What You're Building

A personal learning OS — paste anything (YouTube playlist, blog, PDF, docs link), and it becomes a structured course with AI-generated notes, quizzes, streaks, and a public profile that proves what you know.

Think **Notion + Duolingo + Anki**, but built around the internet's free content.

---

## The Problem You're Solving

- YouTube has the world's best free courses — but zero structure
- People start playlists, lose their place, never finish
- No notes, no retention, no proof of learning
- Existing tools (Notion, Google Keep) require manual effort

**Your product removes the manual effort entirely.**

---

## Tech Stack (100% Free to Start)

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Pages + API routes in one project |
| Database + Auth | Supabase | Postgres + auth + real-time, free tier |
| Hosting | Vercel | One-command deploy, free tier |
| YouTube data | YouTube Data API v3 | 10,000 units/day free |
| AI layer | Gemini 1.5 Flash | ~1M tokens/day free — enough for 500+ summaries/day |
| Email | Resend | 3,000 emails/month free |

**Total monthly cost at launch: ₹0**

---

## Database Schema

### `users`
| Field | Type |
|---|---|
| id | uuid PK |
| email | string |
| name | string |
| created_at | timestamp |

### `courses`
| Field | Type |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| title | string |
| playlist_id | string |
| thumbnail_url | string |
| total_videos | int |
| source_type | enum (youtube, pdf, blog, docs) |
| created_at | timestamp |

### `videos`
| Field | Type |
|---|---|
| id | uuid PK |
| course_id | uuid FK |
| yt_video_id | string |
| title | string |
| duration_seconds | int |
| position | int |

### `video_progress`
| Field | Type |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| video_id | uuid FK |
| completed | boolean |
| watched_seconds | int |
| updated_at | timestamp |

### `notes`
| Field | Type |
|---|---|
| id | uuid PK |
| user_id | uuid FK |
| video_id | uuid FK |
| content | text |
| ai_generated | boolean |
| created_at | timestamp |

### `quizzes`
| Field | Type |
|---|---|
| id | uuid PK |
| video_id | uuid FK |
| question | text |
| options | jsonb |
| correct_index | int |
| created_at | timestamp |

---

## Build Phases

### Phase 1 — Core Tracker (Weeks 1–3)

**Goal:** Ship something real people can use.

- [ ] Auth with Supabase (Google login)
- [ ] Paste YouTube playlist URL → fetch all videos via YouTube API
- [ ] Display as a structured course with checkboxes
- [ ] Mark videos as complete
- [ ] Progress bar per course
- [ ] "Resume where you left off" button
- [ ] Basic dashboard — all your courses at a glance
- [ ] Daily streak counter

**Definition of done:** A user can import a playlist and track their progress. Nothing more.

---

### Phase 2 — AI Learning Layer (Weeks 4–7)

**Goal:** This is your moat. AI does the cognitive work so users don't have to.

- [ ] After a video is marked complete → trigger Gemini API call
- [ ] Generate: 3–5 key takeaways from video title + transcript (via YouTube captions API)
- [ ] Generate: Short summary (150–200 words)
- [ ] Generate: 3 MCQ quiz questions per video
- [ ] Generate: 5 flashcard pairs (term → definition)
- [ ] Show quiz before user can mark video complete ("prove you watched it")
- [ ] Flashcard export to Anki `.apkg` format
- [ ] Store all AI outputs in DB — never re-generate for the same video

**Gemini prompt structure (notes):**
```
You are a learning assistant. Given the title and transcript of a YouTube video, extract:
1. A 150-word summary
2. 5 key takeaways as bullet points
3. 3 multiple choice quiz questions (each with 4 options, indicate correct answer)

Video title: {title}
Transcript: {transcript}

Respond in JSON only.
```

**Cost at this stage:** Still ₹0 — Gemini free tier handles 500+ summaries/day.

---

### Phase 3 — Completion Engine (Weeks 6–8, parallel)

**Goal:** Solve "people don't finish courses." This drives retention.

- [ ] GitHub-style activity heatmap (days with learning activity)
- [ ] Streak freeze (one per week — prevents rage-quit on missed days)
- [ ] Soft deadlines — "I want to finish this by [date]" with daily targets
- [ ] Next video nudge — persistent "continue learning" CTA on dashboard
- [ ] Weekly email digest — "You watched 4 videos this week, 3 to go"
- [ ] Completion certificate — auto-generated PNG/PDF on course finish

**Weekly email (Resend):** Send every Monday morning. Include: streak status, courses in progress, % to next milestone.

---

### Phase 4 — Platform Expansion (Month 3+)

**Goal:** Become the place where all learning lives, not just YouTube.

- [ ] **PDF upload** → parse text → auto-outline + chapter notes + quiz
- [ ] **Blog URL** → scrape + summarize → save to reading list
- [ ] **GitHub repo** → add to learning queue, track reading progress per file
- [ ] **Docs/Notion links** → save + tag + queue
- [ ] Unified learning queue across all content types
- [ ] AI-generated weekly learning report across all sources

---

### Phase 5 — Social Layer (Month 3+)

**Goal:** Turn users into your marketing team.

- [ ] Public learning profile — `yourapp.com/u/username`
  - Courses completed
  - Current streak
  - Skills being learned
  - Certificates earned
- [ ] Shareable course progress card (OG image — share on Twitter/LinkedIn)
- [ ] "Study with a friend" — share a course, see each other's progress
- [ ] LinkedIn-ready completion certificate with verifiable link

---

## Monetization

### Freemium Model

| Feature | Free | Pro (₹299/month) |
|---|---|---|
| Courses | Up to 5 | Unlimited |
| Progress tracking | ✓ | ✓ |
| Streaks + heatmap | ✓ | ✓ |
| Public profile | ✓ | ✓ |
| AI notes + summaries | ✗ | ✓ |
| Auto quizzes + flashcards | ✗ | ✓ |
| PDF + blog import | ✗ | ✓ |
| Completion certificates | ✗ | ✓ |
| Weekly AI progress report | ✗ | ✓ |

### Revenue Math

| Users | Conversion | Paying | MRR |
|---|---|---|---|
| 1,000 | 5% | 50 | ₹14,950 |
| 5,000 | 6% | 300 | ₹89,700 |
| 10,000 | 8% | 800 | ₹2,39,200 |

**At 10,000 users → ₹28L/year. That's a real one-person business.**

---

## Getting First 1,000 Users (Free)

### Week 1–2 — Launch (Target: 50 users)

- Post on **r/learnprogramming**, **r/productivity**, **r/cscareerquestions**
  - "I built a free tool to track YouTube courses"
- Twitter/X thread — show before/after (chaos of saved YT videos vs clean course view)
- Post on **IndieHackers** — builders love origin stories, they share
- Share in **WhatsApp/Telegram** coding groups, college dev clubs, GATE prep groups

### Week 3–6 — Grow (Target: 200 users)

- **ProductHunt launch** — even a mid-rank finish sends 500+ visitors
- **DM 20 Indian edu YouTubers** — "your viewers can now track your playlists"
- **SEO blog post** — "Best free YouTube courses for learning [X]" — embed your tool
- **Build in public on Twitter** — weekly stats, features shipped, user feedback

### Month 2–3 — Compound (Target: 1,000 users)

- Enable **shareable public profiles** — every share is free marketing
- Launch **course directory page** — top-rated free YouTube courses (SEO magnet)
- **College outreach** — email coding clubs and placement cells
- **LinkedIn integration** — users add completed courses to their profile

---

## Your Unfair Advantages

1. **You feel the pain** — you're a learner yourself, you know what's broken
2. **India-first pricing** — ₹299/month, no Western competitor will bother at this price point
3. **Free content era** — YouTube has the best courses, nobody has built proper tooling around them
4. **AI as a feature, not the product** — you're not an "AI wrapper," the value is the workflow
5. **Zero switching cost to acquire, high switching cost to leave** — once their notes and progress live in your app, they won't leave

---

## What Makes This a Startup (Not Just a Side Project)

| Side project | Startup |
|---|---|
| Tracker only | Tracker + AI notes + quizzes + streaks + social |
| Users come once | Users come back daily (streak system) |
| No moat | AI-generated notes per video = data moat |
| No virality | Public profiles + share cards spread organically |
| No monetization | Clear freemium path with real willingness to pay |

---

## Suggested Name Ideas

- **Learnify** — clean, memorable
- **Coursify** — clear what it does
- **Trackwise** — productivity angle
- **Mindstack** — learning OS angle
- **Studypath** — student-focused

---

## Next Steps

1. Set up Next.js + Supabase + Vercel (1 day)
2. Build auth + YouTube playlist import (3 days)
3. Build progress tracking dashboard (3 days)
4. Add streaks (1 day)
5. **Ship Phase 1 and get 10 real users**
6. Only then build the AI layer

> The biggest mistake is building Phase 2 before anyone has used Phase 1.
> Ship fast. Get feedback. Then add the intelligence.
