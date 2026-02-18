import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "No transcription API key configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const tryGroqWhisper = async (model: string): Promise<string | null> => {
      if (!process.env.GROQ_API_KEY) return null;
      const form = new FormData();
      form.append("file", audioFile);
      form.append("model", model);
      form.append("response_format", "json");
      form.append("language", "en");
      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: form,
      });
      if (res.ok) { const data = await res.json(); return data.text ?? null; }
      const err = await res.text();
      const retryable = res.status === 429 || res.status === 503;
      console.warn(`Groq ${model} failed (${res.status}): ${err}`);
      return retryable ? null : "HARD_FAIL";
    };

    // ── 1. Groq whisper-large-v3-turbo ───────────────────────────────────────
    const turboResult = await tryGroqWhisper("whisper-large-v3-turbo");
    if (turboResult && turboResult !== "HARD_FAIL") {
      return NextResponse.json({ transcript: turboResult });
    }
    if (turboResult === "HARD_FAIL") {
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    // ── 2. Groq whisper-large-v3 (fallback model) ────────────────────────────
    console.log("[transcribe] Trying whisper-large-v3...");
    const v3Result = await tryGroqWhisper("whisper-large-v3");
    if (v3Result && v3Result !== "HARD_FAIL") {
      return NextResponse.json({ transcript: v3Result });
    }

    // ── 3. Gemini audio transcription ────────────────────────────────────────
    console.log("[transcribe] Using Gemini fallback");
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    // Strip codec suffix (e.g. "audio/webm;codecs=opus" → "audio/webm")
    const mimeType = (audioFile.type || "audio/webm").split(";")[0];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: audioBase64 } },
              { text: "Transcribe this audio exactly as spoken. Return only the transcript text — no commentary, labels, or formatting." },
            ],
          }],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const geminiError = await geminiRes.text();
      console.error("Gemini transcription fallback failed:", geminiRes.status, geminiError);
      return NextResponse.json(
        { error: "Transcription failed — both providers unavailable, please try again" },
        { status: 503 }
      );
    }

    const geminiData = await geminiRes.json();
    const transcript = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return NextResponse.json({ transcript });

  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
