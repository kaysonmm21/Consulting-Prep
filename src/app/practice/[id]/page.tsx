"use client";

import { useState, use, useRef } from "react";
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
  const [clarifyingChat, setClarifyingChat] = useState<{ question: string; answer: string }[]>([]);
  const [clarifyInput, setClarifyInput] = useState("");
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [processingError, setProcessingError] = useState("");
  const MAX_CLARIFYING_QUESTIONS = 5;
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  if (!caseData) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Case not found.</p>
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
          clarifyingQuestionsAsked: clarifyingChat,
          totalClarifyingQuestions: MAX_CLARIFYING_QUESTIONS,
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
          <div className="w-full overflow-hidden rounded-2xl bg-[#F1F1F1]">
            {/* Top accent bar */}
            <div className="h-1.5 bg-[#00A651]" />

            {/* Instruction banner */}
            <div className="bg-[#E8E8E8] px-8 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Read carefully and take notes
              </p>
            </div>

            {/* Header section */}
            <div className="px-8 pt-8 pb-5">
              <div className="flex flex-col gap-3">
                <h2 className="text-3xl font-bold leading-tight text-black">
                  {caseData.title}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
                    {caseData.category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      caseData.difficulty === "advanced"
                        ? "bg-red-50 text-red-700"
                        : caseData.difficulty === "intermediate"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {caseData.difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* Case prompt body */}
            <div className="px-8 py-8">
              <p className="text-base leading-relaxed text-black/80" style={{ lineHeight: "1.8" }}>
                {caseData.prompt}
              </p>
            </div>

            {/* Bottom section with button */}
            <div className="bg-[#E8E8E8] px-8 py-6 text-center">
              <button
                onClick={() => setPhase("clarifying")}
                className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:bg-[#008C44]"
              >
                I&apos;ve Read the Case
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase: Clarifying Questions — Interactive Chat */}
      {phase === "clarifying" && (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
          <div className="text-center">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Clarifying Questions
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Ask questions just like you would in a real interview
            </p>
          </div>

          {/* Chat messages */}
          <div className="flex min-h-[300px] flex-col gap-3 overflow-y-auto rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            {clarifyingChat.length === 0 && (
              <p className="my-auto text-center text-sm text-gray-300">
                Tap the mic or type a question to get started
              </p>
            )}
            {clarifyingChat.map((msg, i) => (
              <div key={i} className="flex flex-col gap-2">
                {/* Student question — right aligned */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl bg-[#00A651] px-4 py-2 text-sm text-white">
                    {msg.question}
                  </div>
                </div>
                {/* Interviewer answer — left aligned */}
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl bg-[#F1F1F1] px-4 py-2 text-sm text-black">
                    {msg.answer}
                  </div>
                </div>
              </div>
            ))}
            {clarifyLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-[#F1F1F1] px-4 py-2 text-sm text-gray-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>.</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Questions remaining counter */}
          <p className="text-center text-xs text-gray-400">
            {MAX_CLARIFYING_QUESTIONS - clarifyingChat.length}/{MAX_CLARIFYING_QUESTIONS} questions remaining
          </p>

          {/* Input bar */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!clarifyInput.trim() || clarifyLoading || clarifyingChat.length >= MAX_CLARIFYING_QUESTIONS) return;

              const question = clarifyInput.trim();
              setClarifyInput("");
              setClarifyLoading(true);

              try {
                const res = await fetch("/api/clarify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    casePrompt: caseData.prompt,
                    caseId: caseData.id,
                    question,
                    previousQuestions: clarifyingChat,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to get response");
                setClarifyingChat((prev) => [...prev, { question, answer: data.answer }]);
              } catch (err) {
                setClarifyingChat((prev) => [
                  ...prev,
                  { question, answer: err instanceof Error ? err.message : "Something went wrong — please try again." },
                ]);
              } finally {
                setClarifyLoading(false);
              }
            }}
            className="flex items-center gap-2"
          >
            {/* Mic button */}
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  recognitionRef.current?.stop();
                  setIsListening(false);
                  return;
                }
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (!SpeechRecognition) {
                  alert("Speech recognition is not supported in this browser. Please use Chrome.");
                  return;
                }
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onresult = (event: any) => {
                  let finalTranscript = "";
                  let interimTranscript = "";
                  for (let i = 0; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                    } else {
                      interimTranscript += event.results[i][0].transcript;
                    }
                  }
                  setClarifyInput(finalTranscript + interimTranscript);
                };

                recognition.onend = () => {
                  setIsListening(false);
                };

                recognition.onerror = () => {
                  setIsListening(false);
                };

                recognition.start();
                setIsListening(true);
              }}
              disabled={clarifyLoading || clarifyingChat.length >= MAX_CLARIFYING_QUESTIONS}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-[#F1F1F1] text-gray-600 hover:bg-[#E8E8E8]"
              } disabled:bg-gray-200 disabled:text-gray-400`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            </button>
            <input
              type="text"
              value={clarifyInput}
              onChange={(e) => setClarifyInput(e.target.value)}
              placeholder={
                clarifyingChat.length >= MAX_CLARIFYING_QUESTIONS
                  ? "You've used all your questions"
                  : isListening
                  ? "Listening..."
                  : "Tap mic or type a question..."
              }
              disabled={clarifyLoading || clarifyingChat.length >= MAX_CLARIFYING_QUESTIONS}
              className={`flex-1 rounded-full border px-5 py-3 text-sm text-black placeholder-gray-400 outline-none transition-colors focus:border-[#00A651] disabled:bg-gray-50 disabled:text-gray-400 ${
                isListening ? "border-red-300 bg-red-50/30" : "border-gray-200"
              }`}
            />
            <button
              type="submit"
              disabled={clarifyLoading || !clarifyInput.trim() || clarifyingChat.length >= MAX_CLARIFYING_QUESTIONS}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00A651] text-white transition-colors hover:bg-[#008C44] disabled:bg-gray-300"
              aria-label="Send question"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </form>

          {/* Start building button */}
          <div className="text-center">
            <button
              onClick={() => setPhase("building")}
              className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
            >
              Start Building My Framework
              <span aria-hidden="true">&rarr;</span>
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
            <div className="rounded-lg bg-red-50 p-6 text-center">
              <p className="mb-4 text-red-700">{processingError}</p>
              <button
                onClick={() => setPhase("presenting")}
                className="rounded-full bg-[#00A651] px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#00A651]" />
              <p className="text-lg font-bold text-black">Analyzing your framework...</p>
              <p className="text-sm text-gray-500">Transcribing audio and evaluating your performance</p>
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
          casePrompt={caseData.prompt}
          onPracticeAgain={() => router.push("/practice")}
        />
      )}
    </div>
  );
}
