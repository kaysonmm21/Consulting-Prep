"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessions, getStats } from "@/lib/storage";
import { cases } from "@/lib/cases";
import { SessionResult } from "@/lib/types";

function scoreColor(score: number) {
  if (score <= 40) return "text-red-500";
  if (score <= 60) return "text-amber-500";
  if (score <= 80) return "text-green-500";
  return "text-green-600";
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [stats, setStats] = useState({ totalSessions: 0, avgScore: 0, bestScore: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [s, st] = await Promise.all([getSessions(), getStats()]);
      setSessions(s);
      setStats(st);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-12">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <h1 className="text-5xl font-bold leading-tight text-black sm:text-6xl">
          Master the Art of<br />Case Frameworks
        </h1>
        <p className="max-w-lg text-lg font-normal text-gray-500">
          Practice with real consulting cases. Present your framework. Get instant AI-powered feedback.
        </p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 rounded-full bg-[#00A651] px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#008C44]"
        >
          Start Practicing
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#00A651]" />
        </div>
      )}

      {/* Stats */}
      {!loading && stats.totalSessions > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Sessions", value: stats.totalSessions },
            { label: "Average Score", value: `${stats.avgScore}/100` },
            { label: "Best Score", value: `${stats.bestScore}/100` },
            { label: "Day Streak", value: stats.streak },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-[#F1F1F1] p-5 text-center">
              <p className="text-2xl font-bold text-black">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Sessions */}
      {!loading && sessions.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-black">Recent Sessions</h2>
          <div className="flex flex-col gap-3">
            {sessions.slice(0, 5).map((session) => {
              const caseData = cases.find((c) => c.id === session.caseId);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg bg-[#F1F1F1] p-4"
                >
                  <div>
                    <p className="font-semibold text-black">{caseData?.title || session.caseId}</p>
                    <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-lg font-bold ${scoreColor(Math.round(session.scores.overall * 20))}`}>
                    {Math.round(session.scores.overall * 20)}/100
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-black">Quick Tips</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: "Start Top-Down", body: "State your buckets upfront before diving into details. Signpost: \"I'd break this into three areas...\"" },
            { title: "Tailor Your Framework", body: "Avoid memorized structures. Build each framework specifically for the case prompt you're given." },
            { title: "Prioritize", body: "Tell the interviewer which bucket you'd explore first and why. This shows business judgment." },
          ].map((tip) => (
            <div key={tip.title} className="rounded-lg bg-[#F1F1F1] p-5">
              <h3 className="mb-2 text-sm font-bold text-black">{tip.title}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
