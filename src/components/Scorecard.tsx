"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { EvaluationScores, EvaluationFeedback } from "@/lib/types";

interface ScorecardProps {
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
  frameworkTime: number;
  presentationTime: number;
  transcript: string;
  casePrompt?: string;
  previousScores?: EvaluationScores;
  onPracticeAgain: () => void;
  onRetryWithFeedback?: () => void;
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

function ScoreBar({
  label,
  score,
  comment,
  onClick,
  active,
  previousScore,
}: {
  label: string;
  score: number;
  comment: string;
  onClick?: () => void;
  active?: boolean;
  previousScore?: number;
}) {
  const color = scoreColor(score);
  const delta = previousScore !== undefined ? score - previousScore : null;
  return (
    <div
      className={`rounded-lg p-4 transition-colors ${
        onClick
          ? `cursor-pointer ${active ? "bg-[#E8F5EE] ring-1 ring-[#00A651]/40" : "bg-[#F1F1F1] hover:bg-[#E8E8E8]"}`
          : "bg-[#F1F1F1]"
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-black">{label}</span>
        <div className="flex items-center gap-2">
          {onClick && (
            <span className="text-xs font-medium text-[#00A651]">
              {active ? "▲ Hide" : "Practice →"}
            </span>
          )}
          {delta !== null && (
            <span
              className={`text-xs font-bold ${
                delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-500" : "text-gray-400"
              }`}
            >
              {delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta}
            </span>
          )}
          <span className="text-sm font-bold" style={{ color }}>{score}/5</span>
        </div>
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

type DrillPhase = "idle" | "recording" | "transcribing" | "scored" | "error";

function HypothesisDrillPanel({
  casePrompt,
  onClose,
}: {
  casePrompt: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<DrillPhase>("idle");
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(new Array(16).fill(5));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mimeTypeRef = useRef<string>("audio/webm");

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      function updateLevels() {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const bars = Array.from({ length: 16 }, (_, i) => {
          const idx = Math.floor((i / 16) * dataArray.length);
          return Math.max(4, (dataArray[idx] / 255) * 100);
        });
        setLevels(bars);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      }
      updateLevels();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        await transcribeAndScore(blob);
      };

      recorder.start(1000);
      setPhase("recording");
      setSeconds(0);

      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
      setPhase("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setPhase("transcribing");
  };

  const transcribeAndScore = async (blob: Blob) => {
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!tRes.ok) throw new Error("Transcription failed");
      const { transcript } = await tRes.json();

      const eRes = await fetch("/api/evaluate-hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ casePrompt, hypothesisTranscript: transcript }),
      });
      if (!eRes.ok) throw new Error("Evaluation failed");
      const result = await eRes.json();

      setScore(result.score);
      setComment(result.comment);
      setSuggestions(result.suggestions || []);
      setPhase("scored");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="mt-3 rounded-lg border border-[#00A651]/30 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#00A651]">
          Hypothesis Drill
        </p>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-black"
          aria-label="Close drill"
        >
          ✕ Close
        </button>
      </div>

      {phase === "idle" && (
        <>
          <p className="mb-1 text-sm font-semibold text-black">
            What is your hypothesis and where would you want to start?
          </p>
          <p className="mb-4 text-xs leading-relaxed text-gray-500">
            State where you think the answer lies and which bucket you&apos;d prioritize first —
            speak it out loud as if you&apos;re addressing the interviewer.
          </p>
          <button
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
          >
            Start Recording
            <span aria-hidden="true">&rarr;</span>
          </button>
        </>
      )}

      {phase === "recording" && (
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm font-semibold text-black">
            What is your hypothesis and where would you want to start?
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00A651] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00A651]" />
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-black">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
          </div>
          <div className="flex h-10 items-end gap-[2px]">
            {levels.map((level, i) => (
              <div
                key={i}
                className="w-1.5 rounded-t bg-[#00A651] transition-all duration-100"
                style={{ height: `${level}%` }}
              />
            ))}
          </div>
          <button
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
          >
            Done
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      )}

      {phase === "transcribing" && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#00A651]" />
          <p className="text-sm text-gray-500">Scoring your hypothesis...</p>
        </div>
      )}

      {phase === "scored" && score !== null && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-black">Retry Score</p>
            <span className="text-sm font-bold" style={{ color: scoreColor(score) }}>
              {score}/5
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(score / 5) * 100}%`, backgroundColor: scoreColor(score) }}
            />
          </div>
          <p className="text-xs leading-relaxed text-gray-600">{comment}</p>
          {suggestions.length > 0 && (
            <div className="mt-1 space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex gap-2 rounded-lg bg-[#F1F1F1] p-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00A651] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-xs leading-relaxed text-black">{s}</p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setPhase("idle");
              setSeconds(0);
              setScore(null);
              setComment("");
              setSuggestions([]);
            }}
            className="mt-1 text-left text-xs font-semibold text-[#00A651] hover:underline"
          >
            Try again →
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setPhase("idle")}
            className="mt-2 text-xs font-semibold text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ index, suggestion }: { index: number; suggestion: { title: string; detail: string } | string }) {
  const [expanded, setExpanded] = useState(false);

