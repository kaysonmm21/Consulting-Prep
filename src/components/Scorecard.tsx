"use client";

import { useState } from "react";
import Link from "next/link";
import { EvaluationScores, EvaluationFeedback } from "@/lib/types";

interface ScorecardProps {
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
  frameworkTime: number;
  presentationTime: number;
  transcript: string;
  onPracticeAgain: () => void;
}

function scoreColor(score: number) {
  if (score <= 2) return "#EF4444";
  if (score <= 3) return "#F59E0B";
  if (score <= 4) return "#10B981";
  return "#059669";
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ScoreBar({ label, score, comment }: { label: string; score: number; comment: string }) {
  const color = scoreColor(score);
  return (
    <div className="rounded-lg bg-[#F1F1F1] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-black">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{score}/5</span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / 5) * 100}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs leading-relaxed text-gray-500">{comment}</p>
    </div>
  );
}

export default function Scorecard({
  scores,
  feedback,
  frameworkTime,
  presentationTime,
  transcript,
  onPracticeAgain,
}: ScorecardProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Strength & Improvement */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-green-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">Top Strength</p>
          <p className="text-sm text-green-900">{feedback.topStrength}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Top Improvement</p>
          <p className="text-sm text-amber-900">{feedback.topImprovement}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div>
        <h3 className="mb-4 text-2xl font-bold text-black">Score Breakdown</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ScoreBar label="MECE" score={scores.mece} comment={feedback.meceComment} />
          <ScoreBar label="Case Fit" score={scores.caseFit} comment={feedback.caseFitComment} />
          <ScoreBar label="Hypothesis & Prioritization" score={scores.hypothesisAndPrioritization} comment={feedback.hypothesisAndPrioritizationComment} />
          <ScoreBar label="Depth" score={scores.depth} comment={feedback.depthComment} />
          <ScoreBar label="Clarifying Questions" score={scores.clarifyingQuestions} comment={feedback.clarifyingQuestionsComment} />
          <ScoreBar label="Delivery" score={scores.delivery} comment={feedback.deliveryComment} />
        </div>
      </div>

      {/* Suggestions */}
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <div className="rounded-lg bg-[#F1F1F1] p-6">
          <h3 className="mb-4 text-2xl font-bold text-black">How to Improve Your Framework</h3>
          <ul className="space-y-3">
            {feedback.suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-3 text-sm text-black">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00A651] text-xs font-bold text-white">{i + 1}</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transcript */}
      <div>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-black"
        >
          <span>{showTranscript ? "▼" : "▶"}</span>
          Your Transcript
        </button>
        {showTranscript && (
          <div className="rounded-lg bg-[#F1F1F1] p-4">
            <p className="whitespace-pre-wrap font-mono text-sm text-gray-500">{transcript}</p>
          </div>
        )}
      </div>

      {/* Session Stats */}
      <div className="flex gap-6 text-sm text-gray-500">
        <span>Framework time: <strong>{formatTime(frameworkTime)}</strong></span>
        <span>Presentation time: <strong>{formatTime(presentationTime)}</strong></span>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onPracticeAgain}
          className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
        >
          Practice Another Case
          <span aria-hidden="true">&rarr;</span>
        </button>
        <Link
          href="/"
          className="rounded-full border-2 border-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
