import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const groqForm = new FormData();
    groqForm.append("file", audioFile);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("response_format", "json");
    groqForm.append("language", "en");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Whisper error:", response.status, errorText);
      return NextResponse.json(
        { error: response.status === 429 ? "API quota exceeded — please wait and try again" : "Transcription failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ transcript: data.text });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
