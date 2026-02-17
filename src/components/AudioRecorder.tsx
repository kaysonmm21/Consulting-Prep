"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AudioRecorderProps {
  onComplete: (transcript: string, durationSeconds: number) => void;
}

export default function AudioRecorder({ onComplete }: AudioRecorderProps) {
  const [status, setStatus] = useState<"requesting" | "recording" | "transcribing" | "error">("requesting");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [levels, setLevels] = useState<number[]>(new Array(24).fill(5));
  const [transcribeProgress, setTranscribeProgress] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const secondsRef = useRef(0);

  const MAX_DURATION = 300;
  const WARNING_DURATION = 240;

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setStatus("transcribing");
    setTranscribeProgress("Transcribing your presentation...");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Transcription failed");
      }

      const data = await res.json();
      onComplete(data.transcript.trim(), secondsRef.current);
    } catch (err) {
      console.error("Transcription error:", err);
      setStatus("error");
      setError(`Transcription failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [onComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        // Audio visualization
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
          const bars = Array.from({ length: 24 }, (_, i) => {
            const idx = Math.floor((i / 24) * dataArray.length);
            return Math.max(4, (dataArray[idx] / 255) * 100);
          });
          setLevels(bars);
          animFrameRef.current = requestAnimationFrame(updateLevels);
        }
        updateLevels();

        // MediaRecorder — capture audio for Whisper transcription
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          transcribeAudio(blob);
        };

        recorder.start(1000);
        setStatus("recording");

        intervalRef.current = setInterval(() => {
          secondsRef.current += 1;
          setSeconds((s) => {
            const next = s + 1;
            if (next >= MAX_DURATION) {
              stopRecording();
            }
            return next;
          });
        }, 1000);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Microphone access denied. Please allow microphone access and try again.");
        }
      }
    }

    startRecording();
    return () => {
      cancelled = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (status === "requesting") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-gray-500">Requesting microphone access...</p>
      </div>
    );
  }

  if (status === "transcribing") {
    return (
      <div className="flex flex-col items-center gap-6 py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#00A651]" />
        <p className="text-lg font-bold text-black">Processing your audio...</p>
        <p className="text-sm text-gray-500">{transcribeProgress}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <h2 className="text-3xl font-bold text-black">Present Your Framework</h2>
      <p className="text-gray-500">Walk through your framework as if you&apos;re speaking to an interviewer</p>

      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00A651] opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[#00A651]" />
        </span>
        <span className="font-mono text-lg font-semibold text-black tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>

      {/* Waveform */}
      <div className="flex h-16 items-end gap-[2px]">
        {levels.map((level, i) => (
          <div
            key={i}
            className="w-2 rounded-t bg-[#00A651] transition-all duration-100"
            style={{ height: `${level}%` }}
          />
        ))}
      </div>

      {seconds >= WARNING_DURATION && seconds < MAX_DURATION && (
        <p className="text-sm text-amber-500">Approaching maximum recording time</p>
      )}

      <button
        onClick={() => stopRecording()}
        className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
      >
        I&apos;m Done
        <span aria-hidden="true">&rarr;</span>
      </button>
    </div>
  );
}
