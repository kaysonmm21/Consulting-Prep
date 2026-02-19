"use client";

import { useState } from "react";
import Link from "next/link";
import { cases } from "@/lib/cases";
import { CasePrompt } from "@/lib/types";

type Phase = "input" | "loading" | "results";

interface QuestionEvaluation {
  question: string;
  rating: "strong" | "weak" | "redundant";
  feedback: string;
}

interface CoachResult {
  evaluations: QuestionEvaluation[];
  topQuestions: string[];
  coachNote: string;
}

const categoryLabels: Record<string, string> = {
  profitability: "Profitability",
  "market-entry": "Market Entry",
  ma: "M&A",
  pricing: "Pricing",
  operations: "Operations",
};

const categoryColors: Record<string, string> = {
  profitability: "bg-blue-100 text-blue-700",
  "market-entry": "bg-purple-100 text-purple-700",
  ma: "bg-indigo-100 text-indigo-700",
  pricing: "bg-cyan-100 text-cyan-700",
  operations: "bg-orange-100 text-orange-700",
};

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

const ratingStyles: Record<string, { bg: string; badge: string; badgeText: string }> = {
  strong: {
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-700",
    badgeText: "Strong",
  },
  weak: {
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    badgeText: "Weak",
  },
  redundant: {
    bg: "bg-gray-100",
    badge: "bg-gray-200 text-gray-600",
    badgeText: "Redundant",
  },
};

function NumberedCircle({ n }: { n: number }) {
  return (
    <span className="rounded-full bg-[#00A651] text-white text-xs font-bold flex h-6 w-6 items-center justify-center shrink-0">
      {n}
    </span>
  );
}

