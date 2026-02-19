# CaseCoach — Consulting Interview Trainer

An AI-powered case interview prep tool built for MBAs, undergrads, and career switchers targeting top consulting firms (McKinsey, BCG, Bain, and more).

Practice real cases out loud, get instant AI feedback on your framework scored across 7 dimensions, and track your improvement over time.

## Features

- **Voice-First Practice** — Present your framework out loud, exactly like the real interview. No typing required.
- **AI-Powered Scoring** — Frameworks scored across 7 dimensions: MECE, Case Fit, Hypothesis & Prioritization, Depth, Clarifying Questions, and Delivery.
- **Realistic Cases** — Profitability, market entry, M&A, pricing, and operations cases built to match McKinsey and BCG interview structure.
- **Interactive Q&A** — Ask clarifying questions before presenting and get realistic interviewer responses.
- **Progress Dashboard** — Every session saved. Track average scores, best performance, and improvement over time.
- **Specific Suggestions** — 5 numbered, case-specific improvement points — not generic advice.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) — auth and database
- [Tailwind CSS](https://tailwindcss.com)
- OpenAI API — transcription and framework evaluation
- Web Speech / Audio recording

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── clarify/       # Interviewer Q&A responses
│   │   ├── evaluate/      # Framework scoring
│   │   ├── transcribe/    # Audio → text
│   │   ├── tts/           # Text-to-speech
│   │   ├── waitlist/      # Waitlist signup
│   │   └── check-approved/
│   ├── dashboard/         # Session history and scores
│   ├── practice/          # Case browser and session start
│   ├── session/[id]/      # Active case session
│   ├── login/
│   └── auth/callback/
├── components/
│   ├── AudioRecorder      # Mic recording UI
│   ├── Scorecard          # AI feedback display
│   ├── Stopwatch
│   ├── Navbar
│   └── AuthGuard
└── lib/
    ├── cases.ts           # Case data
    ├── supabase.ts
    ├── storage.ts
    └── types.ts
```
