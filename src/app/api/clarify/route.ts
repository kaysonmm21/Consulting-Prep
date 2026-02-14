import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { casePrompt, question, previousQuestions } = body;

    if (!casePrompt || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const previousQAContext =
      previousQuestions && previousQuestions.length > 0
        ? previousQuestions
            .map((q: { question: string; answer: string }, i: number) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}`)
            .join("\n\n")
        : "None yet.";

    const prompt = `You are a consulting interviewer at a top firm (McKinsey, BCG, or Bain). A candidate has just read the case prompt and is now asking clarifying questions before building their framework.

## Your Role
- Act as a friendly but professional interviewer
- Answer reasonable clarifying questions concisely (1-3 sentences)
- If the candidate asks something too specific or dives into analysis they should figure out themselves, politely deflect with something like: "That's something I'd want you to explore in your framework" or "Great question — I'd like to see how you think about that in your analysis"
- Do NOT give away the answer to the case or reveal the key insight
- Stay in character at all times
- Keep answers brief — this is a timed exercise

## Case Prompt
${casePrompt}

## Previous Questions in This Session
${previousQAContext}

## Candidate's Current Question
${question}

Respond with ONLY a JSON object in this exact format (no markdown, no code fences, just raw JSON):
{"answer": "Your concise interviewer response here"}`;

    const fetchGemini = async () => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 512,
              responseMimeType: "application/json",
            },
          }),
        }
      );
      return res;
    };

    let response = await fetchGemini();

    // Retry once after a short delay for transient errors (429, 500, 503)
    if (response.status === 429 || response.status === 500 || response.status === 503) {
      console.warn(`Gemini API returned ${response.status}, retrying in 2s...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      response = await fetchGemini();
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      const isQuota = response.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota");
      const isOverloaded = response.status === 503 || errorText.includes("UNAVAILABLE");
      return NextResponse.json(
        {
          error: isQuota
            ? "API quota exceeded — please wait a minute and try again"
            : isOverloaded
              ? "The AI model is temporarily overloaded — please try again in a moment"
              : `Clarify API failed (status ${response.status})`,
        },
        { status: isQuota ? 429 : isOverloaded ? 503 : 500 }
      );
    }

    const data = await response.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip markdown code fences if present
    const fenceMatch = content.trim().match(/^```(?:json|JSON)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) {
      content = fenceMatch[1].trim();
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // If JSON parse fails, treat the raw text as the answer
      result = { answer: content.trim() };
    }

    return NextResponse.json({ answer: result.answer || result.Answer || content.trim() });
  } catch (err) {
    console.error("Clarify error:", err);
    const message =
      err instanceof TypeError && err.message.includes("fetch")
        ? "Network error — could not reach the AI API"
        : `Clarify failed: ${err instanceof Error ? err.message : "unexpected error"}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