  // Handle both old string[] format and new {title, detail} format
  const isStructured = typeof suggestion === "object" && suggestion !== null;
  const title = isStructured ? suggestion.title : suggestion;
  const detail = isStructured ? suggestion.detail : null;

  return (
    <button
      onClick={() => detail && setExpanded(!expanded)}
      className={`w-full text-left rounded-lg bg-white p-4 transition-all ${detail ? "cursor-pointer hover:bg-gray-50" : ""}`}
    >
      <div className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00A651] text-xs font-bold text-white">
          {index + 1}
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black">{title}</p>
            {detail && (
              <span className="ml-2 shrink-0 text-xs text-gray-400">
                {expanded ? "▲" : "▼"}
              </span>
            )}
          </div>
          {expanded && detail && (
            <p className="mt-2 text-xs leading-relaxed text-gray-500">{detail}</p>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Scorecard({
  scores,
  feedback,
  frameworkTime,
  presentationTime,
  transcript,
  casePrompt,
  previousScores,
  onPracticeAgain,
  onRetryWithFeedback,
}: ScorecardProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [drillOpen, setDrillOpen] = useState(false);

  const hypothesisClickable =
    scores.hypothesisAndPrioritization <= 3 && !!casePrompt;

  const overallDelta =
    previousScores !== undefined
      ? Math.round((scores.overall - previousScores.overall) * 10) / 10
      : null;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Overall score header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Overall Score</p>
          <div className="mt-1 flex items-end gap-3">
            <span className="text-5xl font-bold text-black">{Math.round(scores.overall * 20)}</span>
            <span className="mb-1 text-lg text-gray-400">/100</span>
            {overallDelta !== null && (
              <span
                className={`mb-1 rounded-full px-2.5 py-0.5 text-sm font-bold ${
                  overallDelta > 0
                    ? "bg-emerald-50 text-emerald-600"
                    : overallDelta < 0
                    ? "bg-red-50 text-red-500"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {overallDelta > 0 ? `+${Math.round(overallDelta * 20)}` : overallDelta === 0 ? "No change" : Math.round(overallDelta * 20)} from last attempt
              </span>
            )}
          </div>
        </div>
        {onRetryWithFeedback && (
          <button
            onClick={onRetryWithFeedback}
            className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
          >
            Retry with Feedback
            <span aria-hidden="true">&rarr;</span>
          </button>
        )}
      </div>

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

      {/* Suggestions — moved ABOVE score breakdown */}
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <div className="rounded-lg bg-[#F1F1F1] p-6">
          <h3 className="mb-4 text-2xl font-bold text-black">How to Improve Your Framework</h3>
          <div className="space-y-2">
            {feedback.suggestions.map((suggestion, i) => (
              <SuggestionCard key={i} index={i} suggestion={suggestion} />
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-black">Score Breakdown</h3>
          {overallDelta !== null && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                overallDelta > 0
                  ? "bg-emerald-50 text-emerald-600"
                  : overallDelta < 0
                  ? "bg-red-50 text-red-500"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {overallDelta > 0 ? `+${overallDelta}` : overallDelta === 0 ? "No change" : overallDelta} overall
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ScoreBar label="MECE" score={scores.mece} comment={feedback.meceComment} previousScore={previousScores?.mece} />
          <ScoreBar label="Case Fit" score={scores.caseFit} comment={feedback.caseFitComment} previousScore={previousScores?.caseFit} />
          <div className="sm:col-span-2">
            <ScoreBar
              label="Hypothesis & Prioritization"
              score={scores.hypothesisAndPrioritization}
              comment={feedback.hypothesisAndPrioritizationComment}
              onClick={hypothesisClickable ? () => setDrillOpen((o) => !o) : undefined}
              active={drillOpen}
              previousScore={previousScores?.hypothesisAndPrioritization}
            />
            {drillOpen && casePrompt && (
              <HypothesisDrillPanel
                casePrompt={casePrompt}
                onClose={() => setDrillOpen(false)}
              />
            )}
          </div>
          <ScoreBar label="Depth" score={scores.depth} comment={feedback.depthComment} previousScore={previousScores?.depth} />
          <ScoreBar label="Clarifying Questions" score={scores.clarifyingQuestions} comment={feedback.clarifyingQuestionsComment} previousScore={previousScores?.clarifyingQuestions} />
          <ScoreBar label="Delivery" score={scores.delivery} comment={feedback.deliveryComment} previousScore={previousScores?.delivery} />
        </div>
      </div>

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
      <div className="flex flex-wrap gap-3">
        {onRetryWithFeedback && (
          <button
            onClick={onRetryWithFeedback}
            className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
          >
            Retry with Feedback
            <span aria-hidden="true">&rarr;</span>
          </button>
        )}
        <button
          onClick={onPracticeAgain}
          className="inline-flex items-center gap-2 rounded-full border-2 border-black px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
        >
          New Case
        </button>
        <Link
          href="/dashboard"
          className="rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500 transition-colors hover:text-black"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
