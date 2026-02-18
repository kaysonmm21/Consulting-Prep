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

    // ── Primary: Groq Whisper ────────────────────────────────────────────────
    if (process.env.GROQ_API_KEY) {
      const groqForm = new FormData();
      groqForm.append("file", audioFile);
      groqForm.append("model", "whisper-large-v3-turbo");
      groqForm.append("response_format", "json");
      groqForm.append("language", "en");

      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: groqForm,
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ transcript: data.text });
      }

      const errorText = await response.text();
      const isRetryable = response.status === 429 || response.status === 503;
      console.warn(`Groq Whisper failed (${response.status}): ${errorText}${isRetryable && process.env.GEMINI_API_KEY ? " — falling back to Gemini" : ""}`);

      if (!isRetryable || !process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: response.status === 429 ? "API quota exceeded — please wait and try again" : "Transcription failed" },
          { status: response.status }
        );
      }
    }

    // ── Fallback: Gemini audio transcription ─────────────────────────────────
    console.log("[transcribe] Using Gemini fallback");
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/webm";

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
