"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getSessionById } from "@/lib/storage";
import { cases } from "@/lib/cases";
import { SessionResult } from "@/lib/types";
import Scorecard from "@/components/Scorecard";

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const s = await getSessionById(id);
      setSession(s);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#00A651]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Session not found.</p>
      </div>
    );
  }

  const caseData = cases.find((c) => c.id === session.caseId);

  return (
    <div className="flex flex-col gap-6">
      {/* Header with case title and date */}
      <div>
        <button
          onClick={() => router.push("/")}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-black"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-black">{caseData?.title || session.caseId}</h1>
        <p className="mt-1 text-sm text-gray-500">{new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <Scorecard
        scores={session.scores}
        feedback={session.feedback}
        frameworkTime={session.frameworkTime}
        presentationTime={session.presentationTime}
        transcript={session.transcript}
        casePrompt={caseData?.prompt}
        onPracticeAgain={() => router.push("/practice")}
      />
    </div>
  );
}
