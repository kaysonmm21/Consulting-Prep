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
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1B2A4A]">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{score}/5</span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / 5) * 100}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs leading-relaxed text-[#6B7280]">{comment}</p>
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
      {/* Overall Score */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={scoreColor(scores.overall)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(scores.overall / 5) * 327} 327`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="text-center">
            <span className="text-3xl font-bold text-[#1B2A4A]">{scores.overall}</span>
            <span className="text-sm text-[#6B7280]">/5</span>
          </div>
        </div>
        <p className="max-w-lg text-center text-[#6B7280]">{feedback.summary}</p>
      </div>

      {/* Strength & Improvement */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-green-700">Top Strength</p>
          <p className="text-sm text-green-900">{feedback.topStrength}</p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase text-amber-700">Top Improvement</p>
          <p className="text-sm text-amber-900">{feedback.topImprovement}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Score Breakdown</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ScoreBar label="MECE" score={scores.mece} comment={feedback.meceComment} />
          <ScoreBar label="Case Fit" score={scores.caseFit} comment={feedback.caseFitComment} />
          <ScoreBar label="Prioritization" score={scores.prioritization} comment={feedback.prioritizationComment} />
          <ScoreBar label="Depth" score={scores.depth} comment={feedback.depthComment} />
          <ScoreBar label="Hypothesis" score={scores.hypothesis} comment={feedback.hypothesisComment} />
          <ScoreBar label="Clarifying Questions" score={scores.clarifyingQuestions} comment={feedback.clarifyingQuestionsComment} />
          <ScoreBar label="Delivery" score={scores.delivery} comment={feedback.deliveryComment} />
          <ScoreBar label="Filler Words" score={scores.fillerWords} comment={`${feedback.fillerWordsComment} (Found ${feedback.fillerWordCount}: ${feedback.fillerWordList.slice(0, 5).join(", ")})`} />
        </div>
      </div>

      {/* Suggested Framework */}
      <div className="rounded-lg border border-[#1B2A4A]/10 bg-[#1B2A4A]/5 p-6">
        <h3 className="mb-4 text-lg font-bold text-[#1B2A4A]">Suggested Stronger Framework</h3>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {feedback.suggestedFramework.buckets.map((bucket) => (
            <div key={bucket.name} className="rounded-lg bg-white p-4 shadow-sm">
              <h4 className="mb-2 text-sm font-bold text-[#1B2A4A]">{bucket.name}</h4>
              <ul className="space-y-1">
                {bucket.subPoints.map((point) => (
                  <li key={point} className="text-xs text-[#6B7280]">• {point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-sm text-[#6B7280]">{feedback.suggestedFramework.explanation}</p>
      </div>

      {/* Transcript */}
      <div>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1B2A4A]"
        >
          <span>{showTranscript ? "▼" : "▶"}</span>
          Your Transcript
        </button>
        {showTranscript && (
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="whitespace-pre-wrap font-mono text-sm text-[#6B7280]">{transcript}</p>
          </div>
        )}
      </div>

      {/* Session Stats */}
      <div className="flex gap-6 text-sm text-[#6B7280]">
        <span>Framework time: <strong>{formatTime(frameworkTime)}</strong></span>
        <span>Presentation time: <strong>{formatTime(presentationTime)}</strong></span>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onPracticeAgain}
          className="rounded-lg bg-[#00A651] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#008C44]"
        >
          Practice Another Case
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[#1B2A4A] px-6 py-3 font-semibold text-[#1B2A4A] transition-colors hover:bg-[#1B2A4A]/5"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