export default function ClarifyingQuestionsCoachPage() {
  const [selectedCase, setSelectedCase] = useState<CasePrompt>(cases[0]);
  const [questions, setQuestions] = useState<string[]>(["", "", ""]);
  const [phase, setPhase] = useState<Phase>("input");
  const [result, setResult] = useState<CoachResult | null>(null);
  const [error, setError] = useState<string>("");
  const [showGuide, setShowGuide] = useState(true);

  function updateQuestion(index: number, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addQuestion() {
    if (questions.length < 5) {
      setQuestions((prev) => [...prev, ""]);
    }
  }

  function selectCase(c: CasePrompt) {
    setSelectedCase(c);
    setPhase("input");
    setResult(null);
    setError("");
  }

  const hasAnyQuestion = questions.some((q) => q.trim().length > 0);

  async function handleSubmit() {
    setError("");
    setPhase("loading");

    try {
      const res = await fetch("/api/coach-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casePrompt: selectedCase.prompt,
          caseTitle: selectedCase.title,
          caseCategory: selectedCase.category,
          userQuestions: questions.filter((q) => q.trim().length > 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong — please try again.");
        setPhase("input");
        return;
      }

      setResult(data as CoachResult);
      setPhase("results");
    } catch {
      setError("Network error — please check your connection and try again.");
      setPhase("input");
    }
  }

  function handleTryAgain() {
    setPhase("input");
    setResult(null);
    setError("");
    setQuestions(["", "", ""]);
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          Clarifying Questions
        </p>
        <h2 className="text-3xl font-bold text-black">Practice Your Questions</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-2xl">
          Before building your framework, great candidates ask 3–5 targeted questions. They&apos;re not just collecting info — they&apos;re signaling business judgment. Practice here.
        </p>
        <Link
          href="/learn"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
        >
          <span>&#8592;</span> Back to Learn
        </Link>
      </div>

      {/* Case Picker */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Select a Case
        </p>
        <div className="flex gap-2 flex-wrap">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCase(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border-2 transition-all ${
                selectedCase.id === c.id
                  ? "border-[#00A651] bg-[#00A651] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-black"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Selected case prompt card */}
        <div className="mt-4 rounded-xl bg-[#F1F1F1] p-6">
          <div className="mb-3 flex gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[selectedCase.category]}`}>
              {categoryLabels[selectedCase.category]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[selectedCase.difficulty]}`}>
              {selectedCase.difficulty}
            </span>
          </div>
          <h3 className="mb-2 text-base font-bold text-black">{selectedCase.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{selectedCase.prompt}</p>
        </div>
      </div>

      {/* Reference Guide */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Guide toggle header */}
        <button
          onClick={() => setShowGuide((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00A651] text-xs font-bold text-white">
              ?
            </span>
            <span className="text-sm font-bold text-black">What Makes a Good Clarifying Question?</span>
            <span className="hidden sm:inline rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-[#00A651]">
              Read before practicing
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-400">{showGuide ? "▲ Hide" : "▼ Show"}</span>
        </button>

        {showGuide && (
          <div className="border-t border-gray-100 px-6 pb-6 pt-5 flex flex-col gap-6">

            {/* Purpose */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Solve the right problem", desc: "Confirm you understand the actual ask before building." },
                { label: "Define success correctly", desc: "Know what a good outcome looks like for the client." },
                { label: "Avoid the wrong framework", desc: "One clarification can completely change your structure." },
              ].map((p) => (
                <div key={p.label} className="rounded-lg bg-[#F1F1F1] p-4">
                  <p className="mb-1 text-xs font-bold text-black">{p.label}</p>
                  <p className="text-xs leading-relaxed text-gray-500">{p.desc}</p>
                </div>
              ))}
            </div>

            {/* The 5 high-impact categories */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                5 High-Impact Categories
              </p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    num: 1,
                    label: "Objective",
                    tag: "Most Important",
                    tagColor: "bg-[#00A651] text-white",
                    desc: "What is the primary goal — profit, revenue, market share? Is there a target level? Short-term or long-term? Growth or profitability?",
                    note: "If the objective changes, your framework changes.",
                  },
                  {
                    num: 2,
                    label: "Time Horizon",
                    tag: null,
                    tagColor: "",
                    desc: "What timeframe are we considering? Short-term → tactical levers. Long-term → strategic investments.",
                    note: null,
                  },
                  {
                    num: 3,
                    label: "Scope",
                    tag: null,
                    tagColor: "",
                    desc: "Geography? Product line or full company? Specific segment or all customers? Prevents overly broad or irrelevant frameworks.",
                    note: null,
                  },
                  {
                    num: 4,
                    label: "Constraints",
                    tag: null,
                    tagColor: "",
                    desc: "Budget? Regulatory? Capacity? Brand limitations? Adds realism and prevents impractical recommendations.",
                    note: null,
                  },
                  {
                    num: 5,
                    label: "Success Definition",
                    tag: null,
                    tagColor: "",
                    desc: "How will success be measured? Are there trade-offs — profit vs. market share? Aligns your analysis to the right metric.",
                    note: null,
                  },
                ].map((cat) => (
                  <div key={cat.num} className="flex gap-4 rounded-lg bg-[#F1F1F1] p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">
                      {cat.num}
                    </span>
                    <div className="flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-black">{cat.label}</span>
                        {cat.tag && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cat.tagColor}`}>
                            {cat.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-gray-600">{cat.desc}</p>
                      {cat.note && (
                        <p className="mt-1.5 text-xs font-semibold text-[#00A651]">{cat.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Good vs Weak + Litmus test */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-700">
                  Strong Questions
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Cover objective first",
                    "Organized in categories",
                    "Concise — 30–60 seconds total",
                    "Relevant to your structure",
                    "Show awareness of trade-offs",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-green-900">
                      <span className="mt-0.5 shrink-0 text-green-600">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                  Weak Questions
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Repeat info already in the prompt",
                    "Random and unstructured",
                    "Ask for unnecessary detail",
                    "Belong inside the framework",
                    "Wouldn't change your structure",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-red-900">
                      <span className="mt-0.5 shrink-0 text-red-500">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Litmus test */}
            <div className="rounded-lg border-l-4 border-[#00A651] bg-[#F1F1F1] p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#00A651]">
                The Litmus Test
              </p>
              <p className="text-sm italic text-gray-700">
                &ldquo;If the answer changes, would my framework change? If not — don&apos;t ask it.&rdquo;
              </p>
            </div>

            {/* Strong pattern */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Strong Opening Pattern
              </p>
              <div className="rounded-lg bg-[#F1F1F1] p-4">
                <ol className="mb-3 space-y-1 text-xs text-gray-600">
                  <li className="flex gap-2"><span className="font-bold text-black">1.</span> Rephrase the problem to confirm understanding</li>
                  <li className="flex gap-2"><span className="font-bold text-black">2.</span> State what you want to clarify (objective, timeline, scope)</li>
                  <li className="flex gap-2"><span className="font-bold text-black">3.</span> Ask your grouped questions</li>
                  <li className="flex gap-2"><span className="font-bold text-black">4.</span> Transition cleanly into building the framework</li>
                </ol>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Example</p>
                  <p className="text-xs italic text-gray-700 leading-relaxed">
                    &ldquo;Before structuring, I&apos;d like to clarify the objective, time horizon, and scope — then I&apos;ll build my framework around that.&rdquo;
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Input Phase */}
      {phase === "input" && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Your Clarifying Questions
            </p>
            <div className="flex flex-col gap-4">
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-3">
                  <NumberedCircle n={i + 1} />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    placeholder={`Question ${i + 1}…`}
                    className="flex-1 border-0 border-b-2 border-gray-200 bg-transparent px-0 py-2 text-sm text-black outline-none focus:border-[#00A651] placeholder:text-gray-400 transition-colors"
                  />
                </div>
              ))}
            </div>

            {questions.length < 5 && (
              <button
                onClick={addQuestion}
                className="mt-4 text-xs font-semibold text-[#00A651] hover:underline"
              >
                + Add another question
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div>
            <button
              onClick={handleSubmit}
              disabled={!hasAnyQuestion}
              className={`rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors ${
                hasAnyQuestion
                  ? "bg-[#00A651] hover:bg-[#008C44] cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Get Coaching →
            </button>
          </div>
        </div>
      )}

      {/* Loading Phase */}
      {phase === "loading" && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00A651] border-t-transparent" />
          <p className="text-sm text-gray-500">Coaching your questions...</p>
        </div>
      )}

      {/* Results Phase */}
      {phase === "results" && result && (
        <div className="flex flex-col gap-8">
          {/* Coach Note */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-2">
              Coach Note
            </p>
            <p className="text-sm text-amber-900 leading-relaxed">{result.coachNote}</p>
          </div>

          {/* Evaluated Questions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Your Questions Evaluated
            </p>
            <div className="flex flex-col gap-3">
              {result.evaluations.map((ev, i) => {
                const style = ratingStyles[ev.rating] ?? ratingStyles.weak;
                return (
                  <div key={i} className={`rounded-lg p-4 flex gap-3 items-start ${style.bg}`}>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${style.badge}`}>
                      {style.badgeText}
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-black">{ev.question}</p>
                      <p className="text-xs text-gray-600">{ev.feedback}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Questions */}
          <div className="rounded-xl bg-[#F1F1F1] p-6">
            <p className="text-sm font-bold text-black mb-1">Strong Questions for This Case</p>
            <p className="text-xs text-gray-500 mb-4">
              These are the questions an experienced candidate would prioritize
            </p>
            <div className="flex flex-col gap-3">
              {result.topQuestions.map((tq, i) => (
                <div key={i} className="flex gap-3 items-start rounded-lg bg-white p-4">
                  <NumberedCircle n={i + 1} />
                  <p className="text-sm text-black leading-relaxed">{tq}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Try Again */}
          <div>
            <button
              onClick={handleTryAgain}
              className="rounded-full border-2 border-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black hover:bg-black hover:text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
