"use client";

import { useState, useRef } from "react";
import Link from "next/link";

// ── Static demo data ──────────────────────────────────────────────────────────
const MOCK_SCORES = {
  overall: 3.7,
  mece: 4,
  caseFit: 3,
  hypothesis: 4,
  depth: 3,
  clarifying: 4,
  delivery: 4,
};

const MOCK_FEEDBACK = {
  topStrength:
    "Strong MECE structure with four distinct, non-overlapping buckets that cover the key dimensions of any market entry decision.",
  topImprovement:
    "Case Fit could be stronger — the framework reads as a standard market-entry template rather than one tailored to a premium coffee brand navigating China's unique competitive dynamics.",
};

const MOCK_SUGGESTIONS = [
  "Add a 'Brand Localization' bucket — since this is a premium brand with zero Asia presence, cultural positioning and menu adaptation deserve their own bucket.",
  "Quantify your hypothesis upfront. Instead of 'China looks attractive', anchor with: 'Given a $12B market growing 15% annually, we believe entry is worth pursuing — let me show how I'd validate that.'",
  "Address digital/delivery explicitly. 40% of Chinese coffee sales are delivery-first. Ignoring this channel would be a critical gap in any entry strategy.",
  "Prioritize your buckets out loud. Tell the interviewer which bucket matters most and why — this demonstrates business judgment, not just structure.",
  "Flag the JV constraint early. Foreign ownership restrictions are well-known in Chinese retail; spotting this upfront signals case-specific awareness.",
];

