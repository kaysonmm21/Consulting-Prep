"use client";

import { useState, useEffect, useRef } from "react";

interface StopwatchProps {
  onComplete: (elapsedSeconds: number) => void;
}

export default function Stopwatch({ onComplete }: StopwatchProps) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const overTime = seconds >= 120;

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <p className="text-lg text-[#6B7280]">
        Build your framework on paper. Take your time.
      </p>

      <div
        className={`font-mono text-7xl font-bold tabular-nums transition-colors ${
          overTime ? "text-amber-500" : "text-[#1B2A4A]"
        } ${overTime ? "animate-pulse" : ""}`}
      >
        {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>

      {overTime && (
        <p className="text-sm text-amber-500">Recommended time reached</p>
      )}

      <button
        onClick={() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete(seconds);
        }}
        className="rounded-lg bg-[#00A651] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#008C44]"
      >
        I&apos;m Ready to Present
      </button>
    </div>
  );
}
