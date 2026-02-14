import { createBrowserClient } from "./supabase";
import { SessionResult } from "./types";

export async function saveSession(session: SessionResult): Promise<void> {
  const supabase = createBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("sessions").insert({
    user_id: user.id,
    case_id: session.caseId,
    date: session.date,
    transcript: session.transcript,
    framework_time: session.frameworkTime,
    presentation_time: session.presentationTime,
    scores: session.scores,
    feedback: session.feedback,
    showed_transcript: session.showedTranscript,
  });
}

export async function getSessions(): Promise<SessionResult[]> {
  const supabase = createBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("date", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    caseId: row.case_id,
    date: row.date,
    transcript: row.transcript,
    frameworkTime: row.framework_time,
    presentationTime: row.presentation_time,
    scores: row.scores,
    feedback: row.feedback,
    showedTranscript: row.showed_transcript,
  }));
}

export async function getStats() {
  const sessions = await getSessions();

  if (sessions.length === 0) {
    return { totalSessions: 0, avgScore: 0, bestScore: 0, streak: 0 };
  }

  const scores = sessions.map((s) => s.scores.overall);
  const avgScore = Math.round(
    (scores.reduce((a, b) => a + b, 0) / scores.length) * 20
  );
  const bestScore = Math.round(Math.max(...scores) * 20);

  // Calculate streak (consecutive days with sessions)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const checkDate = new Date(today);

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const hasSession = sessions.some((s) => s.date.startsWith(dateStr));
    if (hasSession) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { totalSessions: sessions.length, avgScore, bestScore, streak };
}
