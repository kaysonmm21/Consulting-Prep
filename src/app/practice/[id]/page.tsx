"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { cases } from "@/lib/cases";
import { saveSession } from "@/lib/storage";
import { EvaluationScores, EvaluationFeedback } from "@/lib/types";
import Stopwatch from "@/components/Stopwatch";
import AudioRecorder from "@/components/AudioRecorder";
import Scorecard from "@/components/Scorecard";

type Phase = "listening" | "clarifying" | "building" | "presenting" | "processing" | "results";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const caseData = cases.find((c) => c.id === id);

  const [phase, setPhase] = useState<Phase>("listening");
  const showedTranscript = true; // prompt is always visible on the case slide
  const [frameworkTime, setFrameworkTime] = useState(0);
  const [presentationTime, setPresentationTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [scores, setScores] = useState<EvaluationScores | null>(null);
  const [feedback, setFeedback] = useState<EvaluationFeedback | null>(null);
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set());
  const [processingError, setProcessingError] = useState("");

  if (!caseData) {
    return (
      <div className="py-12 text-center">
        <p className="text-[#6B7280]">Case not found.</p>
      </div>
    );
  }

  const handleTranscribeAndEvaluate = async (text: string, duration: number) => {
    setPresentationTime(duration);
    setPhase("processing");
    setProcessingError("");
    setTranscript(text);

    try {
      // Evaluate (transcription already done by browser Speech Recognition)
      const evaluateRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casePrompt: caseData.prompt,
          transcript: text,
          frameworkTime,
          presentationTime: duration,
          showedTranscript,
          clarifyingQuestionsViewed: Array.from(revealedQuestions).map(
            (i) => caseData.clarifyingQuestions[i].question
          ),
          totalClarifyingQuestions: caseData.clarifyingQuestions.length,
        }),
      });
      if (!evaluateRes.ok) {
        const errData = await evaluateRes.json().catch(() => null);
        throw new Error(errData?.error || "Evaluation failed");
      }
      const result = await evaluateRes.json();

      setScores(result.scores);
      setFeedback(result.feedback);

      // Save session
      await saveSession({
        id: crypto.randomUUID(),
        caseId: caseData.id,
        date: new Date().toISOString(),
        transcript: text,
        frameworkTime,
        presentationTime: duration,
        scores: result.scores,
        feedback: result.feedback,
        showedTranscript,
      });

      setPhase("results");
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div>
      {/* Phase: Reading the Case */}
      {phase === "listening" && (
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-10">
          {/* Case Slide Card */}
          <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#1B2A4A] via-[#2D4A7A] to-[#00A651]" />

            {/* Instruction banner */}
            <div className="border-b border-gray-100 bg-gray-50/60 px-8 py-3 text-center">
              <p className="text-sm font-medium tracking-wide text-[#6B7280]">
                Read carefully and take notes
              </p>
            </div>

            {/* Header section */}
            <div className="px-8 pt-8 pb-5">
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl font-bold leading-tight text-[#1B2A4A]">
                  {caseData.title}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-[#1B2A4A]/15 bg-[#1B2A4A]/5 px-3 py-1 text-xs font-semibold tracking-wide text-[#1B2A4A]">
                    {caseData.category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                      caseData.difficulty === "advanced"
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : caseData.difficulty === "intermediate"
                        ? "border border-amber-200 bg-amber-50 text-amber-700"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {caseData.difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-8">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>

            {/* Case prompt body */}
            <div className="px-8 py-8">
              <p className="text-base leading-relaxed text-[#1B2A4A]/85" style={{ lineHeight: "1.8" }}>
                {caseData.prompt}
              </p>
            </div>

            {/* Bottom section with button */}
            <div className="border-t border-gray-100 bg-gray-50/40 px-8 py-6 text-center">
              <button
                onClick={() => setPhase("clarifying")}
                className="rounded-lg bg-[#00A651] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#008C44] hover:shadow-md"
              >
                I&apos;ve Read the Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase: Clarifying Questions */}
      {phase === "clarifying" && (
        <div className="flex flex-col gap-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1B2A4A]">Clarifying Questions</h2>
            <p className="text-[#6B7280]">Click to reveal answers — just like asking an interviewer</p>
          </div>

          <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
            {caseData.clarifyingQuestions.map((q, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-white shadow-sm">
                <button
                  onClick={() => {
                    const next = new Set(revealedQuestions);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    setRevealedQuestions(next);
                  }}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-[#1B2A4A]">{q.question}</span>
                  <span className="text-[#6B7280]">{revealedQuestions.has(i) ? "▼" : "▶"}</span>
                </button>
                {revealedQuestions.has(i) && (
                  <div className="border-t border-gray-50 px-4 pb-4 pt-2">
                    <p className="text-sm text-[#6B7280]">{q.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setPhase("building")}
              className="rounded-lg bg-[#00A651] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#008C44]"
            >
              Start Building My Framework
            </button>
          </div>
        </div>
      )}

      {/* Phase: Building */}
      {phase === "building" && (
        <Stopwatch
          onComplete={(elapsed) => {
            setFrameworkTime(elapsed);
            setPhase("presenting");
          }}
        />
      )}

      {/* Phase: Presenting */}
      {phase === "presenting" && (
        <AudioRecorder onComplete={handleTranscribeAndEvaluate} />
      )}

      {/* Phase: Processing */}
      {phase === "processing" && (
        <div className="flex flex-col items-center gap-6 py-20">
          {processingError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="mb-4 text-red-700">{processingError}</p>
              <button
                onClick={() => setPhase("presenting")}
                className="rounded-lg bg-[#00A651] px-4 py-2 text-sm font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#00A651]" />
              <p className="text-lg font-semibold text-[#1B2A4A]">Analyzing your framework...</p>
              <p className="text-sm text-[#6B7280]">Transcribing audio and evaluating your performance</p>
            </>
          )}
        </div>
      )}

      {/* Phase: Results */}
      {phase === "results" && scores && feedback && (
        <Scorecard
          scores={scores}
          feedback={feedback}
          frameworkTime={frameworkTime}
          presentationTime={presentationTime}
          transcript={transcript}
          onPracticeAgain={() => router.push("/practice")}
        />
      )}
    </div>
  );
}
