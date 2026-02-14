"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessions, getStats } from "@/lib/storage";
import { cases } from "@/lib/cases";
import { SessionResult } from "@/lib/types";

function scoreColor(score: number) {
  if (score <= 2) return "text-red-500";
  if (score <= 3) return "text-amber-500";
  if (score <= 4) return "text-green-500";
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
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="text-4xl font-bold text-[#1B2A4A]">
          Master the Art of Case Frameworks
        </h1>
        <p className="max-w-lg text-lg text-[#6B7280]">
          Practice with real consulting cases. Present your framework. Get instant AI-powered feedback.
        </p>
        <Link
          href="/practice"
          className="rounded-lg bg-[#00A651] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#008C44]"
        >
          Start Practicing
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
            { label: "Average Score", value: `${stats.avgScore}/5` },
            { label: "Best Score", value: `${stats.bestScore}/5` },
            { label: "Day Streak", value: stats.streak },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-gray-100 bg-white p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-[#1B2A4A]">{stat.value}</p>
              <p className="text-xs text-[#6B7280]">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Sessions */}
      {!loading && sessions.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#1B2A4A]">Recent Sessions</h2>
          <div className="flex flex-col gap-3">
            {sessions.slice(0, 5).map((session) => {
              const caseData = cases.find((c) => c.id === session.caseId);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-[#1B2A4A]">{caseData?.title || session.caseId}</p>
                    <p className="text-xs text-[#6B7280]">{new Date(session.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-lg font-bold ${scoreColor(session.scores.overall)}`}>
                    {session.scores.overall}/5
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-[#1B2A4A]">Quick Tips</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: "Start Top-Down", body: "State your buckets upfront before diving into details. Signpost: \"I'd break this into three areas...\"" },
            { title: "Tailor Your Framework", body: "Avoid memorized structures. Build each framework specifically for the case prompt you're given." },
            { title: "Prioritize", body: "Tell the interviewer which bucket you'd explore first and why. This shows business judgment." },
          ].map((tip) => (
            <div key={tip.title} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-bold text-[#1B2A4A]">{tip.title}</h3>
              <p className="text-xs leading-relaxed text-[#6B7280]">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