const MOCK_COMMENTS: Record<string, string> = {
  MECE: "Four distinct, non-overlapping buckets. No cross-contamination between Market Attractiveness and Competitive Landscape.",
  "Case Fit":
    "Solid framework but generic. Adding a localization or cultural-fit bucket would make it specific to a premium coffee brand entering Asia.",
  "Hypothesis & Prioritization":
    "Led with Market Attractiveness and stated you'd prioritize competitive dynamics next. Clear and logical sequencing.",
  Depth:
    "Revenue model and entry-mode analysis were strong. Digital/delivery strategy sub-point was mentioned but left underdeveloped.",
  "Clarifying Questions":
    "Asked about market size, competitive dynamics, and client financials — all highly relevant. Could also have probed management's risk appetite.",
  Delivery:
    "Clear signposting throughout. Used 'three areas' upfront, returned to label each bucket before diving in. Confident pacing.",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score <= 2 ? "#EF4444" : score <= 3 ? "#F59E0B" : score <= 4 ? "#10B981" : "#059669";
  return (
    <div className="rounded-lg bg-[#F1F1F1] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-black">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>
          {score}/5
        </span>
      </div>
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / 5) * 100}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs leading-relaxed text-gray-500">{MOCK_COMMENTS[label]}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setPosition(data.position);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const overallPct = Math.round(MOCK_SCORES.overall * 20);

  return (
    <div className="flex flex-col gap-12 pb-24 sm:gap-20">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-6 py-12 text-center sm:py-20">
        <span className="inline-flex items-center rounded-full border border-[#00A651]/30 bg-green-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00A651]">
          Early Access — Limited Spots
        </span>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-black sm:text-5xl lg:text-6xl">
          The AI Coach Built to Get You Into{" "}
          <span className="text-[#00A651]">Top Consulting</span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-gray-500">
          Practice real cases out loud. Get instant AI feedback on your framework — scored
          across 7 dimensions with specific, actionable suggestions to improve.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
          >
            Request Early Access
            <span aria-hidden="true">&rarr;</span>
          </button>
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-400 underline-offset-2 hover:text-black hover:underline"
          >
            Already have access? Sign in
          </Link>
        </div>
      </div>

      {/* ── Demo ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            See It In Action
          </p>
          <h2 className="mt-2 text-3xl font-bold text-black">
            Real feedback. Real cases.
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Here&apos;s what a session looks like — case prompt, voice recording, and the scorecard you get back.
          </p>
        </div>

        {/* Case prompt card */}
        <div className="rounded-xl bg-[#F1F1F1] p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
              Market Entry
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Intermediate
            </span>
          </div>
          <h3 className="mb-2 text-lg font-bold text-black">Coffee Chain Entering China</h3>
          <p className="text-sm leading-relaxed text-gray-500">
            Our client is a premium US-based coffee chain with 500 locations across North
            America. They are considering entering the Chinese market, where coffee
            consumption is growing at 15% annually. The CEO wants to know whether they
            should enter China, and if so, what their strategy should be...
          </p>
          <p className="mt-4 text-xs font-semibold text-[#00A651]">
            After reading the case you&apos;d ask clarifying questions, build your framework, then present your framework out loud &rarr;
          </p>
        </div>

        {/* Scorecard preview */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-black sm:text-xl">Your Framework AI Scorecard</h3>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#10B981]">{overallPct}/100</p>
              <p className="text-xs text-gray-400">Overall Score</p>
            </div>
          </div>

          {/* Strength / Improvement */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                Top Strength
              </p>
              <p className="text-sm text-green-900">{MOCK_FEEDBACK.topStrength}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Top Improvement
              </p>
              <p className="text-sm text-amber-900">{MOCK_FEEDBACK.topImprovement}</p>
            </div>
          </div>

          {/* Score bars */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScoreBar label="MECE" score={MOCK_SCORES.mece} />
            <ScoreBar label="Case Fit" score={MOCK_SCORES.caseFit} />
            <ScoreBar label="Hypothesis & Prioritization" score={MOCK_SCORES.hypothesis} />
            <ScoreBar label="Depth" score={MOCK_SCORES.depth} />
            <ScoreBar label="Clarifying Questions" score={MOCK_SCORES.clarifying} />
            <ScoreBar label="Delivery" score={MOCK_SCORES.delivery} />
          </div>

          {/* Blurred suggestions with CTA overlay */}
          <div className="relative overflow-hidden rounded-xl">
            <div className="pointer-events-none select-none blur-sm" aria-hidden="true">
              <div className="rounded-xl bg-[#F1F1F1] p-6">
                <h4 className="mb-4 text-lg font-bold text-black">
                  How to Improve Your Framework
                </h4>
                <div className="space-y-2">
                  {MOCK_SUGGESTIONS.slice(0, 3).map((s, i) => (
                    <div key={i} className="flex gap-3 rounded-lg bg-white p-4">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00A651] text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <p className="text-sm text-black">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-white/80 backdrop-blur-[2px]">
              <p className="text-sm font-semibold text-black">
                Sign up to unlock your full AI feedback &amp; improvement plan
              </p>
              <button
                onClick={scrollToForm}
                className="rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
              >
                Get Early Access
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            What You Get
          </p>
          <h2 className="mt-2 text-3xl font-bold text-black">
            Everything you need to crack the case
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Voice-First Practice",
              body: "Present your framework out loud, exactly like the real interview. Speak naturally — no typing required.",
            },
            {
              title: "AI-Powered Scoring",
              body: "Every framework scored across 7 dimensions: MECE, Case Fit, Hypothesis, Depth, Clarifying Questions, and Delivery.",
            },
            {
              title: "Realistic Consulting Cases",
              body: "Cases across profitability, market entry, M&A, pricing, and operations — built to match the structure of McKinsey and BCG interviews.",
            },
            {
              title: "Interactive Clarifying Q&A",
              body: "Ask clarifying questions before presenting. Get realistic interviewer responses, and get scored on what you asked.",
            },
            {
              title: "Progress Tracking",
              body: "Every session saved to your dashboard. Track average scores, best performance, and improvement over time.",
            },
            {
              title: "5 Specific Suggestions",
              body: "Not vague advice — numbered, case-specific improvements with detail on exactly what to do differently next time.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border-l-2 border-[#00A651] bg-[#F1F1F1] p-5"
            >
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-black">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500">{f.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Who it's for ──────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#F1F1F1] p-6 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Built For
        </p>
        <h2 className="mt-2 text-2xl font-bold text-black">
          MBAs, undergrads, and career switchers targeting top firms
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500">
          CaseCoach gives you the structured feedback that prep books and case partners
          can&apos;t — available 24/7, on your schedule, without judgment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["McKinsey", "BCG", "Bain", "Deloitte", "Oliver Wyman", "Accenture Strategy"].map(
            (firm) => (
              <span
                key={firm}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black"
              >
                {firm}
              </span>
            )
          )}
        </div>
      </div>

      {/* ── Email Capture ─────────────────────────────────────────────────── */}
      <div ref={formRef} className="flex flex-col items-center gap-6 py-12 text-center">
        {!submitted ? (
          <>
            <span className="inline-flex items-center rounded-full border border-[#00A651]/30 bg-green-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#00A651]">
              Early Access
            </span>
            <h2 className="text-3xl font-bold text-black sm:text-4xl">Join the waitlist</h2>
            <p className="max-w-md text-base text-gray-500">
              We&apos;re opening access in small batches. The first 10 people get free
              access for life — drop your email to get in line.
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-md flex-col gap-4 sm:flex-row sm:gap-3"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 border-0 border-b-2 border-gray-200 bg-transparent px-0 py-3 text-sm text-black outline-none transition-colors focus:border-[#00A651] placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#00A651] px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44] disabled:opacity-50"
              >
                {loading ? "..." : "Request Access"}
              </button>
            </form>
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <svg
                className="h-7 w-7 text-[#00A651]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-black">You&apos;re on the list!</h3>
            {position !== null && (
              <p className="text-gray-500">
                You&apos;re{" "}
                <strong className="text-black">#{position}</strong> in line.{" "}
                {position <= 10 ? (
                  <span className="font-semibold text-[#00A651]">
                    You&apos;re in the first 10 — you&apos;ll get free access for life.
                  </span>
                ) : (
                  "We'll email you when access opens."
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
